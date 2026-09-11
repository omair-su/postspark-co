import { useState } from "react";
import { GripVertical, Copy, Check, ArrowUp, ArrowDown } from "lucide-react";
import { parsePieces, serializePieces } from "@/lib/pieces";

/**
 * Grid view for one format's pieces with drag-to-reorder. Reordering rewrites the
 * format's stored text through serializePieces, so publishing and scheduling pick
 * up the new order.
 */
export function PieceGrid({
  formatId,
  content,
  accent,
  onChange,
}: {
  formatId: string;
  content: string;
  accent?: string;
  onChange: (value: string) => void;
}) {
  const pieces = parsePieces(formatId, content);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= pieces.length || from === to) return;
    const next = [...pieces];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(serializePieces(formatId, next));
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
  };

  if (pieces.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to show in this pack yet.</p>;
  }

  return (
    <ul
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      style={accent ? ({ ["--rp-accent" as any]: accent } as React.CSSProperties) : undefined}
    >
      {pieces.map((p, i) => {
        const isCopied = copied === p.id;
        return (
          <li
            key={p.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnter={() => setOverIndex(i)}
            onDragEnd={() => {
              if (dragIndex !== null && overIndex !== null) move(dragIndex, overIndex);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragOver={(e) => e.preventDefault()}
            className={`rp-aura rp-stagger group relative rounded-2xl border bg-card p-3.5 shadow-sm transition-all ${
              overIndex === i && dragIndex !== null && dragIndex !== i
                ? "border-primary ring-2 ring-primary/25"
                : "border-border"
            } ${dragIndex === i ? "opacity-60" : ""}`}
            style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
          >
            <div className="mb-2 flex items-center gap-2">
              <GripVertical
                className="h-4 w-4 cursor-grab text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Piece {i + 1} of {pieces.length}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Move piece ${i + 1} earlier`}
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  className="rp-focus rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move piece ${i + 1} later`}
                  onClick={() => move(i, i + 1)}
                  disabled={i === pieces.length - 1}
                  className="rp-focus rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Copy piece ${i + 1}`}
                  onClick={() => copy(p.text, p.id)}
                  className="rp-focus rp-copy rounded-md p-1 text-muted-foreground hover:text-primary"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </span>
            </div>
            <p className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground">
              {p.text}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">{p.text.length} chars</p>
          </li>
        );
      })}
    </ul>
  );
}
