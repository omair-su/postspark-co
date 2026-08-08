import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Crown,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getPaddleEnvironment } from "@/lib/paddle";
import { createPortalSession, previewPlanChange, applyPlanChange } from "@/lib/payments.functions";
import { track } from "@/lib/analytics";
import {
  PLANS,
  PLAN_ORDER,
  priceFor,
  type Cadence,
  type PlanId,
} from "@/lib/plans";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Plans — PostSpark" },
      {
        name: "description",
        content:
          "Manage your PostSpark plan: Free, Pro and Agency pricing, monthly or annual billing, trials, renewal dates and invoices.",
      },
      { property: "og:title", content: "Billing & Plans — PostSpark" },
      {
        property: "og:description",
        content: "Your PostSpark plan, entitlements, renewal date and billing interval in one place.",
      },
    ],
  }),
  component: BillingPage,
});

function statusBadge(status?: string, lifetime?: boolean) {
  if (lifetime) {
    return (
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        Lifetime
      </span>
    );
  }
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    trialing: { label: "Trialing", cls: "bg-primary/15 text-primary border-primary/30" },
    past_due: { label: "Past due", cls: "bg-destructive/15 text-destructive border-destructive/30" },
    canceled: { label: "Canceled", cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30" },
    paused: { label: "Paused", cls: "bg-muted text-muted-foreground border-border" },
  };
  const v = map[status ?? ""] ?? { label: status ?? "Free", cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${v.cls}`}>
      {v.label}
    </span>
  );
}

function BillingPage() {
  const { user, session } = useAuth();
  const { subscription, isActive, plan, cadence, lifetime, loading } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const [portalLoading, setPortalLoading] = useState(false);
  // Billing cadence is preserved for existing subscribers unless they choose otherwise.
  const [selectedCadence, setSelectedCadence] = useState<Cadence>("annual");
  const [changeTarget, setChangeTarget] = useState<{ plan: PlanId; cadence: Cadence } | null>(null);

  useEffect(() => {
    if (cadence) setSelectedCadence(cadence);
  }, [cadence]);

  // Instrument checkout completion on return from Paddle.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      track("checkout_complete", { price_id: params.get("price") });
      toast.success("Payment confirmed — your plan is updating now.");
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, []);

  const renewal = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysLeft = renewal ? Math.max(0, Math.ceil((renewal.getTime() - Date.now()) / 86400000)) : null;

  const openPortal = async () => {
    if (!user || !session) return;
    setPortalLoading(true);
    try {
      const res = await createPortalSession({
        data: { environment: getPaddleEnvironment() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      track("billing_portal_open", { plan });
      window.open(res.overviewUrl, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Could not open the billing portal. Please try again.");
      track("billing_portal_failed", { reason: (e?.message || "unknown").slice(0, 120) });
    } finally {
      setPortalLoading(false);
    }
  };

  const startCheckout = async (targetPlan: PlanId, targetCadence: Cadence) => {
    if (!user) {
      toast.error("Please sign in to start a subscription.");
      return;
    }
    const price = priceFor(targetPlan, targetCadence);
    if (!price) {
      toast.error("That billing option isn't available right now.");
      return;
    }
    track("trial_start_click", { plan: targetPlan, cadence: targetCadence, price_id: price.priceId });
    await openCheckout({
      priceId: price.priceId,
      userId: user.id,
      customerEmail: user.email,
      meta: { plan: targetPlan, cadence: targetCadence, surface: "billing" },
    });
  };

  const currentPrice = plan !== "free" ? priceFor(plan, cadence ?? "monthly") : null;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        icon={<CreditCard className="h-3 w-3" />}
        title="Billing & Plans"
        subtitle="Everything about your plan, entitlements, renewal and invoices — synced live with our payment provider."
      />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading subscription…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current plan */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current plan
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">{PLANS[plan].name}</h2>
                  {statusBadge(subscription?.status, lifetime)}
                  {cadence && (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-foreground">
                      {cadence} billing
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{PLANS[plan].tagline}</p>
              </div>
              {isActive && !lifetime && (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Manage billing & invoices
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat
                label={
                  subscription?.cancel_at_period_end
                    ? "Access ends"
                    : subscription?.status === "trialing"
                      ? "Trial ends"
                      : "Renews on"
                }
                value={
                  lifetime
                    ? "Never"
                    : renewal
                      ? renewal.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "—"
                }
                hint={!lifetime && daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : undefined}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Billing interval"
                value={lifetime ? "One-time" : cadence ? (cadence === "annual" ? "Yearly" : "Monthly") : "—"}
                hint={
                  currentPrice
                    ? `$${currentPrice.billed} per ${cadence === "annual" ? "year" : "month"}`
                    : cadence === "monthly"
                      ? "Switch to annual to save"
                      : undefined
                }
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Repurposes"
                value={plan === "free" ? "3 / month" : "Unlimited"}
                hint={plan === "free" ? "Free tier limit" : "Fair-use unlimited"}
                icon={<Sparkles className="h-3.5 w-3.5" />}
              />
            </div>

            {subscription?.status === "past_due" && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Your last payment failed. Update your payment method via <strong>Manage billing</strong> to avoid
                  losing access.
                </span>
              </div>
            )}

            {subscription?.cancel_at_period_end && renewal && (
              <div className="mt-5 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-600 dark:text-orange-400">
                Your subscription is set to cancel on {renewal.toLocaleDateString()}. You keep full access until then.
              </div>
            )}

            {subscription?.status === "trialing" && renewal && (
              <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                You're on a free trial — no charge until {renewal.toLocaleDateString()}. Cancel anytime before then.
              </div>
            )}
          </div>

          {/* Plan matrix */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Compare plans</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isActive
                    ? "Changing plan keeps your current billing interval unless you switch it here."
                    : "Every paid plan starts with a 14-day free trial. Cancel anytime."}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-semibold">
                {(["monthly", "annual"] as Cadence[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCadence(c)}
                    className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
                      selectedCadence === c
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                    {c === "annual" && <span className="ml-1 text-primary">−20%</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {PLAN_ORDER.map((id) => {
                const def = PLANS[id];
                const price = priceFor(id, selectedCadence);
                const isCurrent = id === plan;
                const isDowngrade = PLAN_ORDER.indexOf(id) < PLAN_ORDER.indexOf(plan);
                const cadenceSwitch = isCurrent && cadence && cadence !== selectedCadence;

                return (
                  <div
                    key={id}
                    className={`flex flex-col rounded-xl border p-5 ${
                      isCurrent ? "border-primary/40 bg-primary/[0.05]" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{def.name}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{def.tagline}</p>
                    <p className="mt-3 text-2xl font-bold text-foreground">
                      {price ? `$${price.perMonth}` : "$0"}
                      <span className="text-xs font-medium text-muted-foreground">/mo</span>
                    </p>
                    {price && selectedCadence === "annual" && (
                      <p className="text-[11px] text-muted-foreground">${price.billed} billed yearly</p>
                    )}

                    <ul className="mt-4 flex-1 space-y-1.5 text-xs text-foreground">
                      {def.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      {id === "free" ? (
                        <button
                          disabled
                          className="w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground opacity-60"
                        >
                          {isCurrent ? "Your plan" : "Included"}
                        </button>
                      ) : isCurrent && !cadenceSwitch ? (
                        <button
                          onClick={openPortal}
                          disabled={portalLoading || lifetime}
                          className="w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-60"
                        >
                          {lifetime ? "Lifetime access" : "Manage or cancel"}
                        </button>
                      ) : isActive && !lifetime ? (
                        <button
                          onClick={() => setChangeTarget({ plan: id, cadence: selectedCadence })}
                          className={`w-full rounded-lg px-3 py-2 text-xs font-semibold ${
                            isDowngrade
                              ? "border border-border text-foreground hover:bg-accent"
                              : "gradient-electric text-primary-foreground"
                          }`}
                        >
                          {cadenceSwitch
                            ? `Switch to ${selectedCadence}`
                            : isDowngrade
                              ? `Downgrade to ${def.name}`
                              : `Upgrade to ${def.name}`}
                        </button>
                      ) : (
                        <button
                          onClick={() => startCheckout(id, selectedCadence)}
                          disabled={checkoutLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {checkoutLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                          Start 14-day free trial
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Prices in USD. Taxes calculated at checkout. 30-day money-back guarantee — refunds handled by our payment
              provider Paddle.
            </p>
          </div>
        </div>
      )}

      {changeTarget && (
        <PlanChangeDialog
          targetPlan={changeTarget.plan}
          targetCadence={changeTarget.cadence}
          onClose={() => setChangeTarget(null)}
        />
      )}
    </>
  );
}

function PlanChangeDialog({
  targetPlan,
  targetCadence,
  onClose,
}: {
  targetPlan: PlanId;
  targetCadence: Cadence;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<{ amountCents: number; currency: string; nextBilledAt: string | null } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const price = priceFor(targetPlan, targetCadence);

  useEffect(() => {
    if (!session || !price) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await previewPlanChange({
          data: { environment: getPaddleEnvironment(), targetPriceId: price.priceId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!cancelled) setPreview(result);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Couldn't calculate the change. Please try again.");
          track("plan_change_failed", { plan: targetPlan, cadence: targetCadence, stage: "preview" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price?.priceId]);

  const confirm = async () => {
    if (!session || !price) return;
    setApplying(true);
    setError(null);
    try {
      await applyPlanChange({
        data: { environment: getPaddleEnvironment(), targetPriceId: price.priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      track("plan_change_complete", { plan: targetPlan, cadence: targetCadence, price_id: price.priceId });
      toast.success(`You're now on ${PLANS[targetPlan].name}.`);
      onClose();
    } catch (e: any) {
      const message = e?.message || "The plan change failed. Please try again.";
      setError(message);
      toast.error(message);
      track("plan_change_failed", { plan: targetPlan, cadence: targetCadence, stage: "apply" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !applying && onClose()}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground">
          Switch to {PLANS[targetPlan].name} · {targetCadence}
        </h3>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating your prorated amount…
          </div>
        ) : error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : preview ? (
          <div className="mt-3 space-y-2 text-sm text-foreground">
            <p>Due today (prorated for the rest of your current period):</p>
            <p className="text-2xl font-bold text-primary">
              {(preview.amountCents / 100).toLocaleString(undefined, {
                style: "currency",
                currency: preview.currency,
              })}
            </p>
            {preview.nextBilledAt && price && (
              <p className="text-xs text-muted-foreground">
                Then ${price.billed} per {targetCadence === "annual" ? "year" : "month"} from{" "}
                {new Date(preview.nextBilledAt).toLocaleDateString()}.
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            disabled={applying}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={applying || loading || !preview}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg gradient-electric px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {applying && <Loader2 className="h-3 w-3 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-sm font-bold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
