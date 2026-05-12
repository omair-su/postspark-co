import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Repeat, Sparkles, Clock, TrendingUp, Zap, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthlyUsage } from "@/lib/repurpose.functions";
import { GuidedIntakeModal, type IntakeKind } from "@/components/GuidedIntakeModal";

const WIDGETS: Array<{ id: IntakeKind; title: string; emoji: string; description: string }> = [
  { id: "founder-lesson", title: "Founder Lesson", emoji: "🚀", description: "Turn a lesson into thread + LinkedIn + email." },
  { id: "creator-playbook", title: "Creator Playbook", emoji: "✍️", description: "Repurpose a content tip into shareable posts." },
  { id: "product-launch", title: "Product Launch", emoji: "🎉", description: "Launch-ready announcements for product or feature." },
  { id: "marketing-tip", title: "Marketing Tip", emoji: "📈", description: "Turn a marketing insight into platform-native posts." },
];

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<{ used: number; limit: number; plan?: string } | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; created_at: string; input_text: string }>>([]);
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
        }
        setLoading(false);
      });
  }, [user, session]);

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "there";
  const plan = usage?.plan || "free";
  const isUnlimited = usage?.limit === -1;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Welcome to PostSpark 👋</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here's your content repurposing overview.</p>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
              <Repeat className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{usage?.used ?? 0}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <TrendingUp className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalJobs}</p>
              <p className="text-xs text-muted-foreground">Total all time</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground capitalize">{plan}</p>
              <p className="text-xs text-muted-foreground">Current plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage progress */}
      {usage && !isUnlimited && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Monthly Usage</span>
            <span className="text-muted-foreground">{usage.used} / {usage.limit} repurposes</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-accent">
            <div
              className="h-2 rounded-full gradient-electric transition-all duration-500"
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
            />
          </div>
          {usage.used >= usage.limit && (
            <p className="mt-2 text-xs text-destructive">
              You've hit your limit.{" "}
              <Link to="/dashboard/settings" className="font-medium underline">Upgrade to Pro</Link> for unlimited.
            </p>
          )}
        </div>
      )}

      {/* Quick action */}
      <Link
        to="/dashboard/repurpose"
        className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-card p-5 transition-all hover:border-primary hover:shadow-md"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">New Repurpose</p>
          <p className="text-xs text-muted-foreground">Transform content into multiple formats</p>
        </div>
      </Link>

      {/* Suggest content widget */}
      <div className="mt-8">
        <div className="mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Wand2 className="h-4 w-4 text-primary" /> Need an idea? Try a sample
          </h2>
          <p className="text-xs text-muted-foreground">One click — we'll prefill and run a repurpose for you.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SAMPLE_SUGGESTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                try {
                  // Pre-select formats only — user fills their own content, no autorun.
                  sessionStorage.setItem(
                    "postspark.preset",
                    JSON.stringify({ types: s.selectedTypes, guidance: s.guidance, title: s.title }),
                  );
                  sessionStorage.removeItem("postspark.import.text");
                  sessionStorage.removeItem("postspark.autorun");
                } catch {}
                navigate({ to: "/dashboard/repurpose" });
              }}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Run sample <Sparkles className="h-3 w-3" />
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card px-4 py-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-accent" />
                <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-accent" />
              </div>
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-6">
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Welcome aboard! Here's a 60-second checklist:</p>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">1</span>
                <Link to="/dashboard/brand-kit" className="flex-1 text-foreground hover:text-primary">
                  Set up your <span className="font-semibold">Brand Kit</span> — logo, colors & tone
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">2</span>
                <Link to="/dashboard/brand-voice" className="flex-1 text-foreground hover:text-primary">
                  Train your <span className="font-semibold">Brand Voice</span> with 3 past posts <span className="text-[10px] uppercase text-primary">Pro</span>
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">3</span>
                <Link to="/dashboard/repurpose" className="flex-1 text-foreground hover:text-primary">
                  Run your first <span className="font-semibold">Repurpose</span> — paste a blog or YouTube URL
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">4</span>
                <Link to="/dashboard/calendar" className="flex-1 text-foreground hover:text-primary">
                  Schedule posts on the <span className="font-semibold">Calendar</span>
                </Link>
              </li>
            </ul>
            <div className="mt-5 text-center">
              <Link
                to="/dashboard/repurpose"
                className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Sparkles className="h-3.5 w-3.5" /> Get Started
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to="/dashboard/history"
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <p className="truncate text-sm text-foreground max-w-xs">
                  {job.input_text.slice(0, 50)}...
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
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
