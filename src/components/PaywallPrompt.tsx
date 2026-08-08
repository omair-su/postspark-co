import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { PLANS, requiredPlanFor, CAPABILITY_LABELS, type Capability } from "@/lib/plans";
import { track } from "@/lib/analytics";

/**
 * Contextual upgrade prompt, shown ONLY where a paid capability is actually
 * blocked — never as a timed interruption.
 */
export function PaywallPrompt({
  capability,
  description,
  className = "",
}: {
  capability: Capability;
  description?: string;
  className?: string;
}) {
  const plan = requiredPlanFor(capability);
  const def = PLANS[plan];
  const label = CAPABILITY_LABELS[capability];

  useEffect(() => {
    track("paywall_shown", { capability, required_plan: plan });
  }, [capability, plan]);

  return (
    <div
      className={`rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 ${className}`}
      role="note"
      aria-label={`${label} requires the ${def.name} plan`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {label} is part of {def.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {description || def.tagline}
          </p>
          <Link
            to="/dashboard/billing"
            onClick={() => track("paywall_cta_click", { capability, required_plan: plan })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg gradient-electric px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Sparkles className="h-3 w-3" />
            Unlock with {def.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
