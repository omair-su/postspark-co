import { Check, RotateCcw, Dices, Loader2 } from "lucide-react";
import type { SentenceDiff } from "@/lib/humanizeMetrics";

export interface DiffDecision {
  /** false = keep the original sentence, true/undefined = keep the rewrite. */
  accepted?: boolean;
}

interface Props {
  rows: SentenceDiff[];
  accepted: Record<number, boolean>;
  rerolling: number | null;
  onAccept: (index: number) => void;
  onRevert: (index: number) => void;
  onReroll: (index: number) => void;
}

function reasonFor(row: SentenceDiff): string {
  if (!row.changed) return "unchanged";
  const ow = row.original.split(/\s+/).length;
  const rw = row.rewritten.split(/\s+/).length;
  if (row.similarity < 0.25) return "fully rewritten";
  if (Math.abs(ow - rw) > Math.max(4, ow * 0.35)) return ow > rw ? "tightened" : "expanded rhythm";
  return "phrasing softened";
}

export function DiffView({ rows, accepted, rerolling, onAccept, onRevert, onReroll }: Props) {
  const changed = rows.filter((r) => r.changed).length;

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] text-muted-foreground">
        {changed} of {rows.length} sentences rewritten. Accept, revert, or re-roll any line — the
        output on the left rebuilds from your choices.
      </p>

      {rows.map((row) => {
        const reverted = accepted[row.index] === false;
        const busy = rerolling === row.index;
        return (
          <div
            key={row.index}
            className={`rounded-xl border p-3 transition ${
              !row.changed
                ? "border-border/60 bg-muted/20"
                : reverted
                  ? "border-border bg-muted/30"
                  : "border-primary/25 bg-primary/[0.04]"
            }`}
          >
            {row.changed ? (
              <>
                <p className="text-[12px] leading-relaxed text-muted-foreground line-through decoration-destructive/40">
                  {row.original}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">
                  {reverted ? row.original : row.rewritten}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {reasonFor(row)}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => onAccept(row.index)}
                    disabled={!reverted}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10.5px] font-semibold text-foreground transition hover:bg-muted disabled:opacity-40"
                  >
                    <Check className="h-3 w-3" /> Accept
                  </button>
                  <button
                    onClick={() => onRevert(row.index)}
                    disabled={reverted}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10.5px] font-semibold text-foreground transition hover:bg-muted disabled:opacity-40"
                  >
                    <RotateCcw className="h-3 w-3" /> Revert
                  </button>
                  <button
                    onClick={() => onReroll(row.index)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[10.5px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dices className="h-3 w-3" />}
                    Re-roll
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">{row.original}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
