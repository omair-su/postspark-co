import { Star, Users, Zap, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "1,200+", label: "Active creators" },
  { icon: Zap, value: "180k+", label: "Posts generated" },
  { icon: Star, value: "4.9/5", label: "Avg. rating" },
  { icon: TrendingUp, value: "10×", label: "Avg. output lift" },
];

export function TrustedBySection() {
  return (
    <section className="py-10 px-6 border-y border-border bg-card/40">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-6">
          Creators &amp; agencies shipping with PostSpark
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
                <s.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-foreground leading-tight">{s.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
