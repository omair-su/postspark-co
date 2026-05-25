// Lightweight "as featured on" placeholder bar. Replace logos as press lands.
const items = [
  { name: "Product Hunt", emoji: "🚀" },
  { name: "Indie Hackers", emoji: "🧑‍💻" },
  { name: "BetaList", emoji: "📋" },
  { name: "Hacker News", emoji: "🔶" },
  { name: "Uneed", emoji: "✨" },
];

export function FeaturedOnBar() {
  return (
    <section aria-label="Featured on" className="border-y border-border/60 bg-background/60 py-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Built in public — launching on
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-80">
          {items.map((i) => (
            <div
              key={i.name}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span aria-hidden>{i.emoji}</span>
              <span>{i.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
