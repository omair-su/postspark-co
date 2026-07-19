import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateFounderPosts } from "@/server/buildInPublic.server";

export const getMetricsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;

    // Pro gate
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).single();
    const plan = profile?.plan || "free";
    if (plan === "free") {
      return { ok: false as const, error: "Build-in-Public is a Pro feature." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 86400000).toISOString();

    const [{ count: signupsLast7d }, { count: repurposesLast7d }, { count: totalUsers }, { count: totalRepurposes }, subs, tools] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("repurpose_jobs").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("repurpose_jobs").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("price_id, status, current_period_end")
        .in("status", ["active", "trialing"]),
      supabaseAdmin
        .from("repurpose_jobs")
        .select("tool")
        .gte("created_at", since)
        .limit(1000),
    ]);

    // MRR calc (cents → USD approx by plan name)
    const PLAN_MRR: Record<string, number> = {
      pro_monthly: 24,
      pro_monthly_trial: 24,
      pro_annual: 19,
      agency_monthly: 49,
      agency_annual: 39,
      founding_lifetime_97: 0, // one-time
    };
    let mrrUsd = 0;
    for (const s of subs.data || []) {
      const id = (s as any).price_id as string;
      mrrUsd += PLAN_MRR[id] ?? 0;
    }

    const toolCounts: Record<string, number> = {};
    for (const r of tools.data || []) {
      const t = ((r as any).tool as string) || "repurpose";
      toolCounts[t] = (toolCounts[t] || 0) + 1;
    }
    const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "repurpose";

    return {
      ok: true as const,
      metrics: {
        signupsLast7d: signupsLast7d ?? 0,
        repurposesLast7d: repurposesLast7d ?? 0,
        totalUsers: totalUsers ?? 0,
        totalRepurposes: totalRepurposes ?? 0,
        mrrUsd,
        topTool,
      },
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });

export const generateBuildInPublicPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      tone: z.string().max(80).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).single();
    const plan = profile?.plan || "free";
    if (plan === "free") {
      return { posts: [], error: "Build-in-Public is a Pro feature." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [{ count: s7 }, { count: r7 }, { count: tu }, { count: tr }, subs, tools] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("repurpose_jobs").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("repurpose_jobs").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("price_id, status").in("status", ["active", "trialing"]),
      supabaseAdmin.from("repurpose_jobs").select("tool").gte("created_at", since).limit(1000),
    ]);
    const PLAN_MRR: Record<string, number> = {
      pro_monthly: 24, pro_monthly_trial: 24, pro_annual: 19, agency_monthly: 49, agency_annual: 39,
    };
    let mrrUsd = 0;
    for (const s of subs.data || []) mrrUsd += PLAN_MRR[(s as any).price_id] ?? 0;
    const toolCounts: Record<string, number> = {};
    for (const r of tools.data || []) {
      const t = ((r as any).tool as string) || "repurpose";
      toolCounts[t] = (toolCounts[t] || 0) + 1;
    }
    const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "repurpose";

    const result = await generateFounderPosts(
      {
        signupsLast7d: s7 ?? 0,
        repurposesLast7d: r7 ?? 0,
        totalUsers: tu ?? 0,
        totalRepurposes: tr ?? 0,
        mrrUsd,
        topTool,
      },
      data.tone,
    );
    return result;
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });
