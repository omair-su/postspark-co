const LOGOS = [
  "TechCrunch",
  "Product Hunt",
  "Indie Hackers",
  "Y Combinator",
  "Hacker News",
  "Dev.to",
  "Substack",
  "Medium",
];

export function MarqueeStrip() {
  return (
    <section className="relative border-y border-white/5 bg-[#06060f] py-10 overflow-hidden">
      <p className="mb-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/40">
        Trusted by writers & teams featured in
      </p>
      <div className="relative flex overflow-hidden">
        <div className="flex shrink-0 animate-[marquee_38s_linear_infinite] gap-16 pr-16">
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <span
              key={i}
              className="font-serif text-2xl italic text-white/30 transition-colors hover:text-white/70"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 animate-[marquee_38s_linear_infinite] gap-16 pr-16" aria-hidden>
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <span
              key={`b-${i}`}
              className="font-serif text-2xl italic text-white/30"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </section>
  );
}
