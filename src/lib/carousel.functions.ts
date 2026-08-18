import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveActiveBrandKit } from "@/lib/activeBrandKit.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateCarousel, rewriteSlideClaude, regenerateCaption } from "@/lib/carousel.server";

const FREE_MONTHLY_LIMIT = 3;

const RATE_BUCKET = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(userId) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 12) {
    RATE_BUCKET.set(userId, arr);
    return true;
  }
  arr.push(now);
  RATE_BUCKET.set(userId, arr);
  return false;
}

async function checkPlan(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  const plan = profile?.plan || "free";
  if (plan === "pro" || plan === "agency") return { ok: true as const, plan };
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("repurpose_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());
  if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
    return { ok: false as const, plan, error: "LIMIT_REACHED" };
  }
  return { ok: true as const, plan };
}

function rethrow(e: any): never {
  console.error("[server-fn] error:", e);
  throw new Error(
    e?.message || (typeof e === "string" ? e : "Something went wrong. Please try again."),
  );
}

export const createCarousel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(5).max(4000),
      audience: z.string().max(200).optional(),
      tone: z.string().max(50).optional(),
      framework: z.string().max(40).optional(),
      depth: z.enum(["standard", "deep"]).default("deep"),
      slideCount: z.number().int().min(5).max(12).default(8),
      useBrandVoice: z.boolean().default(true),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const empty = { slides: [], hashtags: [], caption: "" };
      if (rateLimited(userId))
        return { ...empty, error: "Rate limit reached. Wait a minute." };

      const usage = await checkPlan(supabase, userId);
      if (!usage.ok) return { ...empty, error: "LIMIT_REACHED" };

      const kit = await resolveActiveBrandKit(supabase, userId);

      let brandVoice: string | null = null;
      if (data.useBrandVoice) {
        const { data: voice } = await supabase
          .from("brand_voices")
          .select("style_summary, style_override, cta_style, sentence_length, emoji_density")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();
        if (voice) {
          brandVoice =
            [
              voice.style_summary,
              voice.style_override,
              voice.cta_style ? `CTA style: ${voice.cta_style}` : null,
              voice.sentence_length ? `Sentence length: ${voice.sentence_length}` : null,
              voice.emoji_density ? `Emoji use: ${voice.emoji_density}` : null,
            ]
              .filter(Boolean)
              .join("\n") || null;
        }
      }

      const result = await generateCarousel({
        topic: data.topic,
        audience: data.audience,
        tone: data.tone,
        slideCount: data.slideCount,
        framework: data.framework,
        depth: data.depth,
        brandName: kit?.brand_name || null,
        brandVoice,
      });

      if (result.error) return result;

      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        tool: "carousel",
        input_text: data.topic,
        title: `Carousel: ${data.topic.slice(0, 60)}`,
        outputs: {
          carousel: {
            slides: result.slides,
            hashtags: result.hashtags,
            caption: result.caption,
            framework: data.framework || "listicle",
          },
        },
      } as any);

      return result;
    } catch (e: any) {
      rethrow(e);
    }
  });

export const rewriteSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().max(300),
      body: z.string().max(1200),
      kind: z.string().max(20),
      bullets: z.array(z.string().max(120)).max(4).optional(),
      action: z.enum(["rewrite", "shorten", "expand", "punchier", "concrete"]).default("rewrite"),
      instruction: z.string().max(400).optional(),
      tone: z.string().max(50).optional(),
      topic: z.string().max(400).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      if (rateLimited(userId))
        return { title: data.title, body: data.body, error: "Rate limit. Try again." };
      const usage = await checkPlan(supabase, userId);
      if (!usage.ok) return { title: data.title, body: data.body, error: "LIMIT_REACHED" };
      return await rewriteSlideClaude(data);
    } catch (e: any) {
      rethrow(e);
    }
  });

export const refreshCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(4000),
      tone: z.string().max(50).optional(),
      slides: z
        .array(z.object({ title: z.string().max(300), body: z.string().max(1200) }))
        .min(1)
        .max(12),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      if (rateLimited(userId)) return { caption: "", hashtags: [], error: "Rate limit. Try again." };
      const usage = await checkPlan(supabase, userId);
      if (!usage.ok) return { caption: "", hashtags: [], error: "LIMIT_REACHED" };
      return await regenerateCaption(data);
    } catch (e: any) {
      rethrow(e);
    }
  });
