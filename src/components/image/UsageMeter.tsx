import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getImageUsage } from "@/lib/image.functions";

export type Usage = { plan: string; used: number; limit: number; remaining: number };

export function UsageMeter({ refreshKey = 0, onLoaded }: { refreshKey?: number; onLoaded?: (u: Usage) => void }) {
  const { session } = useAuth();
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    if (!session) return;
    getImageUsage({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((u: any) => {
        setUsage(u);
        onLoaded?.(u);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, refreshKey]);

  if (!usage) return null;
  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const near = usage.remaining <= Math.max(1, Math.floor(usage.limit * 0.15));
  return (
    <div className="min-w-[220px] rounded-xl border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 font-medium">
          <Zap className="h-3.5 w-3.5 text-primary" /> Images this month
        </span>
        <span className={near ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
          {usage.used}/{usage.limit} · <span className="uppercase">{usage.plan}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${near ? "bg-amber-500" : "gradient-electric"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{usage.remaining} remaining</p>
    </div>
  );
}
