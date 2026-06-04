import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/landing/v2/Hero";
import { SocialProofBar } from "@/components/landing/v2/SocialProofBar";
import { PainSection } from "@/components/landing/v2/PainSection";
import { WhoFor } from "@/components/landing/v2/WhoFor";
import { HowItWorks } from "@/components/landing/v2/HowItWorks";
import { PricingV2 } from "@/components/landing/v2/PricingV2";
import { FoundingMember } from "@/components/landing/v2/FoundingMember";
import { FAQv2, FAQ_LIST } from "@/components/landing/v2/FAQv2";
import { FinalCTA } from "@/components/landing/v2/FinalCTA";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PostSpark — AI Content Repurposing | Turn 1 Post Into 30" },
      { name: "description", content: "Paste one blog post, video, or podcast. PostSpark generates tweets, LinkedIn posts, newsletters and video scripts in your voice. Free plan, no card." },
      { property: "og:title", content: "PostSpark — Stop Rewriting Content for Every Platform" },
      { property: "og:description", content: "AI content repurposing powered by Claude. Turn 1 input into 30 platform-ready pieces in under 60 seconds." },
      { property: "og:url", content: "https://postspark.co" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://postspark.co" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap" },
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
          description: "AI-powered content repurposing tool powered by Claude AI.",
          url: "https://postspark.co",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_LIST.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { session, loading } = useAuth();
  if (!loading && session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen scroll-smooth" style={{ background: "#FFFFFF" }}>
      <Navbar />
      <main>
        <Hero />
        <SocialProofBar />
        <PainSection />
        <WhoFor />
        <HowItWorks />
        <PricingV2 />
        <FoundingMember />
        <FAQv2 />
        <FinalCTA />
        <FooterV2 />
      </main>
    </div>
  );
}
