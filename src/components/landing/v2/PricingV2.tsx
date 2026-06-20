import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

type Tier = {
  name: string;
  monthly: number;
  annual: number;
  desc: string;
  features: string[];
  exclude?: string[];
  cta: string;
  popular: boolean;
  monthlyPriceId: string | null;
  annualPriceId: string | null;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Try it without a credit card",
    features: [
      "3 repurposes per month",
      "All content formats",
      "Tweet, LinkedIn, Email outputs",
      "Copy and export",
    ],
    exclude: ["Brand Voice AI", "Unlimited repurposes"],
    cta: "Start Free",
    popular: false,
    monthlyPriceId: null,
    annualPriceId: null,
  },
  {
    name: "Pro",
    monthly: 24,
    annual: 19,
    desc: "For creators who publish daily",
    features: [
      "Unlimited repurposes",
      "All content formats",
      "Brand Voice AI training",
      "Spark Copilot assistant",
      "AI Image Studio",
      "Hook Lab + virality scoring",
      "SEO Blog Writer",
      "Content Calendar",
      "Priority generation",
      "History and regeneration",
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
    monthlyPriceId: "pro_monthly_trial",
    annualPriceId: "pro_annual_trial",
  },
  {
    name: "Agency",
    monthly: 49,
    annual: 39,
    desc: "For teams and agencies",
    features: [
      "Everything in Pro",
      "5 team seats",
      "Multi-brand workspaces",
      "Client approval links",
      "White-label review pages",
      "Agency analytics rollup",
    ],
    cta: "Start 14-Day Free Trial",
    popular: false,
    monthlyPriceId: "agency_monthly_trial",
    annualPriceId: "agency_annual_trial",
  },
];

export function PricingV2() {
  const [annual, setAnnual] = useState(false);
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const [pending, setPending] = useState<string | null>(null);

  const startCheckout = async (tier: Tier) => {
    const priceId = annual ? tier.annualPriceId : tier.monthlyPriceId;
    if (!priceId) {
      navigate({ to: "/signup" });
      return;
    }
    if (!session || !user) {
      navigate({ to: "/signup" });
      return;
    }
    try {
      setPending(tier.name);
      await openCheckout({
        priceId,
        userId: user.id,
        customerEmail: user.email ?? undefined,
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
      {/* Decorative background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-200/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-200/20 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            Simple Pricing
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Invest in Your <span className="text-violet-600">Content Empire</span>
          </h2>
          
          <div className="mt-10 flex items-center gap-4">
            <span className={`text-sm font-medium ${!annual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative h-7 w-12 rounded-full bg-slate-200 transition-colors focus:outline-none"
              style={{ background: annual ? '#7C3AED' : '#E2E8F0' }}
            >
              <div
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                  annual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-slate-900' : 'text-slate-500'}`}>
              Yearly <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">Save 20%</span>
            </span>
          </div>
          <p className="mt-4 text-xs font-medium" style={{ color: annual ? "#10B981" : "#64748B" }}>
            {annual ? "✓ You're saving ~20% with annual billing — 2 months free" : "Switch to annual to save ~20% (2 months free)"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          {TIERS.map((t) => {
            const price = annual ? t.annual : t.monthly;
            const isFree = t.name === "Free";
            const isPending = pending === t.name && loading;

            return (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-[32px] p-8 transition-all duration-300 ${
                  t.popular 
                    ? 'bg-white border-2 border-violet-500 shadow-2xl shadow-violet-200 lg:scale-105 z-10' 
                    : 'bg-white border border-slate-200 shadow-xl shadow-slate-100 hover:border-slate-300'
                }`}
              >
                {t.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                      <Sparkles size={12} /> MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900">{t.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{t.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">${price}</span>
                    <span className="text-slate-500 font-medium">/mo</span>
                  </div>
                  {annual && t.monthly > 0 && (
                    <p className="mt-2 text-xs font-bold text-emerald-600">
                      Save ${(t.monthly - t.annual) * 12}/year vs monthly
                    </p>
                  )}
                </div>

                <ul className="mb-10 flex-1 space-y-4">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                  {t.exclude?.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-400 line-through">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                        <span className="text-[10px] font-bold">✕</span>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Link
                    to="/signup"
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 py-4 text-base font-bold text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
                  >
                    {t.cta} <ArrowRight size={18} />
                  </Link>
                ) : (
                  <button
                    onClick={() => startCheckout(t)}
                    disabled={isPending}
                    className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all disabled:opacity-60 ${
                      t.popular
                        ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t.cta} <ArrowRight size={18} />
                  </button>
                )}

                {t.popular && (
                  <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    30-day money-back guarantee
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-20 flex flex-col items-center gap-6 rounded-3xl bg-slate-50 p-8 border border-slate-100 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4 text-left">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600">
              Join <span className="font-bold text-slate-900">12,000+ creators</span> growing with PostSpark
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-violet-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fast Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-violet-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cancel Anytime</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-900">PostSpark replaces:</strong>{" "}
            Jasper ($49) + Buffer ($15) + Canva Pro ($15) + Surfer SEO ($89) ={" "}
            <span className="line-through">$168/month</span>
          </p>
          <p className="mt-2 text-sm font-bold text-violet-600">
            PostSpark Pro: Starting at ${TIERS[1].annual}/month
          </p>
        </div>
      </div>
    </section>
  );
}
