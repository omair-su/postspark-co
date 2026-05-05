import { Link } from "@tanstack/react-router";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Global banner shown at the top of dashboard pages.
 * - Trialing: friendly countdown + link to settings
 * - Past due: red dunning banner + link to manage billing
 */
export function SubscriptionBanner() {
  const { subscription } = useSubscription();
  if (!subscription) return null;

  if (subscription.status === "past_due") {
    return (
      <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            Your last payment failed. Update your card to keep your subscription active.
          </span>
          <Link
            to="/dashboard/settings"
            className="shrink-0 rounded-md bg-destructive px-2.5 py-1 font-semibold text-destructive-foreground hover:opacity-90"
          >
            Update card
          </Link>
        </div>
      </div>
    );
  }

  if (subscription.status === "trialing" && subscription.current_period_end) {
    const endsAt = new Date(subscription.current_period_end);
    const daysLeft = Math.max(
      0,
      Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return (
      <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="flex-1">
            <strong className="text-primary">Free trial</strong> — {daysLeft} day{daysLeft === 1 ? "" : "s"} left.
            Cancel anytime before {endsAt.toLocaleDateString()} to avoid being charged.
          </span>
          <Link
            to="/dashboard/settings"
            className="shrink-0 rounded-md border border-primary/30 px-2.5 py-1 font-semibold text-primary hover:bg-primary/10"
          >
            Manage
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
