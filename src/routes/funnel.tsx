import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Eye, MousePointerClick, Sparkles, TrendingUp, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const TITLE = "PostSpark Funnel — Live Public Stats";
const DESC = "Live demo views, conversions and CTA clicks across PostSpark. Updated continuously.";

export const Route = createFileRoute("/funnel")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublicFunnelPage,
});

type Summary = {
  days: number;
  since: string;
  uniqueSessions: number;
  pageViews: number;
  demoViews: number;
  demoSuccess: number;
  ctaClicks: number;
  demoConversionPct: number;
  ctaPerSessionPct: number;
  topSources: [string, number][];
  topEvents: [string, number][];
};

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function PublicFunnelPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/funnel?days=${d}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
  }, [days]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Activity className="h-3.5 w-3.5" /> Live · public
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                PostSpark Funnel
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                A transparent look at how visitors move through the demo and CTAs. Aggregated counts only — no
                personal data.
              </p>
            </div>
            <div className="flex gap-2">
              {[1, 7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    days === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  {d === 1 ? "24h" : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error} ·{" "}
              <button onClick={() => load(days)} className="font-semibold underline">
                Retry
              </button>
            </div>
          )}

          {loading && !data && (
            <div className="mt-6 text-sm text-muted-foreground">Loading funnel…</div>
          )}

          {data && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Stat icon={Users} label="Sessions" value={data.uniqueSessions} />
                <Stat icon={Eye} label="Page views" value={data.pageViews} />
                <Stat icon={Sparkles} label="Demo views" value={data.demoViews} />
                <Stat icon={TrendingUp} label="Demo success" value={data.demoSuccess} />
                <Stat
                  icon={Activity}
                  label="Demo conv."
                  value={`${data.demoConversionPct}%`}
                  hint="success / views"
                />
                <Stat
                  icon={MousePointerClick}
                  label="CTA clicks"
                  value={data.ctaClicks}
                  hint={`${data.ctaPerSessionPct}% / session`}
                />
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Top sources
                  </h2>
                  <ul className="mt-3 divide-y divide-border">
                    {data.topSources.length === 0 && (
                      <li className="py-2 text-sm text-muted-foreground">No data yet.</li>
                    )}
                    {data.topSources.map(([src, n]) => (
                      <li key={src} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-foreground">{src}</span>
                        <span className="font-mono text-muted-foreground">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Top events
                  </h2>
                  <ul className="mt-3 divide-y divide-border">
                    {data.topEvents.length === 0 && (
                      <li className="py-2 text-sm text-muted-foreground">No data yet.</li>
                    )}
                    {data.topEvents.map(([ev, n]) => (
                      <li key={ev} className="flex items-center justify-between py-2 text-sm">
                        <span className="font-mono text-foreground">{ev}</span>
                        <span className="font-mono text-muted-foreground">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                Window: last {data.days} day{data.days === 1 ? "" : "s"} · since{" "}
                {new Date(data.since).toLocaleString()}
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
