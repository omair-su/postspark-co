import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Get started with content repurposing",
    features: ["3 repurposes/month", "All content formats", "Copy & export"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "For creators who publish daily",
    features: ["Unlimited repurposes", "All content formats", "Priority generation", "History & re-generation"],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: "$49",
    period: "/month",
    desc: "For teams and agencies",
    features: ["Everything in Pro", "5 team seats", "Priority support", "API access (coming soon)"],
    cta: "Get Agency",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-20 bg-surface" id="pricing">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Simple, Transparent <span className="text-gradient">Pricing</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Start free. Upgrade when you're ready.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              className={`relative rounded-xl border p-6 ${
                t.popular
                  ? "border-primary bg-card shadow-lg glow-electric"
                  : "border-border bg-card"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
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
              <Link
                to="/signup"
                className={`mt-6 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  t.popular
                    ? "gradient-electric text-primary-foreground glow-electric hover:opacity-90"
                    : "border border-border text-foreground hover:bg-accent"
                }`}
              >
                {t.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
