import { Skeleton } from "@/components/ui/skeleton";

/** Card-shaped skeleton — use for stat tiles, recent items, empty placeholders. */
export function CardSkeleton({ lines = 2, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={i === 0 ? "h-4 w-1/2" : "h-3 w-1/3"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Row-shaped skeleton — use for list items in History, Templates, etc. */
export function RowSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card px-4 py-4 ${className}`}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/4" />
    </div>
  );
}

/** Stack of N row skeletons. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
