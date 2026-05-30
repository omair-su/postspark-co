import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Repeat, Sparkles, Clock, TrendingUp, Zap, Wand2, Flame, Image as ImageIcon, FileText, ArrowUpRight, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthlyUsage } from "@/lib/repurpose.functions";
import { GuidedIntakeModal, type IntakeKind } from "@/components/GuidedIntakeModal";
import { DailySpark } from "@/components/DailySpark";
import { ActivationChecklist } from "@/components/ActivationChecklist";
import { CardSkeleton, ListSkeleton } from "@/components/skeletons";
import { StreakBadge } from "@/components/StreakBadge";
import { ReferralBanner } from "@/components/ReferralBanner";

const WIDGETS: Array<{ id: IntakeKind; title: string; emoji: string; description: string }> = [
  { id: "founder-lesson", title: "Founder Lesson", emoji: "🚀", description: "Turn a lesson into thread + LinkedIn + email." },
  { id: "creator-playbook", title: "Creator Playbook", emoji: "✍️", description: "Repurpose a content tip into shareable posts." },
  { id: "product-launch", title: "Product Launch", emoji: "🎉", description: "Launch-ready announcements for product or feature." },
  { id: "marketing-tip", title: "Marketing Tip", emoji: "📈", description: "Turn a marketing insight into platform-native posts." },
];

