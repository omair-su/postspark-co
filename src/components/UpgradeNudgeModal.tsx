import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { getMonthlyUsage } from "@/lib/repurpose.functions";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import {
  PRICE_PRO_MONTHLY_LABEL,
  PRICE_PRO_ANNUAL_PER_MONTH,
  PRICE_PRO_MONTHLY,
} from "@/lib/pricing";

const STORAGE_KEY = "postspark.upgrade_nudge.shown_at";
const COOLDOWN_DAYS = 7;

const ANNUAL_SAVINGS = (PRICE_PRO_MONTHLY - PRICE_PRO_ANNUAL_PER_MONTH) * 12;

/**
 * Moment-of-value paywall nudge.
 * Only shown to free users who have actually used the product
 * (>= 2 of 3 monthly repurposes). Skips on first visit.
 */
export function UpgradeNudgeModal() {
  const { tier, loading } = useSubscription();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || tier !== "free") return;
    if (typeof window === "undefined") return;

    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        const ageDays = (Date.now() - Number(last)) / 86_400_000;
        if (ageDays < COOLDOWN_DAYS) return;
      }
    } catch {}

    let cancelled = false;
    let timer: number | undefined;

    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const usage = await getMonthlyUsage({
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        // Trigger only when the user has felt real value — 2+ generations this month.
        // Only nudge once the user has produced real results this month.
        if (usage && usage.used >= 2) {
          timer = window.setTimeout(() => setOpen(true), 1500);
        }
      } catch {
        // Usage unknown — never interrupt.
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [tier, loading]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
  };

  useEffect(() => {
    if (open) track("upgrade_nudge_shown", {});
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-foreground">
          You're getting real value. Keep it going.
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Free is 3 repurposes per month. Pro removes the cap so you can
          publish daily without thinking about it — {PRICE_PRO_MONTHLY_LABEL},
          or ${PRICE_PRO_ANNUAL_PER_MONTH}/mo annual (save ${ANNUAL_SAVINGS}/yr).
        </p>

        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {[
            "Publish daily — no monthly cap",
            "Sound like you, not like AI (Brand Voice)",
            "On-brand visuals & carousels in one click",
            "Cancel anytime · 30-day money-back",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/dashboard/billing"
            onClick={() => {
              track("upgrade_nudge_cta_click", {});
              dismiss();
            }}
            className="flex-1 rounded-lg gradient-electric px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Upgrade to Pro →
          </Link>
          <button
            onClick={dismiss}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
