import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateRepurposedContent } from "@/server/repurpose.server";

const FREE_MONTHLY_LIMIT = 10;

// Per-instance rate limiter: max 10 AI calls / minute / user
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
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

export const getMonthlyUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    if (isPro) {
      return { used: 0, limit: -1, plan };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("repurpose_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) {
      console.error("Usage count error:", error);
      return { used: 0, limit: FREE_MONTHLY_LIMIT, plan };
    }

    return { used: count ?? 0, limit: FREE_MONTHLY_LIMIT, plan };
  });

export const repurposeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      inputText: z.string().min(1).max(50000),
      selectedTypes: z.array(z.string().min(1).max(20)).min(1).max(10),
      tone: z.string().max(50).optional(),
      customInstructions: z.string().max(500).optional(),
      language: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (rateLimited(userId)) {
      return { output: "", error: "Rate limit: please wait a minute and try again." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    if (!isPro) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

      if (!countError && (count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return { output: "", error: "LIMIT_REACHED" };
      }
    }

    // Fetch active brand voice (Pro feature) to personalize output
    let brandVoiceSummary = "";
    if (isPro) {
      const { data: activeVoice } = await supabase
        .from("brand_voices")
        .select("style_summary")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      brandVoiceSummary = activeVoice?.style_summary || "";
    }

    // Auto-apply Brand Kit preferred tone if user didn't explicitly choose one
    let effectiveTone = data.tone || "professional";
    let brandContext = "";
    let brandKitId: string | null = null;
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("id, brand_name, tagline, preferred_tone")
      .eq("user_id", userId)
      .maybeSingle();
    if (kit) {
      const k = kit as any;
      brandKitId = k.id ?? null;
      if (!data.tone && k.preferred_tone) effectiveTone = k.preferred_tone;
      const parts: string[] = [];
      if (k.brand_name) parts.push(`Brand: ${k.brand_name}`);
      if (k.tagline) parts.push(`Tagline: ${k.tagline}`);
      if (parts.length) brandContext = parts.join(" | ");
    }

    // Resolve active workspace (Agency users)
    let workspaceId: string | null = null;
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (membership?.workspace_id) workspaceId = membership.workspace_id as string;

    const mergedInstructions = brandContext
      ? `${data.customInstructions || ""}${data.customInstructions ? " " : ""}Brand context — ${brandContext}.`.trim()
      : (data.customInstructions || "");

    const result = await generateRepurposedContent(
      data.inputText,
      data.selectedTypes,
      effectiveTone,
      mergedInstructions,
      brandVoiceSummary,
      data.language || "English"
    );

    if (!result.error && result.output) {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        input_text: data.inputText,
        outputs: { raw: result.output },
        brand_kit_id: brandKitId,
        workspace_id: workspaceId,
      } as any);
    }

    return result;
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      isFavorite: z.boolean(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("repurpose_jobs")
      .update({ is_favorite: data.isFavorite })
      .eq("id", data.jobId)
      .eq("user_id", userId);

    if (error) {
      console.error("Toggle favorite error:", error);
      return { success: false };
    }
    return { success: true };
  });

export const getAnalyticsData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: jobs, error } = await supabase
      .from("repurpose_jobs")
      .select("id, created_at, input_text, outputs")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Analytics error:", error);
      return { jobs: [] };
    }

    return { jobs: jobs || [] };
  });

export const bulkDeleteJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, count } = await supabase
      .from("repurpose_jobs")
      .delete({ count: "exact" })
      .in("id", data.ids)
      .eq("user_id", userId);
    if (error) {
      console.error("Bulk delete error:", error);
      return { success: false, deleted: 0 };
    }
    return { success: true, deleted: count ?? 0 };
  });
