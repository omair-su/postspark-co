const LOGOS = ["TechCrunch", "Product Hunt", "Y Combinator", "Indie Hackers", "Hacker News", "Futurepedia"];

export function LogoStripV3() {
  return (
    <section className="relative py-10 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(250,250,249,0.45)" }}>
          Featured in
        </p>
        <div className="mt-6 flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {LOGOS.map((l) => (
            <span
              key={l}
              className="font-display-lux text-base sm:text-lg"
              style={{ color: "rgba(250,250,249,0.5)", letterSpacing: "0.02em" }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
