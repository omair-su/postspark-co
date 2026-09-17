import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Image as ImageIcon, CalendarClock, Loader2, Sparkles, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getCreditSummary } from "@/lib/credits.functions";
import { CREDIT_PACKS } from "@/lib/credits";
import { ErrorState } from "@/components/dashboard/StateViews";

type Summary = Awaited<ReturnType<typeof getCreditSummary>>;

/** Shared loader so both the dashboard card and billing page read one source. */
export function useCreditSummary() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(() => {
    if (!session) return;
    setLoading(true);
    setError(false);
    getCreditSummary({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res) => setSummary(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, error, reload };
}

/** Compact balance card for the dashboard home. */
export function CreditsCard() {
  const { summary, loading, error, reload } = useCreditSummary();

  if (error) {
    return <ErrorState title="Credits didn't load" message="We couldn't read your balance just now." onRetry={reload} />;
  }

  const images = summary?.image;
  const schedule = summary?.schedule;

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your credits</h2>
        <Link
          to="/dashboard/billing"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80"
        >
          Top up <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat
            icon={<ImageIcon className="h-4 w-4 text-primary" />}
            label="Image credits"
            value={String(images?.total ?? 0)}
            hint={
              images
                ? `${images.planRemaining} left in your plan${images.purchased ? ` · ${images.purchased} purchased` : ""}`
                : ""
            }
          />
          <Stat
            icon={<CalendarClock className="h-4 w-4 text-primary" />}
            label="Schedule slots"
            value={
              schedule
                ? schedule.allowance < 0
                  ? "Unlimited"
                  : String(Math.max(0, schedule.allowance - schedule.used) + schedule.purchased)
                : "0"
            }
            hint={
              schedule && schedule.allowance >= 0
                ? `${schedule.used} of ${schedule.allowance} used this month`
                : "Included with your plan"
            }
          />
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Top-up packs, sold as one-time purchases. */
export function CreditPacks() {
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [pending, setPending] = useState<string | null>(null);

  const buy = async (priceId: string) => {
    if (!user) return;
    setPending(priceId);
    try {
      await openCheckout({
        priceId,
        userId: user.id,
        customerEmail: user.email,
        meta: { surface: "credit_pack", price_id: priceId },
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Top-up packs</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        One-time purchases that never expire. Used only after your monthly plan allowance runs out.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.priceId}
            className={`min-w-0 rounded-xl border p-4 ${
              pack.highlight ? "border-primary/50 bg-primary/5" : "border-border bg-background/40"
            }`}
          >
            {pack.highlight && (
              <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Best value
              </span>
            )}
            <p className="mt-2 text-sm font-semibold text-foreground">{pack.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{pack.blurb}</p>
            <p className="mt-3 text-2xl font-bold text-foreground">${pack.price}</p>
            <button
              onClick={() => buy(pack.priceId)}
              disabled={loading || pending === pack.priceId}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {pending === pack.priceId && <Loader2 className="h-3 w-3 animate-spin" />}
              Buy pack
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
