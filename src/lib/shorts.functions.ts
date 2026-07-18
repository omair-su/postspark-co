import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateShortsScript, generateShortsSeriesScripts } from "@/server/shorts.server";

const FREE_MONTHLY_LIMIT = 3;
const TOOL = "shorts_studio";

const RATE_BUCKET = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(userId) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 10) {
    RATE_BUCKET.set(userId, arr);
    return true;
  }
  arr.push(now);
  RATE_BUCKET.set(userId, arr);
  return false;
}

export const generateShorts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      inputText: z.string().min(20).max(50_000),
      platform: z.enum(["tiktok", "shorts", "reels"]),
      duration: z.union([z.literal(30), z.literal(45), z.literal(60)]),
      angle: z.string().max(120).optional(),
      language: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (rateLimited(userId)) {
      return { script: null, error: "Rate limit: wait a minute and try again." };
    }

    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    if (!isPro) {
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());
      if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return { script: null, error: "LIMIT_REACHED" };
      }
    }

    let brandVoiceSummary = "";
    if (isPro) {
      const { data: voice } = await supabase
        .from("brand_voices").select("style_summary")
        .eq("user_id", userId).eq("is_active", true).maybeSingle();
      brandVoiceSummary = voice?.style_summary || "";
    }

    const result = await generateShortsScript({
      inputText: data.inputText,
      platform: data.platform,
      duration: data.duration,
      angle: data.angle,
      brandVoiceSummary,
      language: data.language,
    });

    if (result.error || !result.script) {
      return { script: null, error: result.error || "Generation failed" };
    }

    let jobId: string | null = null;
    try {
      const { data: inserted } = await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        tool: TOOL,
        input_text: data.inputText,
        title: result.script.title?.slice(0, 200) || "Shorts script",
        outputs: result.script as any,
      } as any).select("id").single();
      jobId = inserted?.id ?? null;
    } catch (e) {
      console.error("shorts history insert failed", e);
    }

    return { script: result.script, jobId };
  });

export const getShortsUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabase, userId } = context;
      const { data: profile } = await supabase
        .from("profiles").select("plan").eq("user_id", userId).maybeSingle();
      const plan = profile?.plan || "free";
      if (plan === "pro" || plan === "agency") return { used: 0, limit: -1, plan };
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());
      return { used: count ?? 0, limit: FREE_MONTHLY_LIMIT, plan };
    } catch (e) {
      console.error("[getShortsUsage] failed", e);
      return { used: 0, limit: FREE_MONTHLY_LIMIT, plan: "free" as const };
    }
  });

export const generateShortsSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      inputText: z.string().min(20).max(50_000),
      platform: z.enum(["tiktok", "shorts", "reels"]),
      duration: z.union([z.literal(30), z.literal(45), z.literal(60)]),
      language: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { scripts: [], error: "Rate limit: wait a minute and try again." };

    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) return { scripts: [], error: "PRO_REQUIRED" };

    let brandVoiceSummary = "";
    const { data: voice } = await supabase
      .from("brand_voices").select("style_summary")
      .eq("user_id", userId).eq("is_active", true).maybeSingle();
    brandVoiceSummary = voice?.style_summary || "";

    const result = await generateShortsSeriesScripts({
      inputText: data.inputText,
      platform: data.platform,
      duration: data.duration,
      brandVoiceSummary,
      language: data.language,
    });
    if (result.error || result.scripts.length === 0) {
      return { scripts: [], error: result.error || "Series generation failed" };
    }

    const seriesId = crypto.randomUUID();
    const rows = result.scripts.map((s, i) => ({
      user_id: userId,
      tool: TOOL,
      input_text: data.inputText,
      title: `${s.title?.slice(0, 180) || "Shorts ep"} — Ep ${i + 1}`,
      outputs: s as any,
      series_id: seriesId,
      series_index: i + 1,
    }));
    let jobIds: string[] = [];
    try {
      const { data: inserted } = await supabase.from("repurpose_jobs").insert(rows as any).select("id");
      jobIds = (inserted || []).map((r: any) => r.id);
    } catch (e) {
      console.error("series insert failed", e);
    }
    return { scripts: result.scripts, seriesId, jobIds };
  });

export const findBroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ query: z.string().min(1).max(200) }).parse)
  .handler(async ({ data }) => {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return { clips: [], error: "Pexels not configured" };

    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(data.query)}&orientation=portrait&per_page=6`;
      const res = await fetch(url, { headers: { Authorization: apiKey } });
      if (!res.ok) return { clips: [], error: `Pexels error: ${res.status}` };
      const json: any = await res.json();
      const clips = (json.videos || []).map((v: any) => ({
        id: v.id,
        image: v.image,
        video_url:
          v.video_files?.find((f: any) => f.quality === "sd" && f.link)?.link ||
          v.video_files?.[0]?.link ||
          "",
        duration: v.duration,
      }));
      return { clips, error: null };
    } catch (e: any) {
      return { clips: [], error: e?.message || "Fetch failed" };
    }
  });
