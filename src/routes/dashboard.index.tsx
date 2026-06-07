import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Repeat, Sparkles, Clock, TrendingUp, Zap, Flame, Image as ImageIcon, FileText,
  ArrowUpRight, Activity, Layers, Wand2, MessageSquare, Mic, Calendar, Bookmark, Cpu,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthlyUsage } from "@/lib/repurpose.functions";
import { GuidedIntakeModal, type IntakeKind } from "@/components/GuidedIntakeModal";
import { DailySpark } from "@/components/DailySpark";
import { ActivationChecklist } from "@/components/ActivationChecklist";
import { StreakBadge } from "@/components/StreakBadge";
import { ReferralBanner } from "@/components/ReferralBanner";
import { AskBar } from "@/components/dashboard/AskBar";
import { StatTile } from "@/components/dashboard/StatTile";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ToolTile, type ToolTileItem } from "@/components/dashboard/ToolTile";

const WIDGETS: Array<{ id: IntakeKind; title: string; emoji: string; description: string }> = [
  { id: "founder-lesson", title: "Founder Lesson", emoji: "🚀", description: "Turn a lesson into thread + LinkedIn + email." },
  { id: "creator-playbook", title: "Creator Playbook", emoji: "✍️", description: "Repurpose a content tip into shareable posts." },
  { id: "product-launch", title: "Product Launch", emoji: "🎉", description: "Launch-ready announcements for product or feature." },
  { id: "marketing-tip", title: "Marketing Tip", emoji: "📈", description: "Turn a marketing insight into platform-native posts." },
];

