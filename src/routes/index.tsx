import { createFileRoute, Navigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { useAuth } from "@/hooks/useAuth";

const TrustedBySection = lazy(() => import("@/components/landing/TrustedBySection").then(m => ({ default: m.TrustedBySection })));
const BeforeAfterSection = lazy(() => import("@/components/landing/BeforeAfterSection").then(m => ({ default: m.BeforeAfterSection })));
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const PremiumFeaturesSection = lazy(() => import("@/components/landing/PremiumFeaturesSection").then(m => ({ default: m.PremiumFeaturesSection })));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection").then(m => ({ default: m.HowItWorksSection })));
const PricingSection = lazy(() => import("@/components/landing/PricingSection").then(m => ({ default: m.PricingSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const CTABanner = lazy(() => import("@/components/landing/CTABanner").then(m => ({ default: m.CTABanner })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PostSpark — AI Content Repurposing Tool | Turn 1 Post Into 30" },
      { name: "description", content: "PostSpark uses AI to repurpose your blog posts, YouTube videos and PDFs into tweets, LinkedIn posts, email newsletters and video scripts instantly. Try free." },
      { property: "og:title", content: "PostSpark — Turn 1 Post Into 30 Instantly" },
      { property: "og:description", content: "AI-powered content repurposing for creators" },
      { property: "og:url", content: "https://postspark.co" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "PostSpark",
          applicationCategory: "BusinessApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: "AI-powered content repurposing tool",
          url: "https://postspark.co",
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { session, loading } = useAuth();

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen scroll-smooth">
      <Navbar />
      <HeroSection />
      <Suspense fallback={null}>
        <TrustedBySection />
        <BeforeAfterSection />
        <FeaturesSection />
        <PremiumFeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTABanner />
        <Footer />
      </Suspense>
    </div>
  );
}
