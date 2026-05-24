import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Public, read-only funnel preview. Aggregated counts only (no PII, no session IDs, no paths beyond counts).
export const Route = createFileRoute("/api/public/funnel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const daysRaw = parseInt(url.searchParams.get("days") || "7", 10);
        const days = Math.min(30, Math.max(1, isNaN(daysRaw) ? 7 : daysRaw));
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabaseAdmin
          .from("analytics_events")
          .select("event, session_id, utm_source, created_at")
          .gte("created_at", since)
          .limit(5000);

        if (error) {
          return Response.json({ error: "stats_unavailable" }, { status: 500 });
        }

        const rows = data ?? [];
        const totals: Record<string, number> = {};
        const sources: Record<string, number> = {};
        const sessions = new Set<string>();
        for (const r of rows) {
          totals[r.event] = (totals[r.event] || 0) + 1;
          if (r.session_id) sessions.add(r.session_id);
          const s = (r.utm_source || "direct").toLowerCase().slice(0, 40);
          sources[s] = (sources[s] || 0) + 1;
        }

        const pageViews = totals["page_view"] || 0;
        const demoViews =
          (totals["demo_view"] || 0) + (totals["landing_demo_generate_start"] || 0);
        const demoSuccess =
          (totals["demo_generate_success"] || 0) + (totals["landing_demo_generate_success"] || 0);
        const ctaClicks = totals["cta_click"] || 0;

        return Response.json({
          days,
          since,
          uniqueSessions: sessions.size,
          pageViews,
          demoViews,
          demoSuccess,
          ctaClicks,
          demoConversionPct:
            demoViews > 0 ? Math.round((demoSuccess / demoViews) * 1000) / 10 : 0,
          ctaPerSessionPct:
            sessions.size > 0 ? Math.round((ctaClicks / sessions.size) * 1000) / 10 : 0,
          topSources: Object.entries(sources)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8),
          topEvents: Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12),
        });
      },
    },
  },
});
