import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const DEFAULT_STAGES = [
  "Reading your source…",
  "Analysing your brand voice…",
  "Drafting variations…",
  "Polishing hooks…",
  "Formatting per platform…",
];

/**
 * Premium generation "theatre": animated gradient bar, rotating status copy
 * and streaming skeleton lines — replaces plain spinners.
 */
export function GenerationProgress({
  stages = DEFAULT_STAGES,
  lines = 4,
  title = "Generating",
}: {
  stages?: string[];
  lines?: number;
  title?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % stages.length), 2200);
    return () => clearInterval(t);
  }, [stages.length]);

  return (
    <div className="ps-glass-1 ps-gen-glow p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: "#C4B5FD" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>{title}</p>
        <span className="ml-auto text-[11px]" style={{ color: "var(--ds-muted)" }}>{stages[i]}</span>
      </div>
      <div className="ps-gen-bar mt-3"><span /></div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, n) => (
          <div
            key={n}
            className="ps-skel ps-gen-line"
            style={{ width: `${92 - n * 13}%`, animationDelay: `${n * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}
