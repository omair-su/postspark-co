import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared branded state primitives — skeleton loaders, empty states and error
 * states with retry. Used across the dashboard so every tool speaks the same
 * visual language while loading, empty or failing.
 */

/** Single shimmering bar. */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-accent", className)} aria-hidden />;
}

/** A few text lines of shimmer. */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Card-shaped shimmer used inside panes. */
export function SkeletonCard({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-9 w-9 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBar className="h-3 w-1/3" />
          <SkeletonBar className="h-3 w-1/5" />
        </div>
      </div>
      <SkeletonLines lines={lines} className="mt-4" />
    </div>
  );
}

/** Row list shimmer (thumbnail + two lines). */
export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
          <SkeletonBar className="h-16 w-16 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <SkeletonBar className="h-3 w-3/4" />
            <SkeletonBar className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tile grid shimmer (thumbnails, stat cards). */
export function SkeletonTiles({
  tiles = 4,
  aspect = "aspect-square",
  className,
}: {
  tiles?: number;
  aspect?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <SkeletonBar className={cn("w-full rounded-none", aspect)} />
          <div className="space-y-2 p-2.5">
            <SkeletonBar className="h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Accessible busy wrapper so screen readers announce progress. */
export function LoadingPane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Branded empty state with an optional primary action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-10",
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** Branded error state with a retry action. */
export function ErrorState({
  title = "That didn't work",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-8",
        className,
      )}
    >
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {message || "Something went wrong on our side. Nothing was lost — give it another go."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
