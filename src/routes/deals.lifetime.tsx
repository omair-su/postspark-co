import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Sparkles, ArrowRight, Check, Shield, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getFoundingSpots } from "@/lib/founding.functions";
import { track } from "@/lib/analytics";
import { LtdValueCalculator } from "@/components/deals/LtdValueCalculator";
import { LtdFaq } from "@/components/deals/LtdFaq";

export const Route = createFileRoute("/deals/lifetime")({
  head: () => ({
    meta: [
      { title: "Lifetime PostSpark Pro — $97 one-time | Founding Member" },
      { name: "description", content: "Pay $97 once, get PostSpark Pro forever. First 50 founding members only. Unlimited AI content repurposing, Brand Voice, Hook Lab and every Pro feature we ever ship." },
      { property: "og:title", content: "PostSpark Lifetime — $97 forever" },
      { property: "og:description", content: "First 50 founding members get PostSpark Pro for life at $97. No recurring fees, ever." },
      { property: "og:url", content: "https://postspark.co/deals/lifetime" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { rel: "canonical", href: "https://postspark.co/deals/lifetime" } as any,
    ],
  }),
  component: LifetimeDealPage,
});

const FEATURES = [
  "Unlimited AI repurposes (every platform)",
  "Brand Voice AI — sounds like you, not AI",
  "Hook Lab — 20 scored hooks per topic",
  "Shorts Studio — TikTok/Reels/Shorts scripts",
  "Image Studio + Thumbnail Maker",
  "Carousel Generator (LinkedIn + X)",
  "Build-in-Public post engine",
  "Brand Kit + Calendar + Analytics",
  "All current and future Pro features",
  "Priority email support — real humans",
];

function LifetimeDealPage() {
  const { user, session } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [spots, setSpots] = useState({ total: 50, claimed: 0, remaining: 50 });

  useEffect(() => {
    getFoundingSpots().then(setSpots).catch(() => {});
  }, []);

  const pct = Math.min(100, Math.round((spots.claimed / spots.total) * 100));
  const isSoldOut = spots.remaining <= 0;

  const handleBuy = async () => {
    track("cta_click", { from: "deals_lifetime_page" });
    if (!user || !session) {
      window.location.href = "/signup?from=lifetime";
      return;
    }
    await openCheckout({
      priceId: "founding_lifetime_97",
      userId: user.id,
      customerEmail: user.email ?? undefined,
      successUrl: `${window.location.origin}/dashboard?checkout=lifetime`,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #2D1B69 100%)" }}>
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(167,139,250,0.4)" }}>
            <Crown className="h-3 w-3" /> Founding Member · Lifetime Deal
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-6xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            Pay $97 once.<br />
            Use PostSpark <span style={{ color: "#A78BFA" }}>forever.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
            We're a new product looking for our first 50 power users. Get unlimited Pro access for a single $97 payment — no monthly fee, ever. After 50 spots, this deal is gone.
          </p>

          {/* Progress bar */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="flex items-center justify-between text-xs font-semibold text-white/80 mb-2">
              <span>{spots.claimed} of {spots.total} claimed</span>
              <span style={{ color: "#A78BFA" }}>{spots.remaining} left</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)" }} />
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading || isSoldOut}
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition disabled:opacity-50"
            style={{ background: "#7C3AED", boxShadow: "0 10px 40px rgba(124,58,237,0.5)" }}
          >
            <Sparkles className="h-5 w-5" />
            {isSoldOut ? "All 50 spots taken" : "Claim Lifetime Access — $97"}
            {!isSoldOut && <ArrowRight className="h-5 w-5" />}
          </button>
          <p className="mt-4 text-xs text-slate-400">
            <Shield className="inline h-3 w-3 mr-1" /> 30-day money-back guarantee · One payment, never again
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1A1A2E]">What you get for $97 — forever</h2>
        <p className="mt-3 text-center text-sm text-[#6B7280]">Every Pro feature today, plus every Pro feature we ship from here on out.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
              <Check className="h-5 w-5 shrink-0 text-[#7C3AED]" />
              <span className="text-sm text-[#1A1A2E]">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <LtdValueCalculator />
      </section>

      {/* WHY */}
      <section className="bg-[#FAFAF8] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-[#1A1A2E]">Why we're doing this</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-[#6B7280]">
            <p>PostSpark is new. We have the product, we don't yet have 1,000 paying users. We need a small group of power users who go all-in — give us brutal feedback, build with us in public, and become the case studies.</p>
            <p>In exchange, we're trading 50 lifetime seats for cash we can use to ship faster instead of raising money or watering down the product.</p>
            <p>Pro is $24/month. At that rate, this deal pays itself back in 4 months and is pure savings for years. If we 10x and Pro becomes $49/month, you're still grandfathered in at $0.</p>
            <p className="text-[#1A1A2E] font-semibold">If 50 founding members sounds like you, grab one of the remaining spots before they're gone.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1A1A2E]">Questions</h2>
        <div className="mt-10">
          <LtdFaq />
        </div>
      </section>

      {/* STICKY CTA */}
      <section className="border-t border-[#E5E7EB] bg-[#1a1a2e] py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#A78BFA]">
            <Clock className="h-3 w-3" /> {isSoldOut ? "Sold out" : `${spots.remaining} of ${spots.total} spots left`}
          </div>
          <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Last chance at this price.</h3>
          <button
            onClick={handleBuy}
            disabled={loading || isSoldOut}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition disabled:opacity-50"
            style={{ background: "#7C3AED", boxShadow: "0 10px 40px rgba(124,58,237,0.5)" }}
          >
            <Sparkles className="h-5 w-5" />
            {isSoldOut ? "Sold out" : "Claim Lifetime — $97"}
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Prefer monthly? <Link to="/signup" className="underline" style={{ color: "#A78BFA" }}>Start free</Link> — 3 repurposes/month, no card.
          </p>
        </div>
      </section>
    </div>
  );
}
