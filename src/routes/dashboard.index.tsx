import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const [usage, setUsage] = useState<{ used: number; limit: number; plan?: string } | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; created_at: string; input_text: string }>>([]);
  const [allJobDates, setAllJobDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [intakeKind, setIntakeKind] = useState<IntakeKind | null>(null);

  useEffect(() => {
    if (!user || !session) return;

    getMonthlyUsage({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(setUsage)
      .catch(() => {});

    (supabase as any)
      .from("repurpose_jobs")
      .select("id, created_at, input_text")
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
        <Link
          to="/dashboard/repurpose"
          className="ds-card-hero group flex items-center justify-between gap-4 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="ds-icon-disc h-12 w-12">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">New Repurpose</p>
              <p className="mt-0.5 text-sm text-white/60">
                Transform one piece into LinkedIn, X, email, video — in seconds.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-all group-hover:bg-white/20">
            Start <ArrowUpRight className="h-4 w-4" />
          </div>
        </Link>

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