const TOOLS: ToolTileItem[] = [
  { to: "/dashboard/repurpose", label: "Repurpose Studio", icon: Repeat, description: "One source → every platform, on-brand.", category: "#7C3AED", popular: true },
  { to: "/dashboard/hook-lab", label: "Hook Lab", icon: Flame, description: "10 hooks per idea, scored & A/B ready.", category: "#F97316" },
  { to: "/dashboard/image-studio", label: "Image Studio", icon: ImageIcon, description: "Brand-aware visuals & post graphics.", category: "#0891B2" },
  { to: "/dashboard/carousel", label: "Carousel Generator", icon: Layers, description: "Multi-slide LinkedIn / X carousels.", category: "#3B82F6" },
  { to: "/dashboard/seo-blog", label: "SEO Blog", icon: FileText, description: "Long-form articles tuned to rank.", category: "#059669" },
  { to: "/dashboard/thumbnail", label: "Thumbnail / Cover", icon: ImageIcon, description: "YouTube & podcast covers in seconds.", category: "#0891B2" },
  { to: "/dashboard/humanizer", label: "AI Humanizer", icon: Wand2, description: "Make AI text feel handwritten.", category: "#D97706" },
  { to: "/dashboard/reply-generator", label: "Reply Generator", icon: MessageSquare, description: "On-brand replies for any thread.", category: "#EC4899" },
];

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

  // "Today" metrics
  const todayCount = useMemo(() => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    return allJobDates.filter((ts) => new Date(ts).getTime() >= startOfDay.getTime()).length;
  }, [allJobDates]);

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "there";
  const plan = usage?.plan || "free";
  const isUnlimited = usage?.limit === -1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero — premium dark gradient with drifting orbs */}
      <section className="ds-card-hero ds-card-hero-dark p-6 sm:p-8 ds-fade-up">
        <div className="ds-hero-orbs" aria-hidden><span /></div>
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ds-eyebrow">
              <Cpu className="h-3 w-3" /> AI Content Operating System
            </p>
            <h1 className="ds-display ds-gradient-text mt-3 text-3xl sm:text-4xl">
              Welcome back, {name.split(" ")[0]}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="ds-status-dot" /> Claude Sonnet 4.5 online
              </span>
              {latencyMs && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="font-mono text-[12px] text-white/65">{(latencyMs / 1000).toFixed(1)}s avg</span>
                </>
              )}
              <span className="text-white/30">·</span>
              <span className="capitalize">{plan} plan</span>
              {usage && (
                <>
                  <span className="text-white/30">·</span>
                  <span>
                    {usage.used}{isUnlimited ? "" : ` / ${usage.limit}`} this month
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/dashboard/templates" className="ds-cta-ghost">
              <Bookmark className="h-4 w-4" /> Templates
            </Link>
            <Link to="/dashboard/repurpose" className="ds-cta-pill">
              <Sparkles className="h-4 w-4" /> New Repurpose
            </Link>
          </div>
        </div>

        <div className="relative mt-6">
          <AskBar />
        </div>
      </section>

      {/* Today rail */}
      <section className="grid gap-3 sm:grid-cols-3 ds-fade-up-2">
        <div className="ds-card p-4 flex items-center gap-3">
          <div className="ds-icon-disc h-10 w-10"><Activity className="h-4 w-4" /></div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] ds-muted-text">Today</p>
            <p className="ds-stat-num text-xl">{todayCount} <span className="text-xs font-normal text-white/50">generations</span></p>
          </div>
        </div>
        <div className="ds-card p-4 flex items-center gap-3">
          <div className="ds-icon-disc h-10 w-10"><Flame className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1"><StreakBadge /></div>
        </div>
        <Link to="/dashboard/calendar" className="ds-card ds-card-hover p-4 flex items-center gap-3 group">
          <div className="ds-icon-disc h-10 w-10"><Calendar className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] ds-muted-text">Calendar</p>
            <p className="text-sm font-medium text-white">Plan your next drop</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-white/30 group-hover:text-[#c4b5fd]" />
        </Link>
      </section>

      {/* Stats v2 */}
      <section className="grid gap-4 sm:grid-cols-3 ds-fade-up-3">
        {loading ? (
          <>
            <div className="ds-skeleton h-32" />
            <div className="ds-skeleton h-32" />
            <div className="ds-skeleton h-32" />
          </>
        ) : (
          <>
            <StatTile
              label="This month"
              value={usage?.used ?? 0}
              icon={<Repeat className="h-4 w-4" />}
              footer={
                usage && !isUnlimited ? (
                  <>
                    <div className="ds-progress">
                      <div style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] ds-muted-text">
                      {usage.used} / {usage.limit} repurposes
                      {usage.used >= usage.limit && (
                        <>
                          {" · "}
                          <Link to="/dashboard/settings" className="font-medium text-[#c4b5fd] underline">Upgrade</Link>
                        </>
                      )}
                    </p>
                  </>
                ) : isUnlimited ? (
                  <p className="text-[11px] ds-muted-text">Unlimited on {plan}</p>
                ) : null
              }
            />

            <StatTile
              label="All-time"
              value={totalJobs}
              icon={<TrendingUp className="h-4 w-4" />}
              footer={
                <>
                  <div className="ds-spark" aria-hidden>
                    {sparkline.map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
                  </div>
                  <p className="mt-2 text-[11px] ds-muted-text">Last 14 days</p>
                </>
              }
            />

            <StatTile
              label="Plan"
              value={<span className="capitalize">{plan}</span>}
              icon={<Zap className="h-4 w-4" />}
              footer={
                <Link to="/dashboard/settings" className="inline-flex items-center gap-1 text-xs font-medium text-[#c4b5fd] hover:underline">
                  Manage subscription <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
          </>
        )}
      </section>

      {/* Premium tool grid */}
      <section className="ds-fade-up-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="ds-eyebrow"><Wand2 className="h-3 w-3" /> Studios</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Pick your superpower</h2>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => <ToolTile key={t.to} item={t} />)}
        </div>
      </section>

      {/* Command Center — premium ops snapshot */}
      <section className="ds-card-hero p-5 sm:p-6 ds-fade-up-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ds-eyebrow"><Activity className="h-3 w-3" /> Command Center</p>
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
              {monthSpark.bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
            </div>
          </div>

          {/* Latency + avg formats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-wider ds-muted-text">Avg latency</p>
              <p className="mt-1 text-2xl font-bold text-white">{latencyMs ? `${(latencyMs / 1000).toFixed(1)}s` : "—"}</p>
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
      </section>

      {/* Momentum row — Referral + Daily Spark */}
      <section className="grid gap-4 lg:grid-cols-2 ds-fade-up-6">
        <ReferralBanner />
        <DailySpark />
      </section>

      <div className="ds-fade-up-6"><ActivationChecklist /></div>

      {/* Guided studios */}
      <section className="ds-fade-up-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="ds-eyebrow"><Mic className="h-3 w-3" /> Guided Studios</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Answer a few prompts — get a full drop</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WIDGETS.map((w) => (
            <button
              key={w.id}
              onClick={() => setIntakeKind(w.id)}
              className="ds-tool-tile text-left"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl leading-none">{w.emoji}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{w.title}</p>
                <p className="mt-1 text-[11px] ds-muted-text leading-relaxed">{w.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <GuidedIntakeModal
        kind={intakeKind}
        open={intakeKind !== null}
        onClose={() => setIntakeKind(null)}
      />

      {/* Recent activity */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Recent Activity</h2>
        {loading ? (
          <div className="ds-skeleton h-40" />
        ) : recentJobs.length === 0 ? (
          <EmptyState
            variant="shimmer"
            title="Your first spark is waiting"
            description="Turn one idea into 10 platform-ready posts. Your recent generations will surface here."
            cta={{ to: "/dashboard/repurpose", label: "Run your first repurpose" }}
          />
        ) : (
          <div className="ds-card divide-y divide-white/5">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to="/dashboard/history"
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <p className="truncate text-sm text-white/85 max-w-xl">
                  {job.input_text.slice(0, 80)}{job.input_text.length > 80 ? "…" : ""}
                </p>
                <span className="whitespace-nowrap font-mono text-[11px] text-white/40">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
