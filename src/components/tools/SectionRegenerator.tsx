import { useState } from "react";
import { Loader2, Wand2, ChevronDown } from "lucide-react";
import { GhostButton, StudioLabel } from "@/components/tools/studio";
import { splitSections } from "@/lib/articleAnalysis";

export type RewriteMode = "rewrite" | "expand" | "shorten" | "simplify" | "add_data" | "add_example";

const MODES: { id: RewriteMode; label: string }[] = [
  { id: "rewrite", label: "Rewrite" },
  { id: "expand", label: "Expand" },
  { id: "shorten", label: "Shorten" },
  { id: "simplify", label: "Simplify" },
  { id: "add_data", label: "Add data" },
  { id: "add_example", label: "Add example" },
];

/** Per-section regenerate controls — rewrites one H2 block in place. */
export function SectionRegenerator({
  markdown,
  busyIndex,
  onRegenerate,
}: {
  markdown: string;
  busyIndex: number | null;
  onRegenerate: (index: number, mode: RewriteMode) => void;
}) {
  const sections = splitSections(markdown);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (sections.length === 0) return null;

  return (
    <div className="pw-surface p-5">
      <StudioLabel>
        <span className="inline-flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5" /> Section controls
        </span>
      </StudioLabel>
      <div className="space-y-2">
        {sections.map((s, i) => {
          const words = s.markdown.trim().split(/\s+/).filter(Boolean).length;
          const busy = busyIndex === i;
          const open = openIdx === i;
          return (
            <div key={i} className="rounded-xl border border-border bg-card/50">
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              >
                <span className="text-[10.5px] font-semibold tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {s.heading || "Introduction"}
                </span>
                <span className="text-[10.5px] tabular-nums text-muted-foreground">{words}w</span>
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {open && (
                <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
                  {MODES.map((m) => (
                    <GhostButton key={m.id} onClick={() => onRegenerate(i, m.id)} disabled={busyIndex !== null}>
                      {m.label}
                    </GhostButton>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
