import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";

const PricingSection = lazy(() => import("@/components/landing/PricingSection").then(m => ({ default: m.PricingSection })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));

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
      { name: "description", content: "Start free with 10 repurposes per month. Pro is $19/mo for unlimited AI content repurposing. Agency is $49/mo with team seats and white-label." },
      { property: "og:title", content: "PostSpark Pricing — Free, Pro $19, Agency $49" },
      { property: "og:description", content: "Plans built for creators and agencies. Cancel anytime." },
      { property: "og:url", content: "https://postspark.co/pricing" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:title", content: "PostSpark Pricing" },
      { name: "twitter:description", content: "Free, Pro $19/mo, Agency $49/mo. Cancel anytime." },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/pricing" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(PRICING_JSONLD) }],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Suspense fallback={null}>
        <div className="pt-20">
          <h1 className="sr-only">PostSpark Pricing Plans — Free, Pro, and Agency</h1>
          <PricingSection />
          <FAQSection />
          <Footer />
        </div>
      </Suspense>
    </div>
  );
}
