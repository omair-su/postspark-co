import { HeroV3 } from "@/components/landing/v3/HeroV3";
import { LogoStripV3 } from "@/components/landing/v3/LogoStripV3";
import { HowItWorksV3 } from "@/components/landing/v3/HowItWorksV3";
import { FeatureBento } from "@/components/landing/v3/FeatureBento";
import { TestimonialsV3 } from "@/components/landing/v3/TestimonialsV3";
import { FAQV3, FAQ_V3 } from "@/components/landing/v3/FAQV3";
import { FinalCTAV3 } from "@/components/landing/v3/FinalCTAV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { ToolsGridV3 } from "@/components/landing/v3/ToolsGridV3";
import { ModelsStripV3 } from "@/components/landing/v3/ModelsStripV3";
import { CompareV3 } from "@/components/landing/v3/CompareV3";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PostSpark — Turn 1 Video Into a Month of Content" },
      { name: "description", content: "PostSpark repurposes your podcast, YouTube, or Zoom into 30+ posts, shorts, and threads — in your voice, in under 60 seconds. Free, no card." },
      { property: "og:title", content: "PostSpark — Turn 1 Video Into a Month of Content" },
      { property: "og:description", content: "PostSpark repurposes your podcast, YouTube, or Zoom into 30+ posts, shorts, and threads — in your voice, in under 60 seconds. Free, no card." },
      { property: "og:url", content: "https://postspark.co" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://postspark.co" },
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
          mainEntity: FAQ_V3.map((f) => ({
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
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <main>
        <HeroV3 />
        <LogoStripV3 />
        <ToolsGridV3 />
        <ModelsStripV3 />
        <HowItWorksV3 />
        <FeatureBento />
        <CompareV3 />
        <TestimonialsV3 />
        <FAQV3 />
        <FinalCTAV3 />
        <FooterV3 />
      </main>
    </div>
  );
}
