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

function wrapError(e: any): never {
  console.error("[server-fn] error:", e);
  throw new Error(e?.message || (typeof e === "string" ? e : "Something went wrong. Please try again."));
}

export const createCarousel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(5).max(4000),
      audience: z.string().max(200).optional(),
      tone: z.string().max: undefined as never,
    }).parse,
  )
  .handler(async () => ({}) as never);
