import { createFileRoute } from "@tanstack/react-router";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import { PricingV3 } from "@/components/landing/v3/PricingV3";
import { FAQV3 } from "@/components/landing/v3/FAQV3";
import { Sparkles } from "lucide-react";

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
    { "@type": "Offer", name: "Pro", price: "19", priceCurrency: "USD", url: "https://postspark.co/pricing" },
    { "@type": "Offer", name: "Agency", price: "49", priceCurrency: "USD", url: "https://postspark.co/pricing" },
  ],
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — PostSpark | Free, Pro $19/mo, Agency $49/mo" },
      {
        name: "description",
        content:
          "Start free with 3 repurposes per month. Pro is $19/mo for unlimited AI content repurposing. Agency is $49/mo with team seats and white-label.",
      },
      { property: "og:title", content: "PostSpark Pricing — Free, Pro $19, Agency $49" },
      { property: "og:description", content: "Plans built for creators and agencies. Cancel anytime." },
      { property: "og:url", content: "https://postspark.co/pricing" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:title", content: "PostSpark Pricing" },
      { name: "twitter:description", content: "Free, Pro $19/mo, Agency $49/mo. Cancel anytime." },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/pricing" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(PRICING_JSONLD) },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <main>
        <section className="relative overflow-hidden lv3-grain">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 lv3-drift"
            style={{
              background:
                "radial-gradient(45% 32% at 25% 20%, rgba(124,58,237,0.34), transparent 70%), radial-gradient(40% 28% at 78% 25%, rgba(6,182,212,0.24), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-5 sm:px-8 pt-32 sm:pt-40 pb-8 text-center">
            <span className="lv3-chip lv3-fade-up">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
              Pricing
            </span>
            <h1
              className="mt-6 font-display-lux text-balance lv3-fade-up"
              style={{
                fontSize: "clamp(40px, 6.5vw, 84px)",
                lineHeight: 1.03,
                color: "#FAFAF9",
                maxWidth: "18ch",
                marginInline: "auto",
              }}
            >
              Pricing built for{" "}
              <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>
                creators & agencies.
              </em>
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl lv3-fade-up"
              style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.6, color: "rgba(250,250,249,0.7)" }}
            >
              Start free with 3 repurposes a month. Upgrade to Pro for unlimited, or Agency for team seats and white-label.
            </p>
          </div>
        </section>

        <PricingV3 />
        <FAQV3 />
        <FooterV3 />
      </main>
    </div>
  );
}
