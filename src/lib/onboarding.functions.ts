import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      role: z.string().min(1).max(60),
      platforms: z.array(z.string().min(1).max(40)).max(20),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    try {
    const { userId } = context;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        primary_role: data.role,
        primary_platforms: data.platforms,
        onboarding_completed: true,
      })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
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
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
