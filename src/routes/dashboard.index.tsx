import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Repeat, Sparkles, Clock, TrendingUp, Zap, Flame, Image as ImageIcon, FileText,
  ArrowUpRight, ChevronRight, Activity, Layers, Wand2, MessageSquare, Mic, Calendar, Bookmark, Cpu, Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthlyUsage } from "@/lib/repurpose.functions";

import { DailySpark } from "@/components/DailySpark";
import { ActivationChecklist } from "@/components/ActivationChecklist";
import { StreakBadge } from "@/components/StreakBadge";
import { ReferralBanner } from "@/components/ReferralBanner";
import { AskBar } from "@/components/dashboard/AskBar";
import { CountUp } from "@/components/dashboard/CountUp";


const WIDGETS: Array<{ to: string; title: string; emoji: string; description: string; outputs: string[]; accent: string; badge?: string; badgeKind?: "popular" | "new" }> = [
  { to: "/dashboard/guided/founder-lesson", title: "Founder Lesson", emoji: "🚀", description: "Turn a lesson into authority content with scored hooks.", outputs: ["LinkedIn", "Thread", "Email"], accent: "var(--psx-repurpose)", badge: "Most Popular", badgeKind: "popular" },
  { to: "/dashboard/guided/creator-playbook", title: "Creator Playbook", emoji: "✍️", description: "Knowledge → 10-slide carousels, threads & captions.", outputs: ["Carousel", "Thread", "IG"], accent: "var(--psx-podcast)" },
  { to: "/dashboard/guided/product-launch", title: "Product Launch", emoji: "🚀", description: "Launch copy for Shopify, ads, email & every channel.", outputs: ["Shopify", "FB Ad", "Email"], accent: "var(--psx-carousel)", badge: "New", badgeKind: "new" },
  { to: "/dashboard/guided/marketing-tip", title: "Marketing Tip", emoji: "📊", description: "One insight → a week of authority content.", outputs: ["LinkedIn", "Newsletter", "Thread"], accent: "var(--psx-seo)" },
];

const TOOLS: Array<{ to: string; label: string; icon: any; description: string; accent: string; popular?: boolean }> = [
  { to: "/dashboard/repurpose", label: "Repurpose Studio", icon: Repeat, description: "One source → every platform, on-brand.", accent: "var(--psx-repurpose)", popular: true },
  { to: "/dashboard/publish", label: "Publish to X", icon: Send, description: "Compose, thread & schedule tweets with live preview.", accent: "var(--psx-publish)" },
  { to: "/dashboard/hook-lab", label: "Hook Lab", icon: Flame, description: "10 hooks per idea, scored & A/B ready.", accent: "var(--psx-hook)" },
  { to: "/dashboard/shorts-studio", label: "Shorts Studio", icon: Cpu, description: "Idea → 60s TikTok/Reels/Shorts script.", accent: "var(--psx-shorts)" },
  { to: "/dashboard/image-studio", label: "Image Studio", icon: ImageIcon, description: "Brand-aware visuals & post graphics.", accent: "var(--psx-image)" },
  { to: "/dashboard/carousel", label: "Carousel Generator", icon: Layers, description: "Multi-slide LinkedIn / X carousels.", accent: "var(--psx-carousel)" },
  { to: "/dashboard/seo-blog", label: "SEO Blog", icon: FileText, description: "Long-form articles tuned to rank.", accent: "var(--psx-seo)" },
  { to: "/dashboard/thumbnail", label: "Thumbnail / Cover", icon: ImageIcon, description: "YouTube & podcast covers in seconds.", accent: "var(--psx-thumbnail)" },
  { to: "/dashboard/humanizer", label: "AI Humanizer", icon: Wand2, description: "Make AI text feel handwritten.", accent: "var(--psx-humanizer)" },
];

