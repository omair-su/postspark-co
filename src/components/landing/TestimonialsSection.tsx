const testimonials = [
  { name: "Sarah Chen", role: "Content Creator", text: "PostSpark saves me 10+ hours every week. I paste one blog post and get a full week of social content." },
  { name: "Marcus Johnson", role: "Marketing Director", text: "Our team's content output tripled since we started using PostSpark. The quality is consistently impressive." },
  { name: "Emily Rodriguez", role: "Solo Entrepreneur", text: "As a one-person team, this tool is my secret weapon. It's like having a full content team on demand." },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Loved by <span className="text-gradient">Creators</span>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
