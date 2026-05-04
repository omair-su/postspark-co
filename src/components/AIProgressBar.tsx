import { useAIProgress } from "@/lib/aiProgress";

/**
 * Indeterminate progress bar that appears at the top of the dashboard
 * whenever an AI / long-running server call is in flight.
 * Mounted once in DashboardLayout.
 */
export function AIProgressBar() {
  const active = useAIProgress();
  if (active <= 0) return null;
  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="AI is working"
    >
      <div className="ai-progress-bar h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent" />
    </div>
  );
}
