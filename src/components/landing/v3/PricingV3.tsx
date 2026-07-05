import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, X } from "lucide-react";
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
    desc: "Try it without a credit card.",
    features: [
      "3 repurposes per month",
      "All content formats",
      "Tweet, LinkedIn & email outputs",
      "Copy and export",
    ],
    exclude: ["Brand Voice AI", "Unlimited repurposes"],
    cta: "Start free",
    popular: false,
    monthlyPriceId: null,
    annualPriceId: null,
  },
  {
    name: "Pro",
    monthly: 24,
    annual: 19,
    desc: "For creators who publish daily.",
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
      "History & regeneration",
    ],
    cta: "Start 14-day free trial",
    popular: true,
    monthlyPriceId: "pro_monthly_trial",
    annualPriceId: "pro_annual_trial",
  },
  {
    name: "Agency",
    monthly: 49,
    annual: 39,
    desc: "For teams and agencies.",
    features: [
      "Everything in Pro",
      "5 team seats",
      "Multi-brand workspaces",
      "Client approval links",
      "White-label review pages",
      "Agency analytics rollup",
    ],
    cta: "Start 14-day free trial",
    popular: false,
    monthlyPriceId: "agency_monthly_trial",
    annualPriceId: "agency_annual_trial",
  },
];

export function PricingV3() {
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
    <section id="pricing" className="relative overflow-hidden py-24 sm:py-32 lv3-grain">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 30% at 25% 15%, rgba(124,58,237,0.28), transparent 70%), radial-gradient(40% 30% at 80% 20%, rgba(6,182,212,0.22), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center">
          <span className="lv3-chip">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
            Pricing
          </span>
          <h2
            className="mt-5 font-display-lux text-balance"
            style={{
              fontSize: "clamp(34px, 5vw, 60px)",
              color: "#FAFAF9",
              lineHeight: 1.05,
            }}
          >
            Simple pricing.{" "}
            <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>
              Real value.
            </em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg" style={{ color: "rgba(250,250,249,0.7)" }}>
            Start free forever. Upgrade whenever you're ready to ship a month of content in an afternoon.
          </p>

          <div
            className="mx-auto mt-8 inline-flex items-center rounded-full p-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(12px)",
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
              style={{
                background: !annual ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "transparent",
                color: !annual ? "#FFFFFF" : "rgba(250,250,249,0.65)",
                boxShadow: !annual ? "0 6px 20px rgba(124,58,237,0.35)" : "none",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition"
              style={{
                background: annual ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "transparent",
                color: annual ? "#FFFFFF" : "rgba(250,250,249,0.65)",
                boxShadow: annual ? "0 6px 20px rgba(124,58,237,0.35)" : "none",
              }}
            >
              Annual
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest"
                style={{
                  background: annual ? "rgba(255,255,255,0.9)" : "rgba(52,211,153,0.15)",
                  color: annual ? "#7C3AED" : "#34D399",
                  border: annual ? "none" : "1px solid rgba(52,211,153,0.35)",
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs" style={{ color: annual ? "#34D399" : "rgba(250,250,249,0.5)" }}>
            {annual ? "You're saving ~20% — two months free." : "Switch to annual for two months free."}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => {
            const price = annual ? t.annual : t.monthly;
            const isFree = t.name === "Free";
            const isPending = pending === t.name && loading;

            const card = (
              <div
                className="relative flex h-full flex-col rounded-3xl p-8"
                style={{
                  background: t.popular
                    ? "linear-gradient(180deg, rgba(30,20,50,0.85) 0%, rgba(15,10,30,0.9) 100%)"
                    : "rgba(255,255,255,0.03)",
                  border: t.popular ? "none" : "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(14px)",
                  boxShadow: t.popular
                    ? "0 30px 80px -20px rgba(124,58,237,0.55), 0 0 0 1px rgba(167,139,250,0.15)"
                    : "0 20px 50px -30px rgba(0,0,0,0.6)",
                }}
              >
                {t.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    style={{
                      background: "linear-gradient(135deg, #C9A87C, #F0D7A4)",
                      color: "#1a1a2e",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "5px 14px",
                      borderRadius: 9999,
                      boxShadow: "0 8px 24px rgba(201,168,124,0.4)",
                    }}
                  >
                    Most popular
                  </div>
                )}

                <h3 className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                  {t.name}
                </h3>
                <p className="mt-1.5 text-sm" style={{ color: "rgba(250,250,249,0.6)" }}>
                  {t.desc}
                </p>

                <div className="mt-6 flex items-baseline gap-2 flex-wrap">
                  <span
                    className="font-display-lux"
                    style={{
                      fontSize: 56,
                      lineHeight: 1,
                      color: "#FAFAF9",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ${price}
                  </span>
                  <span className="text-sm" style={{ color: "rgba(250,250,249,0.55)" }}>
                    /month{annual && price > 0 ? ", billed annually" : ""}
                  </span>
                  {annual && t.monthly > 0 && (
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "rgba(250,250,249,0.35)", textDecoration: "line-through" }}
                    >
                      ${t.monthly}
                    </span>
                  )}
                </div>
                {annual && t.monthly > 0 && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: "#34D399" }}>
                    Save ${(t.monthly - t.annual) * 12}/year vs monthly
                  </p>
                )}

                <ul className="mt-7 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "rgba(250,250,249,0.8)", lineHeight: 1.55 }}
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: t.popular ? "#A78BFA" : "#34D399" }}
                      />
                      {f}
                    </li>
                  ))}
                  {t.exclude?.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "rgba(250,250,249,0.3)", textDecoration: "line-through" }}
                    >
                      <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "rgba(250,250,249,0.3)" }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Link
                    to="/signup"
                    className="lv3-cta-ghost mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    {t.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => startCheckout(t)}
                    disabled={isPending}
                    className="lv3-cta mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t.cta}
                  </button>
                )}

                {t.popular && (
                  <p className="mt-3 text-center text-xs" style={{ color: "rgba(250,250,249,0.5)" }}>
                    30-day money-back guarantee
                  </p>
                )}
              </div>
            );

            if (t.popular) {
              return (
                <div
                  key={t.name}
                  className="lv3-gradient-border rounded-3xl"
                  style={{ padding: 1.5 }}
                >
                  {card}
                </div>
              );
            }

            return <div key={t.name}>{card}</div>;
          })}
        </div>

        <div className="mt-14 text-center">
          <p className="text-sm" style={{ color: "rgba(250,250,249,0.6)" }}>
            <strong style={{ color: "#FAFAF9" }}>PostSpark replaces:</strong>{" "}
            Jasper ($49) + Buffer ($15) + Canva Pro ($15) + Surfer SEO ($89){" "}
            <span style={{ textDecoration: "line-through", color: "rgba(250,250,249,0.35)" }}>
              = $168/month
            </span>
          </p>
          <p className="mt-1 text-sm font-semibold lv3-text-gradient">
            PostSpark Pro: $19/month billed annually.
          </p>
        </div>
      </div>
    </section>
  );
}
