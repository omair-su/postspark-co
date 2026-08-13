import { Check, Loader2, Search, Sparkles } from "lucide-react";
import { GhostButton, StudioLabel } from "@/components/tools/studio";
import { cn } from "@/lib/utils";

export interface SerpVariant {
  title: string;
  metaDescription: string;
}

/** SERP snippet variant picker — the selected variant drives the final export. */
export function SerpVariantPicker({
  variants,
  loading,
  selected,
  slug,
  onGenerate,
  onSelect,
}: {
  variants: SerpVariant[];
  loading: boolean;
  selected: number | null;
  slug: string;
  onGenerate: () => void;
  onSelect: (i: number | null) => void;
}) {
  return (
    <div className="pw-surface p-5">
      <StudioLabel
        action={
          <GhostButton
            icon={loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            onClick={onGenerate}
            disabled={loading}
          >
            {variants.length ? "Regenerate variants" : "Generate variants"}
          </GhostButton>
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" /> SERP snippet variants
        </span>
      </StudioLabel>

      {variants.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">
          Generate 4 click-optimised title + meta pairs, then pick the one that ships with your export.
        </p>
      ) : (
        <div className="space-y-2.5">
          {variants.map((v, i) => {
            const active = selected === i;
            return (
              <button
                key={i}
                onClick={() => onSelect(active ? null : i)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition",
                  active
                    ? "border-primary/60 bg-primary/[0.06]"
                    : "border-border bg-card/50 hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Variant {i + 1}
                  </span>
                  <span className="flex items-center gap-2 text-[10.5px] tabular-nums text-muted-foreground">
                    <span className={v.title.length > 60 ? "text-amber-400" : ""}>T {v.title.length}/60</span>
                    <span className={v.metaDescription.length > 165 ? "text-amber-400" : ""}>
                      D {v.metaDescription.length}/160
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                </div>
                <p className="mt-1.5 text-[14px] font-medium leading-snug text-sky-400">{v.title}</p>
                <p className="text-[11.5px] text-emerald-500/90">
                  postspark.co/blog/{slug || "your-post"}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{v.metaDescription}</p>
              </button>
            );
          })}
          <p className="text-[11.5px] text-muted-foreground">
            {selected === null
              ? "No variant applied — exports use the original title and meta."
              : `Variant ${selected + 1} applied to meta, analyzer and every export.`}
          </p>
        </div>
      )}
    </div>
  );
}
