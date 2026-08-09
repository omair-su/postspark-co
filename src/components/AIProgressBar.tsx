import { useAIProgress } from "@/lib/aiProgress";

/**
 * Continuous glowing gradient shimmer at the top of the dashboard
 * whenever an AI / long-running server call is in flight.
 * Mounted once in DashboardLayout.
 */
export function AIProgressBar() {
  const active = useAIProgress();
  if (active <= 0) return null;
  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60]"
      role="progressbar"
      aria-label="AI is working"
    >
      <div className="lux-progress !h-[3px] !rounded-none !bg-transparent" />
    </div>
  );
}
