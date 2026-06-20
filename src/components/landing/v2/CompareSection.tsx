export function CompareSection() {
  type CellValue = "yes" | "no" | "limited" | string;

  const rows: { feature: string; postspark: CellValue; repurpose: CellValue; hootsuite: CellValue }[] = [
    {
      feature: "AI writes in your voice",
      postspark: "yes",
      repurpose: "limited",
      hootsuite: "no",
    },
    {
      feature: "30 outputs in <60 seconds",
      postspark: "yes",
      repurpose: "limited",
      hootsuite: "no",
    },
    {
      feature: "Native Shorts/Reels script + voiceover",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Brand voice training (free)",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Founding Lifetime plan",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Free plan with real AI access",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Built-in client approval flow",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "limited",
    },
    {
      feature: "Powered by Claude Sonnet 4.5",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
  ];

  function Cell({ value }: { value: CellValue }) {
    if (value === "yes") {
      return (
        <span style={{ color: "#C9A87C", fontSize: 18, fontWeight: 800 }}>✓</span>
      );
    }
    if (value === "no") {
      return (
        <span style={{ color: "#B91C1C", fontSize: 15, fontWeight: 700 }}>✕</span>
      );
    }
    if (value === "limited") {
      return (
        <span
          style={{
            display: "inline-block",
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            borderRadius: 9999,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 10px",
            letterSpacing: "0.04em",
          }}
        >
          Limited
        </span>
      );
    }
    return <span style={{ color: "#64748B" }}>{value}</span>;
  }

  return (
    <section style={{ background: "#F8FAFC" }} className="py-20">
      <style>{`
        .compare-postspark-col {
          background: linear-gradient(180deg, #F5F3FF 0%, #FAFAFF 100%);
        }
      `}</style>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C3AED", letterSpacing: "0.1em" }}>
          Comparison
        </p>
        <h2
          className="mt-3 text-3xl sm:text-4xl md:text-[40px]"
          style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.1 }}
        >
          Why creators leave Repurpose.io
          <br />
          and Hootsuite for PostSpark
        </h2>

        <div className="mt-10 overflow-hidden rounded-2xl" style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}>
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr]">
            <div className="px-5 py-4" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }} />
            {/* PostSpark header — gradient border highlight */}
            <div
              className="px-5 py-4 text-center compare-postspark-col"
              style={{
                borderBottom: "3px solid #7C3AED",
                borderLeft: "1px solid #DDD6FE",
                borderRight: "1px solid #DDD6FE",
              }}
            >
              <span className="text-sm font-extrabold" style={{ color: "#7C3AED" }}>PostSpark</span>
            </div>
            <div className="px-5 py-4 text-center" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", borderLeft: "1px solid #E2E8F0" }}>
              <span className="text-sm font-semibold" style={{ color: "#64748B" }}>Repurpose.io</span>
            </div>
            <div className="px-5 py-4 text-center" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", borderLeft: "1px solid #E2E8F0" }}>
              <span className="text-sm font-semibold" style={{ color: "#64748B" }}>Hootsuite</span>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-[1fr_1fr_1fr_1fr]"
              style={{ borderTop: i > 0 ? "1px solid #F1F5F9" : undefined }}
            >
              <div
                className="px-5 py-4 text-sm font-medium"
                style={{ color: "#0F172A", background: "#FFFFFF", display: "flex", alignItems: "center" }}
              >
                {row.feature}
              </div>
              <div
                className="compare-postspark-col px-5 py-4 text-center flex items-center justify-center"
                style={{
                  borderLeft: "1px solid #DDD6FE",
                  borderRight: "1px solid #DDD6FE",
                }}
              >
                <Cell value={row.postspark} />
              </div>
              <div
                className="px-5 py-4 text-center flex items-center justify-center"
                style={{ background: "#FFFFFF", borderLeft: "1px solid #F1F5F9" }}
              >
                <Cell value={row.repurpose} />
              </div>
              <div
                className="px-5 py-4 text-center flex items-center justify-center"
                style={{ background: "#FFFFFF", borderLeft: "1px solid #F1F5F9" }}
              >
                <Cell value={row.hootsuite} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-center" style={{ color: "#94A3B8" }}>
          Comparison based on publicly listed features as of June 2026.
        </p>
      </div>
    </section>
  );
}
