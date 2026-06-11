// "Quick Answer" panel for Generative Engine Optimization (GEO).
// 40–60 word concise summary block that LLMs (ChatGPT, Perplexity, Claude,
// Google AI Overviews) extract cleanly. Place near top of every marketing page.

export function QuickAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <section
      aria-label="Quick answer"
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"
      style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      <div
        className="rounded-2xl p-6 sm:p-7"
        style={{
          background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
          border: "1px solid #DDD6FE",
        }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#7C3AED", letterSpacing: "0.12em" }}
        >
          ⚡ Quick answer
        </p>
        <h2 className="mt-2 text-base font-bold sm:text-lg" style={{ color: "#0F172A" }}>
          {question}
        </h2>
        <p className="mt-2 text-sm sm:text-base" style={{ color: "#334155", lineHeight: 1.65 }}>
          {answer}
        </p>
      </div>
    </section>
  );
}
