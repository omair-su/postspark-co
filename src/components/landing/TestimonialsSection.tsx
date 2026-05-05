import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@sarahbuilds",
    role: "Newsletter creator · 18k subs",
    avatar: "SC",
    text: "I paste my Sunday essay into PostSpark and walk away with a full week of tweets, a LinkedIn post, and a podcast outline. It cut my Monday from 4 hours to 20 minutes.",
    accent: "from-fuchsia-500/30 to-purple-500/30",
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusgrowth",
    role: "Head of Content · B2B SaaS",
    avatar: "MJ",
    text: "Our team's social output tripled in the first month. Brand Voice nails our tone — readers don't realize anything changed except how often we post.",
    accent: "from-blue-500/30 to-cyan-500/30",
  },
  {
    name: "Emily Rodriguez",
    handle: "@emilysolopreneur",
    role: "Solo founder · indie SaaS",
    avatar: "ER",
    text: "I'm a one-person team. PostSpark is the closest thing I have to a content department. The Hook Lab alone earned my Pro upgrade.",
    accent: "from-amber-500/30 to-rose-500/30",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1.5 font-semibold text-foreground">4.9</span>
            <span className="text-muted-foreground">· 127 reviews</span>
          </div>
          <h2 className="mt-5 text-3xl font-bold text-foreground sm:text-4xl">
            Loved by <span className="text-gradient">Creators</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Real results from people shipping content every week with PostSpark.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 animate-fade-in transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${t.accent} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <Quote className="h-6 w-6 text-primary/40" />
              <p className="mt-3 text-sm leading-relaxed text-foreground">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-electric text-xs font-bold text-primary-foreground">
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{t.handle}</span> · {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
