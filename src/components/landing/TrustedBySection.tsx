export function TrustedBySection() {
  const brands = [
    "Creators",
    "Agencies",
    "Marketers",
    "Founders",
    "Solopreneurs",
    "Content Teams",
  ];

  return (
    <section className="py-12 px-6 border-y border-border bg-card/50">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
          Trusted by 1,000+ content creators worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {brands.map((brand) => (
            <div
              key={brand}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                {brand[0]}
              </div>
              <span className="text-sm font-medium">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
