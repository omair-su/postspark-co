import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, ExternalLink, Loader2, Crown, Calendar, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getPaddleEnvironment } from "@/lib/paddle";
import { createPortalSession } from "@/lib/payments.functions";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Subscription — PostSpark" },
      { name: "description", content: "View your current plan, renewal date, and billing interval." },
    ],
  }),
  component: BillingPage,
});

function detectInterval(priceId?: string | null): "annual" | "monthly" | "—" {
  if (!priceId) return "—";
  if (priceId.includes("annual") || priceId.includes("yearly")) return "annual";
  if (priceId.includes("monthly")) return "monthly";
  return "—";
}

function planLabel(productId?: string | null): string {
  if (productId === "agency_plan") return "Agency";
  if (productId === "pro_plan") return "Pro";
  return "Free";
}

function statusBadge(status?: string) {
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
  const { subscription, isActive, tier, loading } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const [portalLoading, setPortalLoading] = useState(false);

  const interval = detectInterval(subscription?.price_id);
  const plan = planLabel(subscription?.product_id);
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
      window.open(res.overviewUrl, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const startCheckout = async (priceId: string) => {
    if (!user) return;
    await openCheckout({ priceId, userId: user.id, customerEmail: user.email });
  };

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Account"
        icon={<CreditCard className="h-3 w-3" />}
        title="Billing & Subscription"
        subtitle="Your current plan, renewal date, and billing interval — synced live with our payment provider."
      />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading subscription…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Plan card */}
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current plan</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">{plan}</h2>
                  {statusBadge(subscription?.status)}
                  {interval !== "—" && (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-foreground">
                      {interval} billing
                    </span>
                  )}
                </div>
              </div>
              {isActive ? (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Manage billing
                </button>
              ) : (
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg gradient-electric px-3 py-2 text-sm font-semibold text-primary-foreground glow-electric"
                >
                  <Sparkles className="h-3 w-3" /> Upgrade
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat
                label={subscription?.cancel_at_period_end ? "Access ends" : subscription?.status === "trialing" ? "Trial ends" : "Renews on"}
                value={renewal ? renewal.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                hint={daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : undefined}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Billing interval"
                value={interval === "—" ? "—" : interval === "annual" ? "Yearly" : "Monthly"}
                hint={interval === "annual" ? "~20% savings vs monthly" : interval === "monthly" ? "Switch to annual to save" : undefined}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Tier"
                value={tier.toUpperCase()}
                hint={isActive ? "Unlimited usage" : "Free tier limits apply"}
                icon={<Crown className="h-3.5 w-3.5" />}
              />
            </div>

            {subscription?.status === "past_due" && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Your last payment failed. Update your payment method via <strong>Manage billing</strong> to avoid losing access.</span>
              </div>
            )}

            {subscription?.cancel_at_period_end && renewal && (
              <div className="mt-5 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-600 dark:text-orange-400">
                Your subscription is set to cancel on {renewal.toLocaleDateString()}. You'll keep access until then.
              </div>
            )}

            {subscription?.status === "trialing" && renewal && (
              <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                You're on a free trial. You won't be charged until {renewal.toLocaleDateString()} — cancel anytime before then.
              </div>
            )}
          </div>

          {/* Upgrade / switch interval card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isActive ? "Save more" : "Get started"}
              </span>
            </div>

            {!isActive ? (
              <>
                <h3 className="mt-2 text-lg font-bold text-foreground">Go Pro</h3>
                <p className="mt-1 text-xs text-muted-foreground">Unlimited repurposes, all tools, priority generation.</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => startCheckout("pro_annual_trial")}
                    disabled={checkoutLoading}
                    className="flex w-full items-center justify-between rounded-lg gradient-electric px-3 py-2.5 text-sm font-semibold text-primary-foreground glow-electric disabled:opacity-50"
                  >
                    <span>Annual · $15/mo</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Save 21%</span>
                  </button>
                  <button
                    onClick={() => startCheckout("pro_monthly_trial")}
                    disabled={checkoutLoading}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    <span>Monthly · $19/mo</span>
                  </button>
                </div>
                <p className="mt-3 text-center text-[10px] text-muted-foreground">14-day free trial · cancel anytime</p>
              </>
            ) : interval === "monthly" ? (
              <>
                <h3 className="mt-2 text-lg font-bold text-foreground">Switch to annual</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save ~20% by switching to yearly billing. Manage your plan from the billing portal.
                </p>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-3 py-2.5 text-sm font-semibold text-primary-foreground glow-electric disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Manage billing
                </button>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-lg font-bold text-foreground">You're on annual 🎉</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You're already getting the best price. Manage payment method and invoices anytime.
                </p>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Invoices & payment method
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Subscription status updates in real time. <Link to="/pricing" className="underline">Compare all plans →</Link>
      </p>
    </DashboardLayout>
  );
}

function Stat({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1.5 text-lg font-bold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
