import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
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
    desc: "Start without a credit card",
    features: [
      "10 repurposes per month",
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
    monthly: 19,
    annual: 15,
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
      navigate({ to: "/signup", search: { plan: tier.name.toLowerCase(), cycle: annual ? "annual" : "monthly" } as never });
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
    <section id="pricing" style={{ background: "#F8FAFC" }} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C3AED", letterSpacing: "0.1em" }}>
            Pricing
          </p>
          <h2
            className="mt-3 text-3xl sm:text-4xl md:text-[44px]"
            style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif", fontWeight: 800, lineHeight: 1.1 }}
          >
            Simple Pricing. Real Value.
          </h2>

          <div
            className="mx-auto mt-6 inline-flex rounded-full p-1"
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition"
              style={{
                background: !annual ? "#7C3AED" : "transparent",
                color: !annual ? "#FFFFFF" : "#64748B",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition"
              style={{
                background: annual ? "#7C3AED" : "transparent",
                color: annual ? "#FFFFFF" : "#64748B",
              }}
            >
              Annual <span style={{ color: annual ? "#FFFFFF" : "#10B981" }}>−20%</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => {
            const price = annual ? t.annual : t.monthly;
            const isFree = t.name === "Free";
            const isPending = pending === t.name && loading;
            return (
              <div
                key={t.name}
                className="relative flex flex-col rounded-2xl p-7"
                style={{
                  background: "#FFFFFF",
                  border: t.popular ? "2px solid #7C3AED" : "1px solid #E2E8F0",
                  boxShadow: t.popular
                    ? "0 12px 40px rgba(124,58,237,0.18)"
                    : "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                {t.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ background: "#7C3AED", letterSpacing: "0.1em" }}
                  >
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}>
                  {t.name}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
                  {t.desc}
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold" style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}>
                    ${price}
                  </span>
                  <span className="text-sm" style={{ color: "#64748B" }}>
                    /month{annual && price > 0 ? ", billed annually" : ""}
                  </span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#334155" }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#10B981" }} /> {f}
                    </li>
                  ))}
                  {t.exclude?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm line-through opacity-60" style={{ color: "#94A3B8" }}>
                      <span className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center">✗</span> {f}
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Link
                    to="/signup"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition"
                    style={{
                      border: "2px solid #7C3AED",
                      color: "#7C3AED",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {t.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => startCheckout(t)}
                    disabled={isPending}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
                    style={{
                      background: "#7C3AED",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#6D28D9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t.cta}
                  </button>
                )}

                {t.popular && (
                  <p className="mt-3 text-center text-xs" style={{ color: "#64748B" }}>
                    30-day money-back guarantee
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: "#64748B" }}>
            <strong style={{ color: "#0F172A" }}>PostSpark replaces:</strong>{" "}
            Jasper ($49) + Buffer ($15) + Canva Pro ($15) + Surfer SEO ($89) ={" "}
            <span style={{ textDecoration: "line-through" }}>$168/month</span>
          </p>
          <p className="mt-1 text-sm font-bold" style={{ color: "#7C3AED" }}>
            PostSpark: from $19/month
          </p>
        </div>
      </div>
    </section>
  );
}
