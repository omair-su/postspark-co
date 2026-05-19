import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, X, ArrowRight } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-[#1a1a2e] via-[#4c1d95] to-[#7c3aed] p-4 text-white shadow-md">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_right,white,transparent_60%)]" aria-hidden />
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
          <Gift className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Refer a friend, get 1 month of Pro free</p>
          <p className="text-xs text-white/75">They get 20% off Pro. You get 1 month free for each paid signup.</p>
        </div>
        <Link
          to="/dashboard/referrals"
          className="hidden shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1a2e] hover:bg-white/90 sm:inline-flex"
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
