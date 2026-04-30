import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateRepurposedContent } from "./repurpose.server";

const FREE_MONTHLY_LIMIT = 3;

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
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

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

    const result = await generateRepurposedContent(
      data.inputText,
      data.selectedTypes,
      data.tone || "professional",
      data.customInstructions || ""
    );

    if (!result.error && result.output) {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        input_text: data.inputText,
        outputs: { raw: result.output },
      });
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
