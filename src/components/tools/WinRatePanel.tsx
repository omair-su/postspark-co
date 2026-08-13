import { Loader2, Trophy } from "lucide-react";
import { GhostButton, Meter, StudioLabel } from "@/components/tools/studio";

export interface FrameworkStat {
  framework: string;
  wins: number;
  total: number;
  winRate: number;
}

/** Win-rate per hook framework, learned from saved A/B results. */
export function WinRatePanel({
  stats,
  loading,
  onRefresh,
}: {
  stats: FrameworkStat[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="pw-surface p-5">
      <StudioLabel
        action={
          <GhostButton
            icon={loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </GhostButton>
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5" /> Framework win rate
        </span>
      </StudioLabel>

      {stats.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">
          Pick an A and a B hook, mark a winner, and PostSpark starts learning which frameworks work for you.
        </p>
      ) : (
        <div className="space-y-2.5">
          {stats.map((s) => (
            <div key={s.framework}>
              <div className="mb-1 flex items-center justify-between text-[11.5px]">
                <span className="truncate text-foreground">{s.framework}</span>
                <span className="tabular-nums text-muted-foreground">
                  {s.winRate}% · {s.wins}/{s.total}
                </span>
              </div>
              <Meter value={s.winRate} tone={s.winRate >= 60 ? "good" : s.winRate >= 35 ? "warn" : "bad"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
