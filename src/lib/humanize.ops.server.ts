/**
 * Humanizer server operations: quota, brand context, persistence.
 * Server-only.
 */

import { humanizeMultiPass, rewriteSingleSentence, type HumanizeSettings } from "./humanize.server";
import { resolveActiveBrandKit, brandKitPromptContext } from "./activeBrandKit.server";
import { countWords } from "./humanizeMetrics";
import type { HumanizerRunRow, HumanizeRunResponse } from "./humanizeTypes";

const FREE_MONTHLY_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;
const RATE_BUCKET = new Map<string, number[]>();

interface Ctx {
  supabase: any;
  userId: string;
}

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    RATE_BUCKET.set(userId, arr);
    return true;
  }
  arr.push(now);
  RATE_BUCKET.set(userId, arr);
  return false;
}

async function planFor(supabase: any, userId: string): Promise<{ plan: string; isPro: boolean }> {
  const { data } = await supabase.from("profiles").select("plan").eq("user_id", userId).maybeSingle();
  const plan = data?.plan || "free";
  return { plan, isPro: plan === "pro" || plan === "agency" };
}

async function monthlyUsage(supabase: any, userId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("repurpose_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());
  return count ?? 0;
}

async function brandContextFor(
  supabase: any,
  userId: string,
  useBrandVoice: boolean,
): Promise<{ brandVoice?: string; brandContext?: string }> {
  if (!useBrandVoice) return {};
  const [voiceRes, kit] = await Promise.all([
    supabase
      .from("brand_voices")
      .select("style_summary, tone_attributes, sample_snippets")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1),
    resolveActiveBrandKit(supabase, userId).catch(() => null),
  ]);

  const v = voiceRes?.data?.[0];
  const parts: string[] = [];
  if (v?.style_summary) parts.push(String(v.style_summary));
  if (Array.isArray(v?.tone_attributes) && v.tone_attributes.length) {
    parts.push(`Tone attributes: ${v.tone_attributes.slice(0, 12).join(", ")}`);
  }
  if (Array.isArray(v?.sample_snippets) && v.sample_snippets.length) {
    parts.push(
      `Authentic samples:\n${v.sample_snippets.slice(0, 3).map((s: string) => `- ${String(s).slice(0, 320)}`).join("\n")}`,
    );
  }

  return {
    brandVoice: parts.length ? parts.join("\n") : undefined,
    brandContext: brandKitPromptContext(kit) || undefined,
  };
}

