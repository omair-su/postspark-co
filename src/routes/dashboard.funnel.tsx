import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { isCurrentUserAdmin } from "@/lib/blogAdmin.functions";
import { getFunnelSummary } from "@/lib/funnel.functions";

export const Route = createFileRoute("/dashboard/funnel")({
  component: FunnelPage,
});

type Summary = Awaited<ReturnType<typeof getFunnelSummary>>;

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function FunnelPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    (async () => {
      try {
        const r = await isCurrentUserAdmin({ headers: { Authorization: `Bearer ${session.access_token}` } });
        setIsAdmin(r.isAdmin);
      } catch { setIsAdmin(false); }
      setChecking(false);
    })();
  }, [session, authLoading, navigate]);

  const load = async (d = days) => {
    if (!session) return;
    setLoading(true);
    try {
      const r = await getFunnelSummary({
        data: { days: d },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setData(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, days]);

  if (checking) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need the admin role to view the funnel.</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Back</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><TrendingUp className="h-6 w-6 text-primary" /> Growth Funnel</h1>
          <p className="text-sm text-muted-foreground">Live data from analytics_events. UTMs, page views, demo conversions.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value={1}>Last 24h</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={() => load()} className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {!data ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Events" value={data.eventCount.toLocaleString()} />
            <Stat label="Sessions" value={data.uniqueSessions.toLocaleString()} />
            <Stat label="Page views" value={data.pageViews.toLocaleString()} />
            <Stat label="Demo views" value={data.demoViews.toLocaleString()} />
            <Stat label="Demo success" value={data.demoSuccess.toLocaleString()} hint={`${data.conversionRate}% of demo views`} />
            <Stat label="CTA clicks" value={data.ctaClicks.toLocaleString()} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Top events</h2>
              <ul className="mt-3 space-y-1.5">
                {data.topEvents.map(([k, v]) => (
                  <li key={k} className="flex justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </li>
                ))}
                {data.topEvents.length === 0 && <li className="text-sm text-muted-foreground">No events yet.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Top paths</h2>
              <ul className="mt-3 space-y-1.5">
                {data.topPaths.map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-mono text-xs text-muted-foreground" title={k}>{k}</span>
                    <span className="font-semibold">{v}</span>
                  </li>
                ))}
                {data.topPaths.length === 0 && <li className="text-sm text-muted-foreground">No path data yet.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Top sources</h2>
              <ul className="mt-3 space-y-1.5">
                {data.topSources.map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-xs text-muted-foreground" title={k}>{k}</span>
                    <span className="font-semibold">{v}</span>
                  </li>
                ))}
                {data.topSources.length === 0 && <li className="text-sm text-muted-foreground">No source data yet.</li>}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Recent events (latest 50)</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Path</th>
                    <th className="py-2 pr-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-1.5 pr-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="py-1.5 pr-3 font-mono">{r.event}</td>
                      <td className="py-1.5 pr-3 font-mono text-muted-foreground">{r.path}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{r.utm_source || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