const QUICK_ACTIONS = [
  { to: "/dashboard/hook-lab", label: "Hook Lab", icon: Flame },
  { to: "/dashboard/image-studio", label: "Image Studio", icon: ImageIcon },
  { to: "/dashboard/seo-blog", label: "SEO Blog", icon: FileText },
  { to: "/dashboard/carousel", label: "Carousel", icon: Sparkles },
] as const;

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user, session } = useAuth();
  
  const [usage, setUsage] = useState<{ used: number; limit: number; plan?: string } | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; created_at: string; input_text: string; outputs?: Record<string, any>; tool?: string }>>([]);
  const [allJobDates, setAllJobDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [intakeKind, setIntakeKind] = useState<IntakeKind | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !session) return;

    getMonthlyUsage({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(setUsage)
      .catch(() => {});

    (supabase as any)
      .from("repurpose_jobs")
      .select("id, created_at, input_text, outputs, tool")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any }) => {
        if (data) {
          setTotalJobs(data.length);
          setRecentJobs(data.slice(0, 5));
          setAllJobDates(data.map((d: any) => d.created_at));
        }
        setLoading(false);
      });

    try {
      const raw = localStorage.getItem("ps:gen:latencies");
      if (raw) {
        const arr: number[] = JSON.parse(raw).slice(-20);
        if (arr.length) setLatencyMs(Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));
      }
    } catch {}
  }, [user, session]);

  // 14-day sparkline buckets
  const sparkline = useMemo(() => {
    const days = 14;
    const buckets = Array(days).fill(0);
    const now = Date.now();
    for (const ts of allJobDates) {
      const diff = Math.floor((now - new Date(ts).getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff]++;
    }
    const max = Math.max(1, ...buckets);
    return buckets.map((v) => Math.max(8, (v / max) * 100));
  }, [allJobDates]);

  // 30-day sparkline for Command Center
  const monthSpark = useMemo(() => {
    const days = 30;
    const buckets = Array(days).fill(0);
    const now = Date.now();
    for (const ts of allJobDates) {
      const diff = Math.floor((now - new Date(ts).getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff]++;
    }
    const max = Math.max(1, ...buckets);
    return { bars: buckets.map((v) => Math.max(6, (v / max) * 100)), total: buckets.reduce((a, b) => a + b, 0) };
  }, [allJobDates]);

  const avgFormats = useMemo(() => {
    if (!recentJobs.length) return 0;
    const counts = recentJobs.map((j) => Object.keys(j.outputs || {}).length);
    return Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10;
  }, [recentJobs]);


  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "there";
  const plan = usage?.plan || "free";
  const isUnlimited = usage?.limit === -1;

  return (
    <div className="mx-auto max-w-6xl ds-fade-up space-y-6">
      {/* Hero header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight ds-gradient-text sm:text-4xl">
            Welcome back, {name.split(" ")[0]}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ds-muted-text">
            <span className="inline-flex items-center gap-1.5">
              <span className="ds-status-dot" /> AI online
            </span>
            <span className="text-white/20">·</span>
            <span className="capitalize">{plan} plan</span>
            {usage && (
              <>
                <span className="text-white/20">·</span>
                <span>
                  {usage.used}
                  {isUnlimited ? "" : ` / ${usage.limit}`} this month
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="ds-chip"><Activity className="h-3 w-3 text-[#a78bfa]" /> Live</span>
          <span className="ds-chip">
            <span className="font-mono text-[10px] text-white/60">⌘K</span>
            <span>Command</span>
          </span>
        </div>
      </div>

      {/* Hero CTA + quick actions */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="ds-card-hero relative p-6 sm:p-8">
          <span className="ds-eyebrow">
            <Sparkles className="h-3 w-3" /> AI Content Operating System
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-[26px]">
            Turn one idea into an entire content drop.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            LinkedIn posts, X threads, newsletters, thumbnails, video scripts — generated on-brand in seconds.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to="/dashboard/repurpose" className="ds-cta-pill">
              <Sparkles className="h-4 w-4" /> New Repurpose
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard/templates"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/[0.08]"
            >
              Browse templates
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="ds-card ds-card-hover flex items-center gap-3 p-4"
            >
              <div className="ds-icon-disc h-9 w-9">
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="ds-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider ds-muted-text">This month</p>
                  <p className="ds-stat-num mt-1 text-3xl">{usage?.used ?? 0}</p>
                </div>
                <div className="ds-icon-disc h-9 w-9">
                  <Repeat className="h-4 w-4" />
                </div>
              </div>
              {usage && !isUnlimited && (
                <div className="mt-4">
                  <div className="ds-progress">
                    <div style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] ds-muted-text">
                    {usage.used} / {usage.limit} repurposes
                    {usage.used >= usage.limit && (
                      <>
                        {" · "}
                        <Link to="/dashboard/settings" className="font-medium text-[#c4b5fd] underline">
                          Upgrade
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              )}
              {isUnlimited && (
                <p className="mt-4 text-[11px] ds-muted-text">Unlimited on {plan}</p>
              )}
            </div>

            <div className="ds-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider ds-muted-text">All-time</p>
                  <p className="ds-stat-num mt-1 text-3xl">{totalJobs}</p>
                </div>
                <div className="ds-icon-disc h-9 w-9">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="ds-spark mt-4" aria-hidden>
                {sparkline.map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="mt-2 text-[11px] ds-muted-text">Last 14 days</p>
            </div>

            <div className="ds-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider ds-muted-text">Plan</p>
                  <p className="ds-stat-num mt-1 text-3xl capitalize">{plan}</p>
                </div>
                <div className="ds-icon-disc h-9 w-9">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <Link
                to="/dashboard/settings"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#c4b5fd] hover:underline"
              >
                Manage subscription <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Command Center — premium ops snapshot */}
      <div className="ds-card-hero p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
              <Activity className="h-3 w-3" /> Command Center
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Your AI operations this month</h2>
          </div>
          <Link to="/dashboard/history" className="text-xs font-medium text-[#c4b5fd] hover:underline">
            View history →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* 30-day sparkline */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-wider ds-muted-text">Generations · last 30 days</p>
              <p className="text-2xl font-bold ds-gradient-text">{monthSpark.total}</p>
            </div>
            <div className="ds-spark mt-3" aria-hidden style={{ height: 56 }}>
              {monthSpark.bars.map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Latency + avg formats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-wider ds-muted-text">Avg latency</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {latencyMs ? `${(latencyMs / 1000).toFixed(1)}s` : "—"}
              </p>
              <p className="mt-1 text-[10px] ds-muted-text">Rolling avg, last 20 runs</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-wider ds-muted-text">Avg formats / job</p>
              <p className="mt-1 text-2xl font-bold text-white">{avgFormats || "—"}</p>
              <p className="mt-1 text-[10px] ds-muted-text">From recent generations</p>
            </div>
          </div>
        </div>

        {/* Recent outputs strip */}
        {recentJobs.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] uppercase tracking-wider ds-muted-text">Recent outputs</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {recentJobs.slice(0, 4).map((j) => {
                const formats = Object.keys(j.outputs || {});
                return (
                  <Link
                    key={j.id}
                    to="/dashboard/history"
                    className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 hover:border-[#a78bfa]/40 hover:bg-white/[0.05]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/90">
                        {j.input_text.slice(0, 60)}{j.input_text.length > 60 ? "…" : ""}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-1">
                        {formats.slice(0, 4).map((f) => (
                          <span key={f} className="rounded-sm bg-[#7c3aed]/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#c4b5fd]">
                            {f.replace(/_/g, " ").slice(0, 10)}
                          </span>
                        ))}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors group-hover:text-[#c4b5fd]" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Streak / Referral / DailySpark row — keep existing components, premium framing */}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ds-card p-4 lg:col-span-1"><StreakBadge /></div>
        <div className="ds-card p-4 lg:col-span-2"><ReferralBanner /></div>
      </div>
      <div className="ds-card p-4"><DailySpark /></div>
      <div className="ds-card p-4"><ActivationChecklist /></div>

      {/* Guided content tools */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Wand2 className="h-4 w-4 text-[#a78bfa]" /> Guided Content Studios
            </h2>
            <p className="text-xs ds-muted-text">
              Pick a flavor — answer a few prompts — get a tailored multi-format drop.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WIDGETS.map((w) => (
            <button
              key={w.id}
              onClick={() => setIntakeKind(w.id)}
              className="ds-card ds-card-hover group flex items-start gap-3 p-4 text-left"
            >
              <span className="text-2xl leading-none">{w.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{w.title}</p>
                <p className="mt-0.5 text-xs ds-muted-text">{w.description}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#c4b5fd] opacity-0 transition-opacity group-hover:opacity-100">
                  Open studio <ArrowUpRight className="h-3 w-3" />
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <GuidedIntakeModal
        kind={intakeKind}
        open={intakeKind !== null}
        onClose={() => setIntakeKind(null)}
      />

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        {loading ? (
          <div className="mt-4">
            <ListSkeleton rows={3} />
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="ds-card mt-4 p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-white/40" />
            <p className="mt-3 text-sm font-medium text-white">No repurposes yet</p>
            <p className="mt-1 text-xs ds-muted-text">Your generations will surface here as you create.</p>
            <Link
              to="/dashboard/repurpose"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#a78bfa]/40 bg-[#7c3aed]/30 px-4 py-2 text-sm font-semibold text-white hover:bg-[#7c3aed]/45"
            >
              <Sparkles className="h-3.5 w-3.5" /> Run your first repurpose
            </Link>
          </div>
        ) : (
          <div className="ds-card mt-4 divide-y divide-white/5">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to="/dashboard/history"
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <p className="truncate text-sm text-white/85 max-w-xl">
                  {job.input_text.slice(0, 80)}
                  {job.input_text.length > 80 ? "…" : ""}
                </p>
                <span className="whitespace-nowrap font-mono text-[11px] text-white/40">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
