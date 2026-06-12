import { Sparkles, X, Check, Loader2 } from "lucide-react";

export function EnhancePromptModal({
  open,
  loading,
  original,
  enhanced,
  onApply,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  original: string;
  enhanced: string;
  onApply: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Enhance prompt with AI</h2>
            <p className="text-xs text-muted-foreground">Review the rewrite before applying — your original is preserved.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Before</p>
            <p className="whitespace-pre-wrap text-sm text-foreground/80">{original}</p>
          </div>
          <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">After (AI rewrite)</p>
            {loading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">{enhanced || "—"}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Discard
          </button>
          <button
            onClick={onApply}
            disabled={loading || !enhanced}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Use enhanced prompt
          </button>
        </div>
      </div>
    </div>
  );
}
