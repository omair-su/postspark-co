import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";

const PricingSection = lazy(() => import("@/components/landing/PricingSection").then(m => ({ default: m.PricingSection })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — PostSpark | Free, Pro & Agency Plans" },
      { name: "description", content: "Start free with 3 repurposes per month. Upgrade to Pro for $19/month for unlimited AI content repurposing." },
      { property: "og:title", content: "Pricing — PostSpark | Free, Pro & Agency Plans" },
      { property: "og:description", content: "Start free with 3 repurposes per month. Upgrade to Pro for $19/month for unlimited AI content repurposing." },
      { property: "og:url", content: "https://postspark.co/pricing" },
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
          <PricingSection />
          <FAQSection />
          <Footer />
        </div>
      </Suspense>
    </div>
  );
}
