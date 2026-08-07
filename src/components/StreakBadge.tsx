import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { pingStreak, getStreak } from "@/lib/streak.functions";

export function StreakBadge({ compact = false, variant }: { compact?: boolean; variant?: "stat" }) {
  const { session } = useAuth();
  const [streak, setStreak] = useState<number | null>(null);
  const [longest, setLongest] = useState<number>(0);
  const [activeToday, setActiveToday] = useState(false);

  useEffect(() => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    const key = `ps_streak_pinged_${session.user.id}_${new Date().toISOString().slice(0, 10)}`;
    const alreadyToday = typeof window !== "undefined" && window.localStorage.getItem(key);

    const fn = alreadyToday ? getStreak : pingStreak;
    fn({ headers } as any)
      .then((r: any) => {
        setStreak(r.streak ?? 0);
        setLongest(r.longest ?? 0);
        setActiveToday(r.activeToday ?? !alreadyToday);
        if (!alreadyToday && typeof window !== "undefined") {
          window.localStorage.setItem(key, "1");
        }
      })
      .catch(() => setStreak(0));
  }, [session]);

  if (streak === null) return null;

  if (variant === "stat") {
    return (
      <div className="min-w-0">
        <p className="psx-stat-label">Streak</p>
        <p className="psx-stat-number mt-1">{streak}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--psx-text-2)" }}>
          {activeToday ? "Active today 🔥" : "Create today to extend"}
          {longest > 0 && <> · best {longest}</>}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs font-semibold"
        title={`Longest streak: ${longest} days`}
      >
        <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        <span className="text-foreground">{streak}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${streak > 0 ? "bg-orange-500/15" : "bg-accent"}`}>
          <Flame className={`h-4 w-4 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground">
            {streak} <span className="text-sm font-medium text-muted-foreground">day{streak === 1 ? "" : "s"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {activeToday ? "Active today 🔥" : "Create today to extend your streak"}
            {longest > 0 && <> · best {longest}</>}
          </p>
        </div>
      </div>
    </div>
  );
}
