import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, ShieldCheck, Minus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

type Tier = {
  name: string;
  monthly: number;
  annual: number; // per month, billed annually
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
  monthlyPriceId: string | null;
  annualPriceId: string | null;
};

const tiers: Tier[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Get started with content repurposing",
    features: ["3 repurposes/month", "All content formats", "Copy & export"],
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
      "14-day free trial",
      "Unlimited repurposes",
      "All content formats",
      "Brand Voice training",
      "Priority generation",
      "History & re-generation",
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
    desc: "For teams managing multiple clients",
    features: [
      "14-day free trial",
      "Everything in Pro",
      "Up to 5 team seats",
      "Multi-brand workspaces",
      "Client approval links",
      "White-label review pages",
      "Agency analytics rollup",
      "Bulk CSV scheduling",
    ],
    cta: "Start 14-day free trial",
    popular: false,
    monthlyPriceId: "agency_monthly_trial",
    annualPriceId: "agency_annual_trial",
  },
];

const comparisonRows: Array<{ label: string; values: [string | boolean, string | boolean, string | boolean] }> = [
  { label: "Monthly repurposes", values: ["3", "Unlimited", "Unlimited"] },
  { label: "Output formats (tweets, LinkedIn, email…)", values: [true, true, true] },
  { label: "YouTube / PDF / URL import", values: [true, true, true] },
  { label: "Tone & custom instructions", values: [true, true, true] },
  { label: "History & re-generation", values: [false, true, true] },
  { label: "Brand Voice AI training", values: [false, true, true] },
  { label: "Brand Kit (logo, colors, fonts)", values: [false, true, true] },
  { label: "Hook Lab + virality scoring", values: [false, true, true] },
  { label: "AI Image Studio", values: [false, true, true] },
  { label: "SEO Blog writer", values: [false, true, true] },
  { label: "Content Calendar", values: [false, true, true] },
  { label: "Team seats", values: ["1", "1", "Up to 5"] },
  { label: "Multi-brand workspaces", values: [false, false, true] },
  { label: "Client approval links + white-label", values: [false, false, true] },
  { label: "Agency analytics rollup", values: [false, false, true] },
  { label: "Priority support", values: [false, true, true] },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-primary" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const handleCta = async (priceId: string | null) => {
    if (!priceId) {
      navigate({ to: "/signup" });
      return;
    }
    if (!user) {
      navigate({ to: "/signup", search: { plan: priceId } as any });
      return;
    }
    await openCheckout({ priceId, userId: user.id, customerEmail: user.email });
  };

  return (
    <section className="relative isolate overflow-hidden cream-surface py-24" id="pricing">
      <div className="cream-grain" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full opacity-40 blur-3xl lux-float"
        style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.3), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            Pricing
          </span>
          <h2 className="mt-5 luxury-heading" style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}>
            Simple, Transparent <span className="luxury-gradient-text">Pricing</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#1a1a2e]/75">
            Start free, or try Pro &amp; Agency free for 14 days. <strong className="text-[#1a1a2e]">30-day money-back guarantee.</strong>
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-border bg-card p-1 text-sm">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-1.5 font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`rounded-full px-4 py-1.5 font-semibold transition-all ${
                billing === "annual"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">−20%</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => {
            const price = billing === "annual" ? t.annual : t.monthly;
            const priceId = billing === "annual" ? t.annualPriceId : t.monthlyPriceId;
            return (
              <div
                key={t.name}
                className={`luxury-card relative p-6 animate-fade-in ${
                  t.popular ? "ring-2 ring-[#7c3aed]/50" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {t.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #4c1d95 60%, #7c3aed 100%)" }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">${price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                {billing === "annual" && t.monthly > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Billed ${t.annual * 12}/year · save ${(t.monthly - t.annual) * 12}
                  </p>
                )}
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {priceId === null ? (
                  <Link
                    to="/signup"
                    className="mt-6 flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                  >
                    {t.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCta(priceId)}
                    disabled={loading}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                      t.popular
                        ? "gradient-electric text-primary-foreground glow-electric hover:opacity-90"
                        : "border border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                    {t.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> 30-day money-back guarantee
          </span>
          <span>·</span>
          <span>Cancel anytime — keep access until period end</span>
          <span>·</span>
          <span>Secure checkout by Paddle</span>
          <span>·</span>
          <span>No credit card for free plan</span>
        </div>

        {/* Comparison table */}
        <div className="mt-16">
          <h3 className="text-center text-xl font-bold text-foreground">Compare every feature</h3>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature</th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free</th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-primary">Pro</th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? "bg-background/40" : ""}>
                    <td className="px-5 py-3 text-foreground">{row.label}</td>
                    <td className="px-5 py-3 text-center"><Cell value={row.values[0]} /></td>
                    <td className="px-5 py-3 text-center"><Cell value={row.values[1]} /></td>
                    <td className="px-5 py-3 text-center"><Cell value={row.values[2]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Replaces strip */}
          <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Replaces $200+/mo of tools
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="line-through opacity-60">Jasper $49</span>
              <span className="text-primary">+</span>
              <span className="line-through opacity-60">Buffer $15</span>
              <span className="text-primary">+</span>
              <span className="line-through opacity-60">Canva Pro $15</span>
              <span className="text-primary">+</span>
              <span className="line-through opacity-60">Surfer SEO $89</span>
              <span className="text-primary">+</span>
              <span className="line-through opacity-60">Descript $30</span>
              <span className="text-primary">=</span>
              <span className="font-bold text-foreground">PostSpark from $24</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
