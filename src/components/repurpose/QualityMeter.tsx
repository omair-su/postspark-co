/** Animated pack-quality meter used in the command bar and format pane. */
export function QualityMeter({
  pct,
  label,
  compact,
}: {
  pct: number;
  label: string;
  compact?: boolean;
}) {
  const tone =
    label === "Excellent"
      ? "text-emerald-600 dark:text-emerald-400"
      : label === "Good"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  const bar =
    label === "Excellent"
      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
      : label === "Good"
        ? "bg-gradient-to-r from-amber-400 to-amber-500"
        : "bg-gradient-to-r from-red-400 to-red-500";

  return (
    <div className={compact ? "min-w-[104px]" : "w-full"}>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-muted-foreground">Quality</span>
        <span className={`font-semibold ${tone}`}>{label}</span>
      </div>
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Pack quality: ${label}`}
      >
        <div className={`rp-meter h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
