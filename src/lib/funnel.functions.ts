import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const getFunnelSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ days: z.number().int().min(1).max(90).default(7) }).parse)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    // Pull recent events (cap 5000 to stay under default limit)
    const { data: events, error } = await supabaseAdmin
      .from("analytics_events")
      .select("event, session_id, user_id, path, utm_source, utm_medium, utm_campaign, referrer, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const rows = events ?? [];
    const totals: Record<string, number> = {};
    const byPath: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const sessions = new Set<string>();
    for (const r of rows) {
      totals[r.event] = (totals[r.event] || 0) + 1;
      if (r.path) byPath[r.path] = (byPath[r.path] || 0) + 1;
      const src = r.utm_source || (r.referrer ? new URL(r.referrer.startsWith("http") ? r.referrer : `https://${r.referrer}`).hostname : "direct");
      bySource[src] = (bySource[src] || 0) + 1;
      if (r.session_id) sessions.add(r.session_id);
    }

    const pageViews = totals["page_view"] || 0;
    const demoViews = (totals["demo_view"] || 0) + (totals["landing_demo_generate_start"] || 0);
    const demoSuccess = (totals["demo_generate_success"] || 0) + (totals["landing_demo_generate_success"] || 0);
    const ctaClicks = totals["cta_click"] || 0;

    const topPaths = Object.entries(byPath).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topSources = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return {
      sinceISO: since,
      eventCount: rows.length,
      uniqueSessions: sessions.size,
      pageViews,
      demoViews,
      demoSuccess,
      ctaClicks,
      conversionRate: demoViews > 0 ? Math.round((demoSuccess / demoViews) * 1000) / 10 : 0,
      topEvents: Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 15),
      topPaths,
      topSources,
      recent: rows.slice(0, 50),
    };
  });
