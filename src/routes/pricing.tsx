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

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is there really a free plan? What's the catch?", acceptedAnswer: { "@type": "Answer", text: "Yes — 10 free repurposes every month, no credit card required. The catch is fair: heavy users on Pro fund the free tier. If 10 isn't enough, upgrade to Pro ($19/mo) for unlimited." } },
    { "@type": "Question", name: "Can I cancel anytime? What if I'm not satisfied?", acceptedAnswer: { "@type": "Answer", text: "Cancel any time from Settings in one click — and we offer a 30-day money-back guarantee. If PostSpark doesn't save you hours in the first month, email us for a full refund, no questions asked." } },
    { "@type": "Question", name: "Will the output actually sound like me, not generic AI?", acceptedAnswer: { "@type": "Answer", text: "Yes. Pro and Agency users train PostSpark on writing samples + a Brand Kit (logo, colors, tone). Generations match your voice — so closely your audience won't notice the difference." } },
    { "@type": "Question", name: "How is PostSpark different from ChatGPT or other AI tools?", acceptedAnswer: { "@type": "Answer", text: "ChatGPT is a blank prompt. PostSpark is a full content engine: brand voice training, image studio, podcast → posts, SEO blog writer, content calendar, agency client approvals, and more — all in one workflow built for creators and agencies." } },
    { "@type": "Question", name: "Do you offer team seats and white-label for agencies?", acceptedAnswer: { "@type": "Answer", text: "Yes — the Agency plan ($49/mo) includes 5 team seats, multi-brand workspaces, white-label client approval links, and agency-wide analytics. Built specifically for content agencies managing multiple clients." } },
  ],
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — PostSpark | Free, Pro $19/mo, Agency $49/mo" },
      { name: "description", content: "Start free with 3 repurposes per month. Pro is $19/mo for unlimited AI content repurposing. Agency is $49/mo with team seats and white-label." },
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
      { type: "application/ld+json", children: JSON.stringify(FAQ_JSONLD) },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Suspense fallback={null}>
        <div className="pt-20">
          <header className="mx-auto max-w-4xl px-4 pt-10 pb-4 text-center sm:px-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
              Pricing built for creators and agencies
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Start free with 3 repurposes a month. Upgrade to Pro for unlimited, or Agency for team seats and white-label.
            </p>
          </header>
          <PricingSection />
          <FAQSection />
          <Footer />
        </div>
      </Suspense>
    </div>
  );
}
