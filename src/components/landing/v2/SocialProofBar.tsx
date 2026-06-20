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
    <section className="relative overflow-hidden border-y border-slate-100 bg-white/50 backdrop-blur-sm py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-16">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100 shadow-sm shadow-orange-100/50">
              <Flame size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 leading-none">
                {generated.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Pieces generated today
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-100/50">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 leading-none">
                {signups.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Creators joined this week
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm shadow-violet-100/50">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 leading-none uppercase">
                Claude 3.5
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Advanced AI Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
