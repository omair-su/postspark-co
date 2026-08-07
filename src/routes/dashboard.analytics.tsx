import { HeroArt } from "@/components/dashboard/HeroArt";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { getAnalyticsData } from "@/lib/repurpose.functions";
import { BarChart3, PieChart, Type, Flame, TrendingUp, Sparkles } from "lucide-react";

interface JobData {
  id: string;
  created_at: string;
  input_text: string;
  outputs: Record<string, any> | null;
}

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { session } = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    getAnalyticsData({
      headers: { Authorization: `Bearer ${session.access_token}` },
    } as any)
      .then((res) => {
        setJobs((res.jobs as any) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  // Compute stats
  const totalJobs = jobs.length;
  const totalWords = jobs.reduce((sum, j) => {
    const outputText = Object.values(j.outputs || {}).join(" ");
    return sum + outputText.split(/\s+/).filter(Boolean).length;
  }, 0);

  // Format usage counts
  const formatCounts: Record<string, number> = {};
  for (const j of jobs) {
    for (const key of Object.keys(j.outputs || {})) {
      if (key === "raw") continue;
      formatCounts[key] = (formatCounts[key] || 0) + 1;
    }
  }
  const topFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxFormatCount = Math.max(...topFormats.map(([, v]) => v), 1);

  // Weekly activity (last 8 weeks)
  const weeklyData: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = jobs.filter((j) => {
      const d = new Date(j.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    weeklyData.push({
      label: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    });
  }
  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

  // Streak calculation
  const daySet = new Set(
    jobs.map((j) => new Date(j.created_at).toISOString().slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daySet.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="h-7 w-40 rounded bg-accent animate-pulse" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="h-8 w-16 animate-pulse rounded bg-accent" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-accent" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <section className="psx-hero ps-elev-2 ds-fade-up relative overflow-hidden p-6 sm:p-7" data-page="analytics">
        <span className="ps-ambient" aria-hidden />
        <HeroArt art="hero" />
        <div className="relative">
          <p className="psx-hero-eyebrow mb-1">Analytics</p>
          <h1 className="psx-hero-title">Know what's <em>working</em></h1>
          <p className="psx-hero-desc mt-1">Track your content creation performance.</p>
        </div>
      </section>


      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard icon={BarChart3} label="Total Repurposes" value={totalJobs} />
        <StatCard icon={Type} label="Words Generated" value={totalWords.toLocaleString()} />
        <StatCard icon={Flame} label="Day Streak" value={streak} accent />
        <StatCard icon={TrendingUp} label="Formats Used" value={Object.keys(formatCounts).length} />
      </div>

      {/* Weekly activity chart */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Weekly Activity
        </h2>
        <div className="mt-4 flex items-end gap-2 h-32">
          {weeklyData.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{w.count}</span>
              <div
                className="w-full rounded-t-md gradient-electric transition-all duration-500"
                style={{ height: `${Math.max(4, (w.count / maxWeekly) * 100)}%` }}
              />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Format breakdown */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" /> Most Used Formats
        </h2>
        {topFormats.length === 0 ? (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-foreground">No data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Run your first repurpose and this chart fills in automatically.</p>
            <Link
              to="/dashboard/repurpose"
              className="mt-3 inline-flex items-center gap-2 rounded-lg gradient-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Start repurposing
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {topFormats.map(([format, count]) => (
              <div key={format} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground capitalize">{format}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-accent">
                  <div
                    className="h-2 rounded-full gradient-electric transition-all duration-500"
                    style={{ width: `${(count / maxFormatCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "gradient-electric" : "bg-accent"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-primary-foreground" : "text-accent-foreground"}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
