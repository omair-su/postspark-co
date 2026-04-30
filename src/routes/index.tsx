import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTABanner } from "@/components/landing/CTABanner";
import { useAuth } from "@/hooks/useAuth";

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
      <TrustedBySection />
      <BeforeAfterSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