/** Stable, non-reversible grouping key for versions of the same source text. */
export function hashSource(text: string): string {
  const norm = text.trim().slice(0, 4000).replace(/\s+/g, " ").toLowerCase();
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < norm.length; i++) {
    h1 = (h1 ^ norm.charCodeAt(i)) * 0x01000193 >>> 0;
    h2 = (h2 + norm.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}${norm.length.toString(36)}`;
}

export interface RunInput {
  text: string;
  intensity: "light" | "medium" | "strong";
  purpose?: string;
  style?: string;
  preserve?: string[];
  useBrandVoice: boolean;
  chunkIndex: number;
  chunkTotal: number;
  sourceHash?: string;
  persist: boolean;
}

export async function runHumanize(ctx: Ctx, data: RunInput): Promise<HumanizeRunResponse> {
  const { supabase, userId } = ctx;
  if (rateLimited(userId)) {
    return { output: "", error: "Rate limit: please wait a minute and try again." };
  }

  const { isPro } = await planFor(supabase, userId);
  // Quota is charged once per run, not once per long-form chunk.
  const chargesQuota = data.chunkIndex === 0;
  if (!isPro && chargesQuota) {
    const used = await monthlyUsage(supabase, userId);
    if (used >= FREE_MONTHLY_LIMIT) return { output: "", error: "LIMIT_REACHED" };
  }
  if (!isPro && data.chunkTotal > 2) {
    return { output: "", error: "LONGFORM_PRO_ONLY" };
  }

  const brand = await brandContextFor(supabase, userId, data.useBrandVoice);
  const settings: HumanizeSettings = {
    intensity: data.intensity,
    purpose: data.purpose,
    style: data.style,
    preserve: data.preserve,
    brandVoice: brand.brandVoice,
    brandContext: brand.brandContext,
    // Intermediate chunks skip the repair pass to keep long jobs responsive.
    skipCritique: data.chunkTotal > 1 && data.chunkIndex !== data.chunkTotal - 1,
  };

  const result = await humanizeMultiPass(data.text, settings);
  if (result.error || !result.output) {
    return { output: "", error: result.error || "Generation failed.", before: result.before };
  }

  let runId: string | undefined;
  let version = 1;

  if (data.persist) {
    const sourceHash = data.sourceHash || hashSource(data.text);
    const { data: prev } = await supabase
      .from("humanizer_runs")
      .select("version")
      .eq("user_id", userId)
      .eq("source_hash", sourceHash)
      .order("version", { ascending: false })
      .limit(1);
    version = (prev?.[0]?.version ?? 0) + 1;

    const { data: inserted } = await supabase
      .from("humanizer_runs")
      .insert({
        user_id: userId,
        source_hash: sourceHash,
        title: data.text.trim().replace(/\s+/g, " ").slice(0, 70),
        input_text: data.text,
        output_text: result.output,
        settings: {
          intensity: data.intensity,
          purpose: data.purpose,
          style: data.style,
          preserve: data.preserve,
          useBrandVoice: data.useBrandVoice,
        },
        metrics_before: result.before ?? {},
        metrics_after: result.after ?? {},
        meaning: result.meaning ?? {},
        version,
        word_count: countWords(result.output),
      } as any)
      .select("id")
      .maybeSingle();
    runId = inserted?.id;

    // Keep the shared monthly counter honest — one row per successful run.
    if (chargesQuota) {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        tool: "humanizer",
        input_text: data.text.slice(0, 8000),
        title: `Humanized (${data.intensity})`,
        outputs: { humanized: result.output.slice(0, 20000) },
      } as any);
    }
  }

  return {
    output: result.output,
    before: result.before,
    after: result.after,
    meaning: result.meaning,
    passes: result.passes,
    repaired: result.repaired,
    runId,
    version,
    brandVoiceApplied: Boolean(brand.brandVoice),
    usedBrandKit: Boolean(brand.brandContext),
  };
}

export async function rerollOneSentence(
  ctx: Ctx,
  data: {
    sentence: string;
    original: string;
    before: string;
    afterCtx: string;
    avoid: string[];
    intensity: "light" | "medium" | "strong";
    purpose?: string;
    style?: string;
    preserve?: string[];
    useBrandVoice: boolean;
  },
): Promise<{ text: string; error?: string }> {
  const { supabase, userId } = ctx;
  if (rateLimited(userId)) return { text: "", error: "Rate limit: please wait a minute." };
  const brand = await brandContextFor(supabase, userId, data.useBrandVoice);
  return rewriteSingleSentence({
    sentence: data.sentence,
    original: data.original,
    before: data.before,
    afterCtx: data.afterCtx,
    avoid: data.avoid,
    settings: {
      intensity: data.intensity,
      purpose: data.purpose,
      style: data.style,
      preserve: data.preserve,
      brandVoice: brand.brandVoice,
      brandContext: brand.brandContext,
    },
  });
}

const RUN_FIELDS =
  "id, title, source_hash, input_text, output_text, settings, metrics_before, metrics_after, meaning, version, word_count, created_at";

export async function fetchHumanizerRuns(ctx: Ctx, limit: number): Promise<{ runs: HumanizerRunRow[] }> {
  const { data, error } = await ctx.supabase
    .from("humanizer_runs")
    .select(RUN_FIELDS)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("humanizer history error", error);
    return { runs: [] };
  }
  return { runs: (data || []) as HumanizerRunRow[] };
}

export async function fetchRunVersions(ctx: Ctx, sourceHash: string): Promise<{ runs: HumanizerRunRow[] }> {
  const { data } = await ctx.supabase
    .from("humanizer_runs")
    .select(RUN_FIELDS)
    .eq("user_id", ctx.userId)
    .eq("source_hash", sourceHash)
    .order("version", { ascending: true });
  return { runs: (data || []) as HumanizerRunRow[] };
}

export async function removeHumanizerRun(ctx: Ctx, id: string): Promise<{ success: boolean }> {
  const { error } = await ctx.supabase
    .from("humanizer_runs")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.userId);
  return { success: !error };
}
