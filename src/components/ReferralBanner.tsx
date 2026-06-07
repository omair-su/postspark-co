import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, X, ArrowRight, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const STORAGE_KEY = "postspark.referral_banner.dismissed";

export function ReferralBanner() {
  const { tier, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  if (loading || tier !== "free" || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  return (
    <div className="ds-refer-banner">
      <Sparkles className="absolute right-3 top-3 h-3 w-3 text-white/70" aria-hidden />
      <Sparkles className="absolute left-3 bottom-3 h-3 w-3 text-white/50" aria-hidden />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Gift className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-tight">Refer a friend, get 1 month of Pro free</p>
          <p className="text-xs text-white/80">They get 20% off Pro. You get 1 month free for each paid signup.</p>
        </div>
        <Link
          to="/dashboard/referrals"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-[#1a1a2e] hover:bg-white/90 hover:-translate-y-0.5 transition sm:inline-flex"
        >
          Get my link <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          to="/dashboard/referrals"
          className="shrink-0 rounded-lg bg-white p-1.5 text-[#1a1a2e] hover:bg-white/90 sm:hidden"
          aria-label="Open referrals"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
