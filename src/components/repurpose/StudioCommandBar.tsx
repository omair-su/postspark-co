import { Sparkles, Loader2, Layers, AlertTriangle } from "lucide-react";
import { CountUp } from "./CountUp";
import { QualityMeter } from "./QualityMeter";

/** Sticky studio command bar: live metrics, credits and the Generate action. */
export function StudioCommandBar({
  wordCount,
  formatCount,
  pieceCount,
  qualityPct,
  qualityLabel,
  creditsText,
  creditsLow,
  loading,
  disabled,
  onGenerate,
  onBulk,
  bulkLabel,
}: {
  wordCount: number;
  formatCount: number;
  pieceCount: number;
  qualityPct: number;
  qualityLabel: string;
  creditsText: string;
  creditsLow?: boolean;
  loading: boolean;
  disabled: boolean;
  onGenerate: () => void;
  onBulk: () => void;
  bulkLabel: string;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-2 mb-4 px-2 pt-2">
      <div className="rp-bar flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-sm backdrop-blur-xl">
        <Metric label="Source words" value={wordCount} />
        <Metric label="Formats" value={formatCount} />
        <Metric label="Pieces" value={pieceCount} />
        <div className="hidden sm:block">
          <QualityMeter pct={qualityPct} label={qualityLabel} compact />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            creditsLow
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-primary/25 bg-primary/5 text-foreground"
          }`}
        >
          {creditsLow ? (
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          )}
          {creditsText}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBulk}
            disabled={loading}
            className="rp-focus inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-60"
          >
            <Layers className="h-4 w-4" aria-hidden="true" /> {bulkLabel}
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled}
            className="rp-focus repurpose-cta group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-violet-500 px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-700 group-hover:left-full" />
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Repurpose now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="leading-tight">
      <div className="text-sm font-bold text-foreground">
        <CountUp value={value} />
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
