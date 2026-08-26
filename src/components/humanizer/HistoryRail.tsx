import { History, Trash2, Layers, Loader2 } from "lucide-react";
import type { HumanizerRunRow } from "@/lib/humanizeTypes";

interface Props {
  runs: HumanizerRunRow[];
  loading: boolean;
  activeId: string | null;
  onOpen: (run: HumanizerRunRow) => void;
  onCompare: (run: HumanizerRunRow) => void;
  onDelete: (run: HumanizerRunRow) => void;
}

export function HistoryRail({ runs, loading, activeId, onOpen, onCompare, onDelete }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-[13px] font-semibold text-foreground">History</h3>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {!loading && runs.length === 0 && (
        <p className="text-[11.5px] text-muted-foreground">
          Your humanized runs are saved here automatically, with their scores and versions.
        </p>
      )}

      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {runs.map((r) => {
          const ai = (r.metrics_after as any)?.aiLikelihood;
          const active = r.id === activeId;
          return (
            <div
              key={r.id}
              className={`group rounded-xl border p-2.5 transition ${
                active ? "border-primary/40 bg-primary/[0.05]" : "border-border bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <button onClick={() => onOpen(r)} className="block w-full text-left">
                <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
                  {r.title || "Untitled run"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-border bg-background/60 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-muted-foreground">
                    v{r.version}
                  </span>
                  {typeof ai === "number" && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                        ai < 35
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                          : ai < 60
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/12 text-destructive"
                      }`}
                    >
                      {100 - ai} human
                    </span>
                  )}
                  <span className="text-[9.5px] text-muted-foreground">
                    {r.word_count} words · {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
              <div className="mt-2 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button
                  onClick={() => onCompare(r)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-1.5 py-0.5 text-[10px] font-semibold text-foreground hover:bg-muted"
                >
                  <Layers className="h-3 w-3" /> Versions
                </button>
                <button
                  onClick={() => onDelete(r)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-1.5 py-0.5 text-[10px] font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
