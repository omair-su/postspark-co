import { createFileRoute, Navigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { useAuth } from "@/hooks/useAuth";

const TrustedBySection = lazy(() => import("@/components/landing/TrustedBySection").then(m => ({ default: m.TrustedBySection })));
const BeforeAfterSection = lazy(() => import("@/components/landing/BeforeAfterSection").then(m => ({ default: m.BeforeAfterSection })));
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection").then(m => ({ default: m.HowItWorksSection })));
const PricingSection = lazy(() => import("@/components/landing/PricingSection").then(m => ({ default: m.PricingSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const CTABanner = lazy(() => import("@/components/landing/CTABanner").then(m => ({ default: m.CTABanner })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RepurposeAI — Turn 1 Piece of Content Into 30+" },
      { name: "description", content: "Paste your blog, PDF text, or YouTube link — get tweets, LinkedIn posts, Instagram captions, email newsletters, video scripts, and more instantly with AI." },
      { property: "og:title", content: "RepurposeAI — One Input. Infinite Content." },
      { property: "og:description", content: "AI-powered content repurposing. Turn one piece of content into 30+ pieces instantly." },
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
