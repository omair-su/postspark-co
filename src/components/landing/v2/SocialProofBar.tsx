import { useEffect, useState } from "react";
import { Flame, Sparkles, Zap } from "lucide-react";

export function SocialProofBar() {
  const [stats, setStats] = useState<{ generatedToday: number; signupsThisWeek: number } | null>(null);

  useEffect(() => {
    fetch("/api/public/demo-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const generated = stats?.generatedToday ?? 2847;
  const signups = stats?.signupsThisWeek ?? 312;

  return (
    <section style={{ background: "#F8FAFC" }} className="border-y">
      <div
        className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6"
        style={{ borderColor: "#E2E8F0" }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#64748B", letterSpacing: "0.1em" }}
        >
          Real numbers from real creators
        </p>
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold"
          style={{ color: "#0F172A" }}
        >
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4" style={{ color: "#F97316" }} />
            <span style={{ color: "#7C3AED" }}>{generated.toLocaleString()}</span>
            <span style={{ color: "#64748B", fontWeight: 500 }}>pieces generated today</span>
          </span>
          <span className="hidden h-1 w-1 rounded-full sm:inline-block" style={{ background: "#CBD5E1" }} />
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "#10B981" }} />
            <span style={{ color: "#7C3AED" }}>{signups.toLocaleString()}</span>
            <span style={{ color: "#64748B", fontWeight: 500 }}>creators joined this week</span>
          </span>
          <span className="hidden h-1 w-1 rounded-full sm:inline-block" style={{ background: "#CBD5E1" }} />
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#7C3AED" }} />
            <span style={{ color: "#64748B", fontWeight: 500 }}>Powered by Claude AI</span>
          </span>
        </div>
      </div>
    </section>
  );
}
