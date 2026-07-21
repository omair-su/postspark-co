import { AlertTriangle, Sparkles, Check } from "lucide-react";
import { gradeContrast } from "@/lib/contrast";
import { suggestPassingShade } from "@/lib/colorUtils";

interface Pair {
  label: string;
  fg: string;
  bg: string;
  adjust?: "fg" | "bg"; // which side to auto-fix (default fg)
  onApply?: (hex: string) => void;
  fontHeading?: string;
  fontBody?: string;
}

interface Props {
  pairs: Pair[];
}

/**
 * Contrast preview grid with AI-style auto-fix. For any failing pair, calculates
 * the closest AA-passing shade and offers a one-click "Apply".
 */
export function ContrastAutoFixer({ pairs }: Props) {
  const graded = pairs.map((p) => ({ ...p, g: gradeContrast(p.fg, p.bg) }));
  const worst = graded.reduce((min, x) => (x.g.ratio < min.g.ratio ? x : min), graded[0]);

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Check className="h-4 w-4 text-violet-400" /> Accessibility guard
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            WCAG 2.1 — AA needs 4.5:1 body / 3:1 large. AAA is 7:1.
          </p>
        </div>
        {worst && worst.g.ratio < 4.5 && (
          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-300">
            {graded.filter((p) => p.g.ratio < 4.5).length} to fix
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {graded.map((p, i) => {
          const failing = p.g.ratio < 4.5;
          const suggestion = failing
            ? suggestPassingShade(p.fg, p.bg, 4.5, p.adjust || "fg")
            : null;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-slate-800/60"
            >
              <div className="p-3" style={{ background: p.bg }}>
                <p
                  className="text-base font-bold"
                  style={{ color: p.fg, fontFamily: p.fontHeading }}
                >
                  Heading sample
                </p>
                <p className="text-xs" style={{ color: p.fg, fontFamily: p.fontBody }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 px-3 py-2">
                <span className="text-[10px] font-medium text-slate-400">{p.label}</span>
                <ContrastBadge grade={p.g} />
              </div>
              {failing && suggestion && p.onApply && (
                <button
                  type="button"
                  onClick={() => p.onApply?.(suggestion)}
                  className="flex w-full items-center justify-between gap-2 border-t border-slate-800 bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 px-3 py-2 text-[11px] font-semibold text-violet-200 transition hover:from-violet-900/50 hover:to-fuchsia-900/50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Auto-fix → <span className="font-mono uppercase text-white">{suggestion}</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Passes AA
                  </span>
                </button>
              )}
              {failing && !suggestion && (
                <div className="flex items-center gap-2 border-t border-slate-800 bg-red-950/30 px-3 py-2 text-[11px] text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  No nearby shade passes — pick a different color.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ContrastBadge({ grade }: { grade: ReturnType<typeof gradeContrast> }) {
  const cls =
    grade.label === "AAA"
      ? "bg-emerald-500/20 text-emerald-300"
      : grade.label === "AA"
        ? "bg-emerald-500/15 text-emerald-300"
        : grade.label === "AA Large"
          ? "bg-yellow-500/15 text-yellow-300"
          : "bg-red-500/20 text-red-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {grade.label} · {grade.ratio.toFixed(2)}:1
    </span>
  );
}
