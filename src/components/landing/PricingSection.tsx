import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Get started with content repurposing",
    features: ["10 repurposes/month", "All content formats", "Copy & export"],
    cta: "Start Free",
    popular: false,
    priceId: null,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "For creators who publish daily",
    features: ["14-day free trial", "Unlimited repurposes", "All content formats", "Priority generation", "History & re-generation"],
    cta: "Start 14-day free trial",
    popular: true,
    priceId: "pro_monthly_trial",
  },
  {
    name: "Agency",
    price: "$49",
    period: "/month",
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
    priceId: "agency_monthly_trial",
  },
] as const;

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();

  const handleCta = async (priceId: string | null) => {
    if (!priceId) {
      navigate({ to: "/signup" });
      return;
    }
    if (!user) {
      navigate({ to: "/signup", search: { plan: priceId } as any });
      return;
    }
    await openCheckout({
      priceId,
      userId: user.id,
      customerEmail: user.email,
    });
  };

  return (
    <section className="py-20 bg-surface" id="pricing">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Simple, Transparent <span className="text-gradient">Pricing</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Start free, or try Pro &amp; Agency free for 14 days. Cancel anytime.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={`relative rounded-xl border p-6 animate-fade-in ${
                t.popular
                  ? "border-primary bg-card shadow-lg glow-electric"
                  : "border-border bg-card"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-electric px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-foreground">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              {t.priceId === null ? (
                <Link
                  to="/signup"
                  className="mt-6 flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                >
                  {t.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleCta(t.priceId)}
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
          ))}
        </div>
      </div>
    </section>
  );
}
