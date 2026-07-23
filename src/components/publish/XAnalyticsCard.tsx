import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, AlertTriangle, Twitter, TrendingUp } from "lucide-react";
import { getXUsage } from "@/lib/socialPublish.functions";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  scheduled: number;
  publishing: number;
  published: number;
  failed: number;
}

export function XAnalyticsCard({ stats }: { stats?: Stats }) {
  const { session } = useAuth();
  const doUsage = useServerFn(getXUsage);
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: string } | null>(null);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    (async () => {
      try {
        const r: any = await doUsage({});
        if (alive && r && typeof r.used === "number") setUsage(r);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [session, doUsage]);

  const s: Stats = stats ?? { scheduled: 0, publishing: 0, published: 0, failed: 0 };
  const total = s.scheduled + s.publishing + s.published + s.failed;
  const successRate = total > 0 ? Math.round((s.published / Math.max(total - s.scheduled - s.publishing, 1)) * 100) : 0;

  const onFree = usage && usage.limit > 0;
  const pct = onFree ? Math.min(100, Math.round((usage!.used / usage!.limit) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Twitter className="h-4 w-4 text-sky-500" />
          X (Twitter) performance
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {successRate}% success
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat icon={Clock} label="Scheduled" value={s.scheduled} tone="text-sky-500" />
        <Stat icon={Clock} label="Publishing" value={s.publishing} tone="text-amber-500" />
        <Stat icon={CheckCircle2} label="Published" value={s.published} tone="text-emerald-500" />
        <Stat icon={AlertTriangle} label="Failed" value={s.failed} tone="text-destructive" />
      </div>

      {onFree && (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium">Free plan · X posts this month</span>
            <span className="text-muted-foreground">
              {usage!.used} / {usage!.limit}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full transition-all ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct >= 80 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {pct >= 100 ? "Limit reached — upgrade to Pro for unlimited X scheduling." : "Approaching monthly limit."}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>X API cost estimate</span>
          <span className="font-medium text-foreground">
            ~${((s.published * 0.015) + (s.failed * 0)).toFixed(3)}
          </span>
        </div>
        <div className="mt-0.5 opacity-70">$0.015/post · $0.20 with URL · use link-in-reply</div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2 text-center">
      <Icon className={`mx-auto mb-1 h-3.5 w-3.5 ${tone}`} />
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
