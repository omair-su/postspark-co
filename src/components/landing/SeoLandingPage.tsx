import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, ArrowRight, Sparkles } from "lucide-react";


export type SeoLandingFAQ = { q: string; a: string };
export type SeoLandingBenefit = { title: string; description: string };
export type SeoLandingStep = { title: string; description: string };

export interface SeoLandingPageProps {
  eyebrow: string;
  h1: string;
  subhead: string;
  primaryCtaLabel?: string;
  hideHeroCtas?: boolean;
  benefits: SeoLandingBenefit[];
  steps: SeoLandingStep[];
  outputs?: string[];
  supportedInputs?: string[];
  faqs: SeoLandingFAQ[];
  internalLinks: { to: string; label: string }[];
  interactiveSlot?: ReactNode;
}

export function SeoLandingPage(props: SeoLandingPageProps) {
  const {
    eyebrow,
    h1,
    subhead,
    primaryCtaLabel = "Start free — 3 repurposes/month",
    hideHeroCtas = false,
    benefits,
    steps,
    outputs,
    supportedInputs,
    faqs,
    internalLinks,
    interactiveSlot,
  } = props;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-30 [background:radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.25),transparent)]" />
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {h1}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{subhead}</p>
            {!hideHeroCtas && (
              <>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-lg gradient-electric px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 glow-electric"
                  >
                    {primaryCtaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    See pricing
                  </Link>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">No credit card required. Cancel anytime.</p>
              </>
            )}
          </div>
        </section>

        {interactiveSlot}

        {supportedInputs && supportedInputs.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Supported inputs
            </h2>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {supportedInputs.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-electric">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-border bg-card p-6">
                <div className="absolute -top-3 left-6 rounded-full gradient-electric px-3 py-0.5 text-xs font-bold text-primary-foreground">
                  Step {i + 1}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Outputs */}
        {outputs && outputs.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">What you get</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Every repurpose generates multiple ready-to-publish formats from a single source.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {outputs.map((o) => (
                <div key={o} className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
                  {o}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-lg border border-border bg-card p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-foreground">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-border gradient-electric p-10 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">Try PostSpark free</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              3 repurposes per month, no credit card. Upgrade to Pro for unlimited generations.
            </p>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:opacity-90"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Internal links */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Explore more
          </h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {internalLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export function buildSoftwareJsonLd(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
    },
  };
}

export function buildFaqJsonLd(faqs: SeoLandingFAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
