import { useEffect, useState } from "react";

interface Props {
  /** 0–100 estimated AI likelihood after humanizing. */
  after: number | null;
  /** 0–100 estimated AI likelihood before humanizing. */
  before?: number | null;
  verdict?: string;
  size?: number;
  label?: string;
}

function toneFor(ai: number) {
  if (ai >= 60) return { stroke: "var(--destructive, oklch(0.6 0.22 25))", text: "text-destructive" };
  if (ai >= 35) return { stroke: "oklch(0.78 0.16 75)", text: "text-amber-500 dark:text-amber-400" };
  if (ai >= 18) return { stroke: "oklch(0.75 0.17 145)", text: "text-emerald-600 dark:text-emerald-400" };
  return { stroke: "oklch(0.72 0.19 155)", text: "text-emerald-600 dark:text-emerald-400" };
}

/** Animated ring showing the estimated human-feel score, plus the before → after delta. */
export function ScoreDial({ after, before, verdict, size = 148, label = "Human feel" }: Props) {
  const target = after == null ? 0 : 100 - after;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (after == null) {
      setShown(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = shown;
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, after]);

  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const tone = toneFor(after ?? 100);
  const delta =
    before != null && after != null ? before - after : null;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={10}
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            stroke={tone.stroke}
            strokeDasharray={c}
            strokeDashoffset={c - (c * shown) / 100}
            style={{ transition: "stroke 400ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[30px] font-bold leading-none tabular-nums ${tone.text}`}>
            {after == null ? "—" : shown}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            Estimated AI likelihood {after == null ? "—" : `${after}%`}
          </span>
          {before != null && (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
              was {before}%
            </span>
          )}
          {delta != null && delta !== 0 && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                delta > 0
                  ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/12 text-destructive"
              }`}
            >
              {delta > 0 ? "−" : "+"}
              {Math.abs(delta)} pts
            </span>
          )}
        </div>
        {verdict && (
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{verdict}</p>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          Estimate from our own statistical model (burstiness, word predictability, stock phrasing).
          It is not a guarantee about any third-party detector.
        </p>
      </div>
    </div>
  );
}
