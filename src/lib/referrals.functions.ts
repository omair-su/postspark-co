import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: refs } = await supabase
      .from("referrals")
      .select("id, status, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const list = (refs || []) as Array<{ id: string; status: string; created_at: string }>;
    return {
      code: profile?.referral_code || null,
      total: list.length,
      rewarded: list.filter((r) => r.status === "rewarded").length,
      pending: list.filter((r) => r.status === "pending").length,
      items: list,
    };
  });
