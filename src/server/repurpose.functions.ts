import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase as browserSupabase } from "@/integrations/supabase/client";
import { generateRepurposedContent } from "./repurpose.server";

const FREE_MONTHLY_LIMIT = 3;

const attachSupabaseAuthHeader = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await browserSupabase.auth.getSession();
  const token = data.session?.access_token;

  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});

export const getMonthlyUsage = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Check subscription plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    if (isPro) {
      return { used: 0, limit: -1, plan }; // -1 = unlimited
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
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator(
    z.object({
      inputText: z.string().min(1).max(50000),
      selectedTypes: z.array(z.string().min(1).max(20)).min(1).max(4),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check subscription plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    // Check monthly usage only for free users
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

    const result = await generateRepurposedContent(data.inputText, data.selectedTypes);

    // Save to DB on success
    if (!result.error && result.output) {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        input_text: data.inputText,
        outputs: { raw: result.output },
      });
    }

    return result;
  });
