import { Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getFoundingSpots } from "@/lib/founding.functions";

export function FoundingMember() {
  const { user, session } = useAuth();
  const { openCheckout, loading: ckLoading } = usePaddleCheckout();
  const [spots, setSpots] = useState<{ total: number; claimed: number; remaining: number }>({
    total: 50,
    claimed: 0,
    remaining: 50,
  });

  useEffect(() => {
    getFoundingSpots()
      .then(setSpots)
      .catch(() => {});
  }, []);

  const pct = Math.min(100, Math.round((spots.claimed / spots.total) * 100));
  const isSoldOut = spots.remaining <= 0;

  const handleLifetime = async () => {
    track("cta_click", { from: "founding_lifetime" });
    if (!user || !session) {
      window.location.href = "/signup?from=founding";
      return;
    }
    await openCheckout({
      priceId: "founding_lifetime_97",
      userId: user.id,
      customerEmail: user.email ?? undefined,
    });
  };

  return (
    <section style={{ background: "#FFFFFF" }} className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          className="text-3xl sm:text-4xl"
          style={{
            color: "#0F172A",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          Pay Once. Use PostSpark Forever.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base" style={{ color: "#64748B", lineHeight: 1.7 }}>
          We're a new product looking for our first 50 power users. Get
          <strong> lifetime Pro access for a one-time $97</strong> — no monthly
          fee, ever. After 50 spots, this offer disappears for good.
        </p>

        <div
          className="mx-auto mt-10 rounded-3xl p-10 sm:p-12 text-left"
          style={{
            background: "linear-gradient(135deg, #2D1B69 0%, #1a1a2e 100%)",
            border: "1px solid #4c1d95",
            boxShadow: "0 20px 60px rgba(124,58,237,0.25)",
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
              style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(167,139,250,0.4)" }}
            >
              <Crown className="h-3 w-3" /> Founding Member · Lifetime
            </div>
            <div className="text-xs font-semibold" style={{ color: "#A78BFA" }}>
              {isSoldOut ? "Sold out" : `${spots.remaining} of ${spots.total} spots left`}
            </div>
          </div>

          <h3
            className="mt-5 text-2xl sm:text-3xl text-white"
            style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.2 }}
          >
            Lifetime Pro Access — $97 one time
          </h3>

          <p className="mt-3 text-sm" style={{ color: "#CBD5E1", lineHeight: 1.7 }}>
            Everything in Pro, forever. Unlimited repurposes, Brand Voice AI,
            Hook Lab, AI Image Studio, all current and future Pro features.
            Pro is $24/month — at that rate, this pays itself back in 4 months.
          </p>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)",
                }}
              />
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "#94A3B8" }}>
              {spots.claimed} of {spots.total} founding members claimed · price doubles to $197 after sold out
            </p>
          </div>

          <button
            onClick={handleLifetime}
            disabled={ckLoading || isSoldOut}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg px-7 py-4 text-sm font-bold text-white transition disabled:opacity-50 sm:w-auto"
            style={{
              background: "#7C3AED",
              boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
            }}
            onMouseEnter={(e) => !ckLoading && !isSoldOut && (e.currentTarget.style.background = "#6D28D9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
          >
            <Sparkles className="h-4 w-4" />
            {isSoldOut ? "All 50 spots taken" : "Claim Lifetime Access — $97"}
            {!isSoldOut && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="mt-3 text-[11px]" style={{ color: "#94A3B8" }}>
            30-day money-back guarantee · Pay once, never again
          </p>
        </div>

        <p className="mt-6 text-xs" style={{ color: "#94A3B8" }}>
          Prefer monthly? <Link to="/signup" className="font-bold underline" style={{ color: "#7C3AED" }}>
            Start with the free plan
          </Link> — 3 repurposes/month, no card required.
        </p>
      </div>
    </section>
  );
}
