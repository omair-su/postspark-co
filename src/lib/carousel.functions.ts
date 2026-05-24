import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateCarousel, rewriteSlideClaude } from "@/server/carousel.server";

const FREE_MONTHLY_LIMIT = 10;

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

export const createCarousel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(5).max(2000),
      audience: z.string().max(200).optional(),
      tone: z.string().max(50).optional(),
      slideCount: z.number().int().min(6).max(10).default(8),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { slides: [], hashtags: [], caption: "", error: "Rate limit reached. Wait a minute." };

    const usage = await checkPlan(supabase, userId);
    if (!usage.ok) return { slides: [], hashtags: [], caption: "", error: "LIMIT_REACHED" };

    // Pull brand name for personalization
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("brand_name")
      .eq("user_id", userId)
      .maybeSingle();

    const result = await generateCarousel({
      topic: data.topic,
      audience: data.audience,
      tone: data.tone,
      slideCount: data.slideCount,
      brandName: (kit as any)?.brand_name || null,
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
        },
      },
    } as any);

    return result;
  });

export const rewriteSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().max(200),
      body: z.string().max(800),
      kind: z.enum(["cover", "content", "cta"]),
      instruction: z.string().max(300).optional(),
      tone: z.string().max(50).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { title: data.title, body: data.body, error: "Rate limit. Try again." };
    const usage = await checkPlan(supabase, userId);
    if (!usage.ok) return { title: data.title, body: data.body, error: "LIMIT_REACHED" };
    const r = await rewriteSlideClaude(data);
    return r;
  });
