import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractLinkedInVideo, isLinkedInUrl } from "@/server/linkedinDownloader.server";

const FREE_MONTHLY_LIMIT = 3;
const TOOL = "linkedin_downloader";

// Per-instance rate limiter: max 6 calls / minute / user
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;
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

async function countMonthly(supabase: any, userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("repurpose_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tool", TOOL)
    .gte("created_at", startOfMonth.toISOString());
  return count ?? 0;
}

export const getDownloaderUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (isPro) return { used: 0, limit: -1, plan };

    const used = await countMonthly(supabase, userId);
    return { used, limit: FREE_MONTHLY_LIMIT, plan };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const downloadLinkedInVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      url: z
        .string()
        .trim()
        .min(10)
        .max(500)
        .refine(isLinkedInUrl, { message: "Must be a public linkedin.com URL" }),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;

    if (rateLimited(userId)) {
      return { ok: false as const, error: "Rate limit: wait a moment and try again." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    if (!isPro) {
      const used = await countMonthly(supabase, userId);
      if (used >= FREE_MONTHLY_LIMIT) {
        return { ok: false as const, error: "LIMIT_REACHED" };
      }
    }

    const result = await extractLinkedInVideo(data.url);

    // Log to history (success or failure)
    await supabase.from("repurpose_jobs").insert({
      user_id: userId,
      input_text: data.url,
      title: result.ok ? result.title || "LinkedIn video" : "LinkedIn download failed",
      outputs: result.ok
        ? { video_url: result.videoUrl, poster_url: result.posterUrl || null, status: "success" }
        : { status: "error", error: result.error },
      tool: TOOL,
    } as any);

    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }
    return {
      ok: true as const,
      videoUrl: result.videoUrl,
      posterUrl: result.posterUrl,
      title: result.title,
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
