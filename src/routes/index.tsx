import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { AnimatedMetrics } from "@/components/landing/AnimatedMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";

const LuxuryHero = lazy(() => import("@/components/landing/LuxuryHero").then(m => ({ default: m.LuxuryHero })));
const MagneticCursor = lazy(() => import("@/components/landing/MagneticCursor").then(m => ({ default: m.MagneticCursor })));
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
      { title: "PostSpark — AI Content Repurposing | Turn 1 Post Into 30" },
      { name: "description", content: "PostSpark uses AI to repurpose your blog posts, YouTube videos and PDFs into tweets, LinkedIn posts, email newsletters and video scripts instantly. Try free." },
      { property: "og:title", content: "PostSpark — Turn 1 Post Into 30 Instantly" },
      { property: "og:description", content: "AI-powered content repurposing for creators" },
      { property: "og:url", content: "https://postspark.co" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://postspark.co" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "PostSpark",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "127" },
          description: "AI-powered content repurposing tool for creators and agencies.",
          url: "https://postspark.co",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "What is PostSpark?", acceptedAnswer: { "@type": "Answer", text: "PostSpark is an AI tool that turns one blog post, YouTube video, or PDF into 30+ pieces of content — tweets, LinkedIn posts, email newsletters, and video scripts — in seconds." } },
            { "@type": "Question", name: "Is there a free plan?", acceptedAnswer: { "@type": "Answer", text: "Yes. The Free plan includes 10 repurposes per month with no credit card required." } },
            { "@type": "Question", name: "How much does PostSpark cost?", acceptedAnswer: { "@type": "Answer", text: "Pro is $19/month for unlimited repurposes. Agency is $49/month and adds 5 team seats, white-label, and client approvals." } },
            { "@type": "Question", name: "Can I cancel anytime?", acceptedAnswer: { "@type": "Answer", text: "Yes. Cancel any time from Settings. You keep access until the end of your current billing period." } },
            { "@type": "Question", name: "Does PostSpark match my brand voice?", acceptedAnswer: { "@type": "Answer", text: "Yes. Pro and Agency users can train PostSpark on writing samples and a Brand Kit (logo, colors, tone) so generations sound like them." } },
          ],
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { session, loading } = useAuth();
  useLenis();

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen scroll-smooth bg-[#06060f]">
      <Navbar />
      {/* 3D luxury hero on client; SSR + reduced-motion fall back to original HeroSection */}
      <ClientOnly fallback={<HeroSection />}>
        <Suspense fallback={<HeroSection />}>
          <LuxuryHero />
          <MagneticCursor />
        </Suspense>
      </ClientOnly>

      <MarqueeStrip />
      <AnimatedMetrics />

      <Suspense fallback={<div className="h-[400px] w-full animate-pulse bg-gradient-to-b from-background to-muted/30" aria-hidden />}>
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