function activityIcon(job: { input_text: string; tool?: string; outputs?: Record<string, any> }) {
  const t = (job.tool || "").toLowerCase();
  if (t.includes("image") || t.includes("thumbnail")) return ImageIcon;
  if (t.includes("hook")) return Flame;
  if (t.includes("seo") || t.includes("blog")) return FileText;
  if (t.includes("repurpose")) return Repeat;
  return Repeat;
}

function tagClass(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("linkedin")) return "psx-tag-linkedin";
  if (l.includes("thread") || l === "x") return "psx-tag-threads";
  if (l.includes("email") || l.includes("newsletter")) return "psx-tag-email";
  if (l.includes("ig") || l.includes("instagram")) return "psx-tag-instagram";
  if (l.includes("shopify")) return "psx-tag-shopify";
  return "psx-tag-neutral";
}

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PostSpark" },
      { name: "description", content: "Your PostSpark command center: track usage, jump into Repurpose, Hook Lab, Shorts Studio, and recent generations." },
      { property: "og:title", content: "PostSpark Dashboard" },
      { property: "og:description", content: "Your AI content repurposing command center." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const { user, session } = useAuth();

  const [usage, setUsage] = useState<{ used: number; limit: number; plan?: string } | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; created_at: string; input_text: string; outputs?: Record<string, any>; tool?: string }>>([]);
  const [allJobDates, setAllJobDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
  const activeDaysCount = allJobDates.length ? sparkline.filter((v) => v > 8).length : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <section className="psx-dash-hero px-5 py-7 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="psx-pill" style={{ borderColor: "var(--psx-border)" }}>
              <span className="psx-dot-live" />
              AI CONTENT OPERATING SYSTEM
            </span>

            <p className="mt-4 text-sm" style={{ color: "var(--psx-text-2)" }}>Welcome back,</p>
            <h1 className="text-[32px] font-extrabold tracking-tight sm:text-[40px]" style={{ color: "var(--psx-purple)" }}>
              {name.split(" ")[0]}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="psx-model-badge psx-model-claude">
                <span className="psx-model-dot" />
                Claude Sonnet 5 online
              </span>
              {latencyMs && (
                <span className="font-mono text-[12px]" style={{ color: "var(--psx-text-muted)" }}>{(latencyMs / 1000).toFixed(1)}s avg</span>
              )}
              <span className={`psx-pill ${plan !== "free" ? "psx-pill-pro" : ""}`}>
                {plan === "free" ? "Free plan" : <>✦ {plan.toUpperCase()} PLAN</>}
              </span>
              {usage && (
                <span className="text-[12px]" style={{ color: "var(--psx-text-2)" }}>
                  {usage.used}{isUnlimited ? "" : `/${usage.limit}`} this month
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Link to="/dashboard/templates" className="psx-pill hover:border-[color:var(--psx-purple)]">
              <Bookmark className="h-3.5 w-3.5" /> Templates
            </Link>
            <Link to="/dashboard/repurpose" className="psx-btn-primary px-3.5 py-2 text-[13px]">
              <Sparkles className="h-4 w-4" /> New Repurpose
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <AskBar />
        </div>
      </section>

      {/* Stats row */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="psx-card-stat p-4 flex items-center gap-3">
          <div className="psx-icon-wrap" style={{ background: "rgba(124,58,237,0.12)", color: "var(--psx-purple)" }}>
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="psx-stat-label">Today</p>
            <p className="psx-stat-number mt-1"><CountUp value={todayCount} /></p>
            <p className="mt-1 text-xs" style={{ color: "var(--psx-text-2)" }}>generations</p>
          </div>
        </div>

        <div className="psx-card-stat p-4 flex items-center gap-3">
          <div className="psx-icon-wrap" style={{ background: "rgba(249,115,22,0.14)", color: "#f97316" }}>
            <Flame className="h-4 w-4" />
          </div>
          <StreakBadge variant="stat" />
        </div>

        <Link to="/dashboard/calendar" className="psx-card-stat psx-card-interactive p-4 flex items-center gap-3 group">
          <div className="psx-icon-wrap" style={{ background: "rgba(8,145,178,0.14)", color: "#0891b2" }}>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="psx-stat-label">Calendar</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--psx-text)" }}>Plan your next drop</p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "var(--psx-text-muted)" }} />
        </Link>
      </section>

      {/* Momentum — last 14 days */}
      <section className="psx-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="psx-stat-label">Momentum · last 14 days</p>
          <p className="text-[11px] uppercase" style={{ color: "var(--psx-text-muted)" }}>
            {allJobDates.length ? `${activeDaysCount} active days` : "No activity yet"}
          </p>
        </div>
        <div className="mt-4 flex items-end gap-1.5">
          {sparkline.slice(-14).map((v, i, arr) => {
            const isToday = i === arr.length - 1;
            const isActive = v > 8;
            return (
              <span
                key={i}
                className={`psx-momentum-pill ${isActive ? "psx-momentum-active" : ""} ${isToday ? "psx-momentum-today" : ""}`}
                style={{ height: isToday ? 32 : 28, ["--psx-delay" as any]: `${i * 50}ms` }}
                title={isToday ? "Today" : undefined}
              />
            );
          })}
        </div>
      </section>

      {/* Studio grid — pick your superpower */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="psx-section-title"><span className="psx-section-dot" /> Studios</p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--psx-text)" }}>Pick your superpower</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <Link
              key={t.to}
              to={t.to}
              className="psx-studio-card psx-card-animate group relative p-4"
              style={{ ["--psx-accent" as any]: t.accent, ["--psx-delay" as any]: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="psx-icon-wrap" style={{ background: "color-mix(in srgb, var(--psx-accent) 14%, transparent)", color: t.accent }}>
                  <t.icon className="h-4 w-4" />
                </div>
                {t.popular && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#fef9c3", color: "#854d0e" }}>
                    Most used
                  </span>
                )}
                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: t.popular ? undefined : "var(--psx-text-muted)" }} />
              </div>
              <p className="mt-3 text-[15px] font-semibold" style={{ color: "var(--psx-text)" }}>{t.label}</p>
              <p className="mt-1 truncate text-[13px]" style={{ color: "var(--psx-text-2)" }}>{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Command Center — premium ops snapshot */}
      <section className="psx-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="psx-section-title"><span className="psx-section-dot" /> Command Center</p>
            <h2 className="mt-2 text-xl font-semibold sm:text-2xl" style={{ color: "var(--psx-text)" }}>Your AI operations this month</h2>
          </div>
          <Link to="/dashboard/history" className="text-xs font-medium hover:underline" style={{ color: "var(--psx-purple)" }}>
            View history →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* 30-day sparkline */}
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--psx-border-soft)", background: "var(--psx-card-hover)" }}>
            <div className="flex items-baseline justify-between">
              <p className="psx-stat-label">Generations · last 30 days</p>
              <p className="text-2xl font-bold" style={{ color: "var(--psx-purple)" }}>{monthSpark.total}</p>
            </div>
            <div className="mt-3 flex items-end gap-[3px]" style={{ height: 56 }} aria-hidden>
              {monthSpark.bars.map((h, i) => (
                <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: "var(--psx-grad)", opacity: 0.85 }} />
              ))}
            </div>
          </div>

          {/* Latency + avg formats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--psx-border-soft)", background: "var(--psx-card-hover)" }}>
              <p className="psx-stat-label">Avg latency</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--psx-text)" }}>{latencyMs ? `${(latencyMs / 1000).toFixed(1)}s` : "—"}</p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--psx-text-muted)" }}>Rolling avg, last 20 runs</p>
            </div>
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--psx-border-soft)", background: "var(--psx-card-hover)" }}>
              <p className="psx-stat-label">Avg formats / job</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--psx-text)" }}>{avgFormats || "—"}</p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--psx-text-muted)" }}>From recent generations</p>
            </div>
          </div>
        </div>

        {/* Recent outputs strip */}
        {recentJobs.length > 0 && (
          <div className="mt-5">
            <p className="psx-stat-label mb-2">Recent outputs</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {recentJobs.slice(0, 4).map((j) => {
                const formats = Object.keys(j.outputs || {});
                return (
                  <Link
                    key={j.id}
                    to="/dashboard/history"
                    className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    style={{ border: "1px solid var(--psx-border-soft)" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium" style={{ color: "var(--psx-text)" }}>
                        {j.input_text.slice(0, 60)}{j.input_text.length > 60 ? "…" : ""}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-1">
                        {formats.slice(0, 4).map((f) => (
                          <span key={f} className="psx-tag psx-tag-neutral">
                            {f.replace(/_/g, " ").slice(0, 10)}
                          </span>
                        ))}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-colors" style={{ color: "var(--psx-text-muted)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Referral + Daily Spark */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ReferralBanner />
        <DailySpark />
      </section>

      <ActivationChecklist />

      {/* Guided studios */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="psx-section-title"><span className="psx-section-dot" /> Guided Studios</p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--psx-text)" }}>Answer a few prompts — get a full drop</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WIDGETS.map((w) => (
            <Link
              key={w.to}
              to={w.to}
              className="psx-card psx-card-interactive group relative overflow-hidden p-5"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: w.accent }} />
              <div className="flex items-start justify-between gap-2">
                <span className="psx-icon-wrap text-xl" style={{ background: "color-mix(in srgb, " + w.accent + " 14%, transparent)" }}>
                  {w.emoji}
                </span>
                {w.badge && (
                  <span className={w.badgeKind === "popular" ? "psx-badge-popular" : "psx-badge-new"}>{w.badge}</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold" style={{ color: "var(--psx-text)" }}>{w.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--psx-text-2)" }}>{w.description}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {w.outputs.map((o) => (
                    <span key={o} className={`psx-tag ${tagClass(o)}`}>{o}</span>
                  ))}
                </div>
                <span className="text-[11px] font-medium group-hover:underline" style={{ color: "var(--psx-purple)" }}>Start →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--psx-text)" }}>Recent Activity</h2>
          {recentJobs.length > 0 && (
            <Link to="/dashboard/history" className="text-xs font-medium hover:underline" style={{ color: "var(--psx-purple)" }}>
              View all →
            </Link>
          )}
        </div>
        {loading ? (
          <div className="psx-shimmer h-40" />
        ) : recentJobs.length === 0 ? (
          <div className="psx-empty">
            <Sparkles className="psx-empty-illustration h-10 w-10" />
            <p className="mt-3 text-base font-semibold" style={{ color: "var(--psx-text)" }}>Your first spark is waiting</p>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed" style={{ color: "var(--psx-text-2)" }}>
              Turn one idea into 10 platform-ready posts. Your recent generations will surface here.
            </p>
            <Link to="/dashboard/repurpose" className="psx-btn-primary mt-4 px-4 py-2 text-[13px]">
              <Sparkles className="h-3.5 w-3.5" /> Run your first repurpose
            </Link>
          </div>
        ) : (
          <div className="psx-card overflow-hidden">
            {recentJobs.map((job, i) => {
              const Icon = activityIcon(job);
              return (
                <Link
                  key={job.id}
                  to="/dashboard/history"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--psx-card-hover)]"
                  style={i < recentJobs.length - 1 ? { borderBottom: "1px solid var(--psx-border-soft)" } : undefined}
                >
                  <div className="psx-icon-wrap-sm shrink-0" style={{ background: "rgba(124,58,237,0.1)", color: "var(--psx-purple)" }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--psx-text)" }}>
                    {job.input_text.slice(0, 80)}{job.input_text.length > 80 ? "…" : ""}
                  </p>
                  <span className="psx-tag psx-tag-neutral whitespace-nowrap font-mono">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--psx-text-muted)" }} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
