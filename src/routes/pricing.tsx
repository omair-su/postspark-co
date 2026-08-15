import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useFadeIn, delay } from "@/components/landing/v4/parts";
import { Lp4Nav } from "@/components/landing/v4/SectionsTop";
import { Lp4ModelMarquee } from "@/components/landing/v4/Trust";
import { Lp4Testimonials } from "@/components/landing/v4/SectionsBottom";
import {
  Lp4Pricing,
  Lp4FinalCta,
  Lp4Footer,
  Lp4StickyCta,
  LP4_FAQ,
} from "@/components/landing/v4/SectionsEnd";
import { Lp4PageHero, Lp4TrustRow } from "@/components/landing/v4/PageHero";
import {
  Lp4Lifetime,
  Lp4Roi,
  Lp4CompareMatrix,
  BILLING_FAQ,
} from "@/components/pricing/PricingExtras";
import {
  PRICE_PRO_MONTHLY,
  PRICE_PRO_ANNUAL_PER_MONTH,
  PRICE_AGENCY_MONTHLY,
  PRICE_LIFETIME,
} from "@/lib/pricing";

const FAQ = [...BILLING_FAQ, ...LP4_FAQ];

const PRICING_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "PostSpark",
  description:
    "AI content repurposing tool that turns blog posts, PDFs, and YouTube videos into tweets, LinkedIn posts, email newsletters, and video scripts.",
  brand: { "@type": "Brand", name: "PostSpark" },
  image: "https://postspark.co/og-image.png",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: "https://postspark.co/pricing" },
    { "@type": "Offer", name: "Pro", price: String(PRICE_PRO_MONTHLY), priceCurrency: "USD", url: "https://postspark.co/pricing" },
    { "@type": "Offer", name: "Agency", price: String(PRICE_AGENCY_MONTHLY), priceCurrency: "USD", url: "https://postspark.co/pricing" },
    { "@type": "Offer", name: "Founding Lifetime", price: String(PRICE_LIFETIME), priceCurrency: "USD", url: "https://postspark.co/pricing" },
  ],
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: `Pricing — PostSpark | Free, Pro $${PRICE_PRO_MONTHLY}/mo, Agency $${PRICE_AGENCY_MONTHLY}/mo` },
      {
        name: "description",
        content: `Start free with 3 repurposes per month. Pro is $${PRICE_PRO_MONTHLY}/mo ($${PRICE_PRO_ANNUAL_PER_MONTH}/mo annual) for unlimited AI content repurposing. Agency is $${PRICE_AGENCY_MONTHLY}/mo with team seats and white-label.`,
      },
      { property: "og:title", content: `PostSpark Pricing — Free, Pro $${PRICE_PRO_MONTHLY}, Agency $${PRICE_AGENCY_MONTHLY}` },
      { property: "og:description", content: "Plans built for creators and agencies. 7-day free trial, cancel anytime." },
      { property: "og:url", content: "https://postspark.co/pricing" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PostSpark Pricing" },
      { name: "twitter:description", content: `Free, Pro $${PRICE_PRO_MONTHLY}/mo, Agency $${PRICE_AGENCY_MONTHLY}/mo. Cancel anytime.` },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/pricing" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(PRICING_JSONLD) },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: PricingPage,
});

function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-6 py-14 sm:py-20" style={{ background: "#FAFAFA" }}>
      <div className="mx-auto max-w-[720px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">FAQ</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(28px,4.4vw,44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0F0F1A", ...delay(80) }}
          >
            Billing, plans & everything else
          </h2>
        </div>
        <div className="fade-in-up mt-9" style={delay(160)}>
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0F0F1A" }}>{f.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                    style={{ color: "#7C3AED", transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? 360 : 0, opacity: isOpen ? 1 : 0 }}>
                  <p className="pb-5" style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65 }}>
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingPage() {
  useFadeIn();

  return (
    <div className="lp4 min-h-screen">
      <Lp4Nav />
      <main>
        <Lp4PageHero
          label="Pricing"
          title="Pricing built for"
          accent="creators & agencies."
          subtitle={`Start free with 3 repurposes a month. Go Pro for unlimited at $${PRICE_PRO_MONTHLY}/mo (or $${PRICE_PRO_ANNUAL_PER_MONTH}/mo annual), or run every client brand on Agency.`}
        >
          <Lp4TrustRow items={["No credit card to start", "7-day free trial on paid plans", "Cancel anytime", "9 publishing platforms"]} />
        </Lp4PageHero>

        <Lp4Pricing />
        <Lp4Roi />
        <Lp4CompareMatrix />
        <Lp4Lifetime />
        <Lp4ModelMarquee />
        <Lp4Testimonials />
        <FaqList />
        <Lp4FinalCta />
      </main>
      <Lp4Footer />
      <Lp4StickyCta />
    </div>
  );
}
