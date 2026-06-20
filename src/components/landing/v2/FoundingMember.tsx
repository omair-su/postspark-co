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
    <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="flex flex-col items-center mb-12">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            Limited Opportunity
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Pay Once. Use PostSpark <span className="text-violet-600">Forever.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            We're looking for our first 50 power users. Get <strong>lifetime Pro access for a one-time $97</strong> — no monthly fee, ever. After 50 spots, this offer disappears forever.
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-[40px] p-8 sm:p-16 text-left shadow-2xl shadow-violet-900/20"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
          }}
        >
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#7C3AED 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-10">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <Crown size={12} /> Founding Member · Lifetime
              </div>
              <div className="text-sm font-bold text-violet-400">
                {isSoldOut ? "SOLD OUT" : `${spots.remaining} of ${spots.total} spots remaining`}
              </div>
            </div>

            <h3 className="text-3xl sm:text-4xl font-black text-white mb-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Lifetime Pro Access — $97 <span className="text-violet-400">one time</span>
            </h3>

            <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-2xl">
              Everything in Pro, forever. Unlimited repurposes, Brand Voice AI, Hook Lab, AI Image Studio, and all future Pro updates. Pro is normally $24/month — this pays for itself in just 4 months.
            </p>

            {/* Progress bar */}
            <div className="mb-12">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-xs font-bold text-white uppercase tracking-widest">{pct}% Claimed</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-white/10 p-1 border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)",
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500 italic">
                {spots.claimed} of {spots.total} founding members joined · price doubles to $197 after 50 spots.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button
                onClick={handleLifetime}
                disabled={ckLoading || isSoldOut}
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-2xl bg-violet-600 px-10 py-5 text-lg font-bold text-white transition-all hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-xl shadow-violet-600/30 disabled:opacity-50 disabled:hover:scale-100"
              >
                {ckLoading ? <span className="animate-spin mr-2">◌</span> : <Sparkles className="h-5 w-5" />}
                {isSoldOut ? "All Spots Taken" : "Claim Lifetime Access"}
                {!isSoldOut && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
              </button>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  30-day money-back guarantee
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          Prefer monthly? <Link to="/signup" className="font-bold text-violet-600 hover:underline">Start with the free plan</Link> — 3 repurposes/month, no card required.
        </p>
      </div>
    </section>
  );
}
