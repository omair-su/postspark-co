import { Star, Users, Zap, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "1,200+", label: "Active creators" },
  { icon: Zap, value: "180k+", label: "Posts generated" },
  { icon: Star, value: "4.9/5", label: "Avg. rating" },
  { icon: TrendingUp, value: "10×", label: "Avg. output lift" },
];

export function TrustedBySection() {
  return (
    <section className="relative isolate overflow-hidden cream-surface-alt py-14 px-6">
      <div className="cream-grain" aria-hidden />
      <div className="relative mx-auto max-w-5xl">
        <p className="text-center mb-8">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            Creators &amp; agencies shipping with PostSpark
          </span>
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="luxury-card flex items-center justify-center gap-3 px-4 py-4 animate-[heroRise_0.7s_ease-out_both]"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #4c1d95 60%, #7c3aed 100%)",
                  boxShadow: "0 10px 24px -10px rgba(124,58,237,0.6)",
                }}
              >
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold leading-tight luxury-heading">{s.value}</p>
                <p className="text-[11px] leading-tight text-[#1a1a2e]/60">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes heroRise {
          from { opacity: 0; transform: translate3d(0, 16px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </section>
  );
}
