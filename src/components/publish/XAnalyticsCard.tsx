import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Trash2,
  Twitter,
  Loader2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getXPublishStats,
  retryScheduledXPost,
  cancelScheduledXPost,
} from "@/lib/socialPublish.functions";

type Stats = {
  connected: boolean;
  username: string | null;
  tier: "free" | "pro" | "agency";
  monthlyPublished: number;
  monthlyLimit: number | null;
  remaining: number | null;
  scheduledCount: number;
  failedCount: number;
  recent: Array<{
    id: string;
    title: string | null;
    content: string | null;
    status: string;
    scheduled_for: string;
    published_at: string | null;
    platform_post_id: string | null;
    media_url: string | null;
    publish_error: string | null;
  }>;
  estimatedSpend: number;
};

export function XAnalyticsCard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useServerFn(getXPublishStats);
  const doRetry = useServerFn(retryScheduledXPost);
  const doCancel = useServerFn(cancelScheduledXPost);

  const refresh = async () => {
    try {
      const r: any = await load({});
      setStats(r);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading X analytics…
        </div>
      </div>
    );
  }

  const limitLabel =
    stats.monthlyLimit == null
      ? "Unlimited"
      : `${stats.monthlyPublished}/${stats.monthlyLimit} this month`;
  const nearLimit =
    stats.monthlyLimit != null && stats.remaining != null && stats.remaining <= 1;

  const onRetry = async (id: string) => {
    setBusyId(id);
    try {
      const r: any = await doRetry({ data: { id } });
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Re-queued");
        refresh();
      }
    } finally {
      setBusyId(null);
    }
  };
  const onCancel = async (id: string) => {
    setBusyId(id);
    try {
      const r: any = await doCancel({ data: { id } });
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Cancelled");
        refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Published"
          value={String(stats.monthlyPublished)}
          hint={limitLabel}
          tone={nearLimit ? "warn" : "ok"}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Stat
          label="Scheduled"
          value={String(stats.scheduledCount)}
          hint="In queue"
          icon={<Clock className="h-4 w-4" />}
        />
        <Stat
          label="Failed"
          value={String(stats.failedCount)}
          hint={stats.failedCount ? "Retry below" : "All good"}
          tone={stats.failedCount > 0 ? "bad" : "ok"}
          icon={<XCircle className="h-4 w-4" />}
        />
        <Stat
          label="Est. X spend"
          value={`$${stats.estimatedSpend.toFixed(2)}`}
          hint="Recent posts"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {stats.tier === "free" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <div className="mb-0.5 flex items-center gap-2 font-medium">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Free plan: {stats.monthlyPublished} / 5 X posts this month
          </div>
          <p className="text-muted-foreground">
            Upgrade to Pro ($24/mo) for unlimited posts, media attachments, and scheduling.
          </p>
        </div>
      )}

      {/* Recent posts */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Twitter className="h-4 w-4" /> Recent activity
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} className="h-7">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        {stats.recent.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No posts yet. Compose your first tweet above.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recent.map((r) => {
              const isPublished = r.status === "published" && r.platform_post_id;
              const url = isPublished && stats.username
                ? `https://x.com/${stats.username}/status/${r.platform_post_id}`
                : null;
              return (
                <li key={r.id} className="flex flex-wrap items-start gap-3 p-3">
                  <div className="mt-0.5">
                    {r.status === "published" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : r.status === "failed" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-sky-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {r.title || r.content?.slice(0, 90) || "(untitled)"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {r.status === "published"
                        ? `Published ${new Date(r.published_at || r.scheduled_for).toLocaleString()}`
                        : r.status === "failed"
                          ? `Failed · ${r.publish_error?.slice(0, 80) || "unknown error"}`
                          : `Scheduled ${new Date(r.scheduled_for).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-input px-2 text-[11px] hover:border-primary hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </a>
                    )}
                    {r.status === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => onRetry(r.id)}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1 h-3 w-3" />
                        )}
                        Retry
                      </Button>
                    )}
                    {(r.status === "scheduled" || r.status === "failed") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                        onClick={() => onCancel(r.id)}
                        disabled={busyId === r.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "ok",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn" | "bad";
  icon?: React.ReactNode;
}) {
  const toneCls =
    tone === "bad"
      ? "text-red-500"
      : tone === "warn"
        ? "text-amber-500"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className={toneCls}>{icon}</span>
      </div>
      <div className={`mt-1 text-lg font-semibold ${toneCls}`}>{value}</div>
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
