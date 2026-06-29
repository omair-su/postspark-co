import { Star } from "lucide-react";

const QUOTES = [
  {
    quote: "I went from 2 posts a week to 18. PostSpark pays for itself in a single afternoon.",
    name: "Maya Chen",
    role: "Creator · 142K on YouTube",
    metric: "+412%",
    metricLabel: "weekly output",
  },
  {
    quote: "We replaced three contractors. Output quality went up, not down. Wild.",
    name: "Daniel Reyes",
    role: "Founder, Northbound Agency",
    metric: "$6,200",
    metricLabel: "saved / month",
  },
  {
    quote: "The Brand Voice is the unlock. Every post sounds like me — not like AI.",
    name: "Priya Anand",
    role: "Solo founder · Indie SaaS",
    metric: "9.1×",
    metricLabel: "engagement lift",
  },
];

export function TestimonialsV3() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="lv3-chip">Loved by creators</p>
          <h2 className="mt-4 font-display-lux" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05, color: "#FAFAF9" }}>
            The compounding <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>content engine.</em>
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {QUOTES.map((q, i) => (
            <figure key={i} className="rounded-3xl p-8 lv3-glass lv3-gradient-border lv3-card-hover flex flex-col">
              <div className="flex gap-1" style={{ color: "#FBBF24" }}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-5 font-display-lux text-xl sm:text-2xl leading-snug" style={{ color: "#FAFAF9" }}>
                "{q.quote}"
              </blockquote>
              <div className="mt-auto pt-6 flex items-end justify-between gap-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <figcaption>
                  <div className="text-sm font-semibold" style={{ color: "#FAFAF9" }}>{q.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(250,250,249,0.55)" }}>{q.role}</div>
                </figcaption>
                <div className="text-right">
                  <div className="font-display-lux text-2xl lv3-text-gradient">{q.metric}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(250,250,249,0.5)" }}>{q.metricLabel}</div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
