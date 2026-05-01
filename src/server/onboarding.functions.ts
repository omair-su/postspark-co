import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      role: z.string().min(1).max(60),
      platforms: z.array(z.string().min(1).max(40)).max(20),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("profiles")
      .update({
        primary_role: data.role,
        primary_platforms: data.platforms,
        onboarding_completed: true,
      })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed, primary_role, primary_platforms")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      completed: Boolean(data?.onboarding_completed),
      role: data?.primary_role || null,
      platforms: (data?.primary_platforms || []) as string[],
    };
  });
