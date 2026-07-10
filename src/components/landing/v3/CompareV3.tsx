import { Check, X } from "lucide-react";

type CellValue = "yes" | "no" | "limited";

const ROWS: { feature: string; postspark: CellValue; repurpose: CellValue; hootsuite: CellValue }[] = [
  { feature: "AI writes in your voice", postspark: "yes", repurpose: "limited", hootsuite: "no" },
  { feature: "30 outputs in under 60 seconds", postspark: "yes", repurpose: "limited", hootsuite: "no" },
  { feature: "Native Shorts/Reels script + voiceover", postspark: "yes", repurpose: "no", hootsuite: "no" },
  { feature: "Image Studio (GPT-Image-2, Flux, Gemini)", postspark: "yes", repurpose: "no", hootsuite: "no" },
  { feature: "Brand voice training (free)", postspark: "yes", repurpose: "no", hootsuite: "no" },
  { feature: "Founding Lifetime plan", postspark: "yes", repurpose: "no", hootsuite: "no" },
  { feature: "Free plan with real AI access", postspark: "yes", repurpose: "no", hootsuite: "no" },
  { feature: "Built-in client approval flow", postspark: "yes", repurpose: "no", hootsuite: "limited" },
  { feature: "Powered by Claude Sonnet 5", postspark: "yes", repurpose: "no", hootsuite: "no" },
];

function Cell({ v, highlight = false }: { v: CellValue; highlight?: boolean }) {
  if (v === "yes") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          background: highlight
            ? "linear-gradient(135deg,#7C3AED,#06B6D4)"
            : "rgba(124,58,237,0.18)",
          boxShadow: highlight ? "0 6px 16px rgba(124,58,237,0.5)" : "none",
        }}
      >
        <Check className="h-4 w-4" style={{ color: "#FAFAF9" }} strokeWidth={3} />
      </span>
    );
  }
  if (v === "no") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <X className="h-4 w-4" style={{ color: "rgba(250,250,249,0.35)" }} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: "rgba(251,191,36,0.12)",
        color: "#FCD34D",
        border: "1px solid rgba(251,191,36,0.25)",
      }}
    >
      Limited
    </span>
  );
}

export function CompareV3() {
  return (
    <section id="compare" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="lv3-chip">Comparison</p>
          <h2 className="mt-4 font-display-lux" style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1.05, color: "#FAFAF9" }}>
            Why creators leave Repurpose.io <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>for PostSpark.</em>
          </h2>
        </div>

        <div
          className="mt-12 overflow-hidden rounded-3xl lv3-glass lv3-gradient-border"
        >
          {/* Header */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="px-5 sm:px-6 py-5" />
            <div
              className="px-3 sm:px-5 py-5 text-center relative"
              style={{
                background: "linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.04) 100%)",
                borderLeft: "1px solid rgba(124,58,237,0.25)",
                borderRight: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              <span aria-hidden className="absolute inset-x-4 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #A78BFA, transparent)" }} />
              <span className="font-display-lux text-base sm:text-lg" style={{ color: "#FAFAF9" }}>PostSpark</span>
              <span className="mt-1 block text-[10px] uppercase tracking-widest" style={{ color: "#A78BFA" }}>Recommended</span>
            </div>
            <div className="px-3 sm:px-5 py-5 text-center">
              <span className="text-sm font-medium" style={{ color: "rgba(250,250,249,0.7)" }}>Repurpose.io</span>
            </div>
            <div className="px-3 sm:px-5 py-5 text-center">
              <span className="text-sm font-medium" style={{ color: "rgba(250,250,249,0.7)" }}>Hootsuite</span>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="px-5 sm:px-6 py-4 text-sm flex items-center" style={{ color: "rgba(250,250,249,0.9)" }}>
                {row.feature}
              </div>
              <div
                className="px-3 py-4 flex items-center justify-center"
                style={{
                  background: "rgba(124,58,237,0.06)",
                  borderLeft: "1px solid rgba(124,58,237,0.2)",
                  borderRight: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                <Cell v={row.postspark} highlight />
              </div>
              <div className="px-3 py-4 flex items-center justify-center">
                <Cell v={row.repurpose} />
              </div>
              <div className="px-3 py-4 flex items-center justify-center">
                <Cell v={row.hootsuite} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: "rgba(250,250,249,0.4)" }}>
          Comparison based on publicly listed features as of June 2026.
        </p>
      </div>
    </section>
  );
}
