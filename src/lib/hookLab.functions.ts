import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateViralHooks, remixSingleHook, generateHookSeriesArc } from "@/lib/hookLab.server";

const PLATFORM = z.enum(["twitter", "linkedin", "instagram", "tiktok", "youtube", "threads", "facebook"]);

async function proGate(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  const plan = profile?.plan || "free";
  return plan === "pro" || plan === "agency";
}

async function activeVoice(supabase: any, userId: string) {
  const { data: voice } = await supabase
    .from("brand_voices")
    .select("style_summary")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return voice?.style_summary || "";
}

export const generateHooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      platform: PLATFORM,
      niche: z.string().max(80).optional(),
      audience: z.string().max(200).optional(),
      format: z.enum(["text", "spoken", "both"]).optional(),
      frameworks: z.array(z.string()).max(15).optional(),
      tone: z.string().max(50).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (!(await proGate(supabase, userId))) {
      return { hooks: [], error: "Viral Hook Lab is a Pro feature. Upgrade to unlock.", jobId: null as string | null };
    }

    const brandVoiceSummary = await activeVoice(supabase, userId);

    const result = await generateViralHooks(data.topic, data.platform, brandVoiceSummary, {
      niche: data.niche,
      audience: data.audience,
      format: data.format,
      frameworks: data.frameworks,
      tone: data.tone,
    });

    let jobId: string | null = null;
    if (!result.error && result.hooks?.length) {
      const outputs: Record<string, string> = {};
      result.hooks.slice(0, 20).forEach((h: any, i: number) => {
        const txt = typeof h === "string" ? h : (h.text || h.hook || JSON.stringify(h));
        outputs[`hook_${i + 1}`] = txt;
      });
      try {
        const { data: job } = await supabase
          .from("repurpose_jobs")
          .insert({
            user_id: userId,
            tool: "hook_lab",
            input_text: data.topic,
            title: `Hooks for ${data.platform}: ${data.topic.slice(0, 80)}`,
            outputs,
            hook_variants: result.hooks.slice(0, 20) as any,
          } as any)
          .select("id")
          .single();
        jobId = job?.id || null;
      } catch (e) {
        console.error("hook_lab history insert error:", e);
      }
    }

    return { ...result, jobId };
  });

export const remixHook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      hook: z.string().min(5).max(1000),
      platform: PLATFORM,
      mode: z.enum(["remix", "shorten", "tone"]).default("remix"),
      tone: z.string().max(50).default("Direct/Raw"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await proGate(supabase, userId))) {
      return { hooks: [], error: "Hook remix is a Pro feature. Upgrade to unlock." };
    }
    const voice = await activeVoice(supabase, userId);
    return remixSingleHook(data.hook, data.platform, data.mode, data.tone, voice);
  });

export const generateHookSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      hook: z.string().min(5).max(1000),
      platform: PLATFORM,
      topic: z.string().max(500).default(""),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await proGate(supabase, userId))) {
      return { posts: [], error: "Series mode is a Pro feature. Upgrade to unlock." };
    }
    const voice = await activeVoice(supabase, userId);
    return generateHookSeriesArc(data.hook, data.platform, data.topic, voice);
  });

/** Persist an A/B pair against a job and (optionally) the chosen winner. */
export const saveHookAbPair = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      variants: z
        .array(z.object({ text: z.string().max(1000), framework: z.string().max(120).default("") }))
        .min(2)
        .max(2),
      winnerIndex: z.number().int().min(0).max(1).nullable().default(null),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("repurpose_jobs")
      .update({
        hook_variants: data.variants as any,
        winning_hook_index: data.winnerIndex,
      } as any)
      .eq("id", data.jobId)
      .eq("user_id", userId);
    if (error) {
      console.error("ab pair save error", error);
      return { success: false };
    }
    return { success: true };
  });

/** Win-rate per framework across the user's saved A/B results. */
export const getHookWinStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({}).parse)
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows } = await supabase
      .from("repurpose_jobs")
      .select("hook_variants, winning_hook_index")
      .eq("user_id", userId)
      .eq("tool", "hook_lab")
      .not("winning_hook_index", "is", null)
      .limit(200);

    const tally: Record<string, { wins: number; total: number }> = {};
    (rows || []).forEach((r: any) => {
      const variants = Array.isArray(r.hook_variants) ? r.hook_variants : [];
      variants.forEach((v: any, i: number) => {
        const key = String(v?.framework || "Unlabelled").split(/[+,/]/)[0].trim() || "Unlabelled";
        tally[key] = tally[key] || { wins: 0, total: 0 };
        tally[key].total += 1;
        if (i === r.winning_hook_index) tally[key].wins += 1;
      });
    });

    const stats = Object.entries(tally)
      .map(([framework, v]) => ({
        framework,
        wins: v.wins,
        total: v.total,
        winRate: v.total ? Math.round((v.wins / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.total - a.total);

    return { stats };
  });
