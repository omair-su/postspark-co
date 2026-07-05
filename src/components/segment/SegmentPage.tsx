import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import { PricingV3 } from "@/components/landing/v3/PricingV3";
import { FAQV3 } from "@/components/landing/v3/FAQV3";
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from "@/components/marketing/Breadcrumbs";
import { QuickAnswer } from "@/components/marketing/QuickAnswer";
import { RelatedTools } from "@/components/marketing/RelatedTools";
import { track } from "@/lib/analytics";

export type SegmentPageProps = {
  eyebrow: string;
  h1: string;
  sub: string;
  pains: string[];
  solutions: string[];
  workflow?: { title: string; body: string }[];
  path?: string;
  quickAnswer?: { question: string; answer: string };
};

function crumbsFromPath(path?: string): Crumb[] {
  if (!path) return [];
  const segs = path.replace(/^\/+|\/+$/g, "").split("/");
  if (segs.length === 0) return [];
  const labels: Record<string, string> = {
    tools: "Tools",
    features: "Features",
    alternatives: "Compare",
    for: "Solutions",
    "use-cases": "Use cases",
  };
  const out: Crumb[] = [];
  if (labels[segs[0]]) {
    out.push({ label: labels[segs[0]], href: segs[0] === "tools" ? "/#studios" : `/#${segs[0]}` });
  }
  const last = segs[segs.length - 1]
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  out.push({ label: last });
  return out;
}

export function SegmentPage(p: SegmentPageProps) {
  const crumbs = crumbsFromPath(p.path);
  return (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden lv3-grain">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 lv3-drift"
            style={{
              background:
                "radial-gradient(40% 30% at 20% 20%, rgba(124,58,237,0.32), transparent 70%), radial-gradient(35% 25% at 80% 30%, rgba(6,182,212,0.24), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-28 sm:pt-36 pb-16">
            {crumbs.length > 0 && (
              <div className="mb-8 opacity-80">
                <Breadcrumbs items={crumbs} />
              </div>
            )}
            {p.quickAnswer && (
              <div className="mb-8 rounded-2xl lv3-glass lv3-gradient-border p-6">
                <p className="text-xs uppercase tracking-widest" style={{ color: "#A78BFA" }}>Quick answer</p>
                <p className="mt-2 font-display-lux text-lg sm:text-xl" style={{ color: "#FAFAF9" }}>{p.quickAnswer.question}</p>
                <p className="mt-2 text-sm sm:text-base" style={{ color: "rgba(250,250,249,0.75)", lineHeight: 1.6 }}>{p.quickAnswer.answer}</p>
              </div>
            )}
            <span className="lv3-chip lv3-fade-up">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
              {p.eyebrow}
            </span>
            <h1
              className="mt-6 font-display-lux text-balance lv3-fade-up"
              style={{
                fontSize: "clamp(36px, 6vw, 72px)",
                lineHeight: 1.04,
                color: "#FAFAF9",
                maxWidth: "20ch",
              }}
            >
              {p.h1}
            </h1>
            <p
              className="mt-6 max-w-2xl lv3-fade-up"
              style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.6, color: "rgba(250,250,249,0.7)" }}
            >
              {p.sub}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3 lv3-fade-up">
              <Link
                to="/signup"
                onClick={() => track("cta_click", { from: "segment_hero", page: p.eyebrow })}
                className="lv3-cta inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-[15px] font-semibold"
              >
                Start free — no card <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="lv3-cta-ghost inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-medium"
              >
                See pricing
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "rgba(250,250,249,0.55)" }}>
              {["3 free repurposes monthly", "No credit card required", "Cancel anytime"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" style={{ color: "#34D399" }} /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PAINS + SOLUTIONS */}
        <section className="relative py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="lv3-chip">The problem · The fix</p>
            <h2
              className="mt-4 max-w-3xl font-display-lux"
              style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
            >
              What's costing you hours — <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>and how PostSpark removes it.</em>
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl p-7 lv3-glass" style={{ borderLeft: "3px solid rgba(239,68,68,0.55)" }}>
                <h3 className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                  What's draining your week
                </h3>
                <ul className="mt-4 space-y-3">
                  {p.pains.map((x, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(250,250,249,0.78)", lineHeight: 1.65 }}>
                      <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#F87171" }} /> {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl p-7 lv3-glass lv3-gradient-border" style={{ borderLeft: "3px solid #7C3AED" }}>
                <h3 className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                  What PostSpark gives you
                </h3>
                <ul className="mt-4 space-y-3">
                  {p.solutions.map((x, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(250,250,249,0.85)", lineHeight: 1.65 }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#A78BFA" }} /> {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        {p.workflow && p.workflow.length > 0 && (
          <section className="relative py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <p className="lv3-chip">Your workflow</p>
              <h2
                className="mt-4 font-display-lux"
                style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
              >
                How it works for you
              </h2>
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {p.workflow.map((w, i) => (
                  <div key={i} className="rounded-3xl p-7 lv3-glass lv3-gradient-border lv3-card-hover">
                    <div
                      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: "rgba(124,58,237,0.18)", color: "#C4B5FD", border: "1px solid rgba(124,58,237,0.3)" }}
                    >
                      Step {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="mt-4 font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                      {w.title}
                    </h3>
                    <p className="mt-2 text-sm" style={{ color: "rgba(250,250,249,0.68)", lineHeight: 1.65 }}>
                      {w.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <PricingV3 />
        <FAQV3 />
        {p.path && (
          <div className="dark-related-wrap">
            <RelatedTools currentPath={p.path} />
          </div>
        )}

        {/* Final CTA */}
        <section className="relative py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
            <h2 className="font-display-lux" style={{ fontSize: "clamp(34px, 5vw, 60px)", color: "#FAFAF9", lineHeight: 1.05 }}>
              Ready to <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>ship a month of content?</em>
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: "rgba(250,250,249,0.7)" }}>
              Free forever plan. No credit card. Cancel anytime.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/signup" className="lv3-cta inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <FooterV3 />
      </main>
    </div>
  );
}

export function segmentHead(opts: {
  title: string;
  desc: string;
  url: string;
  path?: string;
  faq?: { q: string; a: string }[];
}) {
  const scripts: Array<{ type: string; children: string }> = [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "PostSpark",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: opts.desc,
        url: opts.url,
      }),
    },
  ];

  if (opts.path) {
    const segs = opts.path.replace(/^\/+|\/+$/g, "").split("/");
    const labels: Record<string, string> = {
      tools: "Tools",
      features: "Features",
      alternatives: "Compare",
      for: "Solutions",
      "use-cases": "Use cases",
    };
    const items: { label: string; href?: string }[] = [];
    if (labels[segs[0]]) items.push({ label: labels[segs[0]], href: `/${segs[0]}` });
    const last = segs[segs.length - 1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    items.push({ label: last, href: opts.path });
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(breadcrumbJsonLd(items)),
    });
  }

  if (opts.faq && opts.faq.length > 0) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: opts.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    });
  }

  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.desc },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.desc },
      { property: "og:url", content: opts.url },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: opts.url },
    ],
    scripts,
  };
}
