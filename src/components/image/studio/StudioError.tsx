/**
 * Structured render-failure card + per-tile streaming tile for batch renders.
 * Replaces the old bare "Generation failed" toast with an explanation and a way
 * forward (retry, another engine, upgrade).
 */
import { AlertTriangle, RefreshCw, Shuffle, Sparkles, X, Loader2 } from "lucide-react";
import type { StudioError } from "@/lib/imageErrors";

export function StudioErrorCard({
  error,
  onRetry,
  onSwitchModel,
  onUpgrade,
  onDismiss,
  aspectClass,
}: {
  error: StudioError;
  onRetry?: () => void;
  onSwitchModel?: () => void;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  aspectClass: string;
}) {
  return (
    <div className={`is-tile ${aspectClass} grid place-items-center border-destructive/40`}>
      <div className="max-w-sm px-6 text-center">
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-[13px] font-bold text-foreground">{error.title}</p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{error.message}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {error.canRetry && onRetry && (
            <button onClick={onRetry} className="is-btn-ghost" type="button">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          )}
          {error.canSwitchModel && onSwitchModel && (
            <button onClick={onSwitchModel} className="is-btn-ghost" type="button">
              <Shuffle className="h-3.5 w-3.5" /> Try another engine
            </button>
          )}
          {error.showUpgrade && onUpgrade && (
            <button onClick={onUpgrade} className="is-btn !w-auto !px-4" type="button">
              <Sparkles className="h-3.5 w-3.5" /> See plans
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="is-btn-ghost !px-2" type="button" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type TileJob = {
  /** Latest preview frame (data URL) while rendering. */
  preview: string | null;
  status: "pending" | "streaming" | "done" | "error";
  url?: string;
  seed?: number;
  message?: string;
};

/** One tile of a multi-image batch, with its own blur-to-sharp progress. */
export function StreamingTile({
  job,
  aspectClass,
  index,
}: {
  job: TileJob;
  aspectClass: string;
  index: number;
}) {
  return (
    <div className={`is-tile ${aspectClass} relative overflow-hidden`}>
      {job.preview ? (
        <img
          src={job.preview}
          alt={`Render ${index + 1} in progress`}
          className={`h-full w-full object-contain transition-[filter] duration-500 ${
            job.status === "done" ? "blur-0" : "blur-xl"
          }`}
        />
      ) : (
        <div className="is-skel" />
      )}
      <span className="is-tile-status">
        {job.status === "error" ? (
          job.message || "Failed"
        ) : job.status === "done" ? (
          "Ready"
        ) : (
          <>
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            {job.status === "streaming" ? `Rendering ${index + 1}…` : `Queued ${index + 1}`}
          </>
        )}
      </span>
      {typeof job.seed === "number" && (
        <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          seed {job.seed}
        </span>
      )}
    </div>
  );
}
