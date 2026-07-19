import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAgencyAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    if (profile?.plan !== "agency") {
      return { error: "AGENCY_REQUIRED", brands: [], totals: null };
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!membership) return { brands: [], totals: { jobs: 0, scheduled: 0, approvals: 0 } };

    const wsId = membership.workspace_id;

    const [{ data: kits }, { data: jobs }, { data: posts }, { data: approvals }] = await Promise.all([
      supabase.from("brand_kits").select("id, brand_name, primary_color").eq("workspace_id", wsId),
      supabase.from("repurpose_jobs").select("id, brand_kit_id, created_at").eq("workspace_id", wsId),
      supabase.from("scheduled_posts").select("id, brand_kit_id, status, platform").eq("workspace_id", wsId),
      supabase.from("approval_requests").select("id, status, decided_at, created_at").eq("workspace_id", wsId),
    ]);

    const byBrand = (kits || []).map((k) => ({
      id: k.id,
      brandName: k.brand_name || "Untitled",
      color: k.primary_color || "#7c3aed",
      jobs: (jobs || []).filter((j: any) => j.brand_kit_id === k.id).length,
      scheduled: (posts || []).filter((p: any) => p.brand_kit_id === k.id).length,
      published: (posts || []).filter((p: any) => p.brand_kit_id === k.id && p.status === "published").length,
    }));

    const approvedTimes = (approvals || [])
      .filter((a: any) => a.status === "approved" && a.decided_at)
      .map((a: any) => new Date(a.decided_at).getTime() - new Date(a.created_at).getTime());
    const avgApprovalHours = approvedTimes.length
      ? approvedTimes.reduce((a, b) => a + b, 0) / approvedTimes.length / 3_600_000
      : 0;

    return {
      brands: byBrand,
      totals: {
        jobs: (jobs || []).length,
        scheduled: (posts || []).length,
        approvals: (approvals || []).length,
        avgApprovalHours: Math.round(avgApprovalHours * 10) / 10,
      },
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });
