import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const STORAGE_KEY = "postspark.upgrade_nudge.shown_at";
const COOLDOWN_DAYS = 7;
const SHOW_AFTER_MS = 45_000; // 45s on dashboard

export function UpgradeNudgeModal() {
  const { tier, loading } = useSubscription();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || tier !== "free") return;
    if (typeof window === "undefined") return;

    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        const lastMs = Number(last);
        const ageDays = (Date.now() - lastMs) / 86_400_000;
        if (ageDays < COOLDOWN_DAYS) return;
      }
    } catch {}

    const timer = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [tier, loading]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
  };

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
          Save 20% with annual billing
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You're on the free plan. Unlock unlimited repurposes, Brand Voice,
          Image Studio &amp; more — and save $48/year when you go annual.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {[
            "Unlimited AI repurposes",
            "Brand Voice + Brand Kit",
            "Image Studio & Carousel Generator",
            "30-day money-back guarantee",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/pricing"
            onClick={dismiss}
            className="flex-1 rounded-lg gradient-electric px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            See annual pricing →
          </Link>
          <button
            onClick={dismiss}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
