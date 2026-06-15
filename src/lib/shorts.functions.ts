import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateShortsScript } from "@/server/shorts.server";

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

    try {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        tool: TOOL,
        input_text: data.inputText,
        title: result.script.title?.slice(0, 200) || "Shorts script",
        outputs: result.script as any,
      } as any);
    } catch (e) {
      console.error("shorts history insert failed", e);
    }

    return { script: result.script };
  });

export const getShortsUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).single();
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
  });
