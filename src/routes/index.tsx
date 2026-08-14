import { useState } from "react";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useFadeIn } from "@/components/landing/v4/parts";
import { Lp4Announcement, Lp4Nav, Lp4Hero, Lp4SocialProof, Lp4HowItWorks } from "@/components/landing/v4/SectionsTop";
import { Lp4TrustStrip, Lp4ModelMarquee, Lp4PlatformGrid } from "@/components/landing/v4/Trust";
import { Lp4Studios, Lp4Features } from "@/components/landing/v4/SectionsMid";
import { Lp4Guided, Lp4Testimonials, Lp4Stats } from "@/components/landing/v4/SectionsBottom";
import {
  Lp4Pricing,
  Lp4Faq,
  Lp4FinalCta,
  Lp4Footer,
  Lp4StickyCta,
  Lp4CookieBar,
  LP4_FAQ,
} from "@/components/landing/v4/SectionsEnd";

const TITLE = "PostSpark — Turn 1 Idea Into 30+ AI Posts";
const DESCRIPTION =
  "Repurpose one idea into LinkedIn posts, carousels, TikTok scripts and SEO blogs — then publish to 7 platforms. Free to start, no card.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "AI content repurposing, social media AI, LinkedIn content creator, TikTok script generator, content operating system",
      },
      { property: "og:title", content: "PostSpark — AI Content Operating System" },
      {
        property: "og:description",
        content:
          "Turn one idea into a week of content. Repurpose, create & publish to LinkedIn, TikTok, Instagram, YouTube & more — powered by Claude AI.",
      },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { property: "og:url", content: "https://postspark.co" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PostSpark — AI Content Operating System" },
      {
        name: "twitter:description",
        content:
          "Turn one idea into a week of content across 7 platforms. AI repurposing, image generation & direct publishing.",
      },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "PostSpark",
          applicationCategory: "BusinessApplication",
          description: "AI Content Operating System for creators and marketers",
          url: "https://postspark.co",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          operatingSystem: "Web",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: LP4_FAQ.map((f) => ({
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
  const [banner, setBanner] = useState(true);
  useFadeIn();

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="lp4 min-h-screen" style={{ paddingTop: banner ? 36 : 0 }}>
      {banner && <Lp4Announcement onClose={() => setBanner(false)} />}
      <Lp4Nav offset={banner ? 36 : 0} />
      <main>
        <Lp4Hero />
        <Lp4TrustStrip />
        <Lp4ModelMarquee />
        <Lp4PlatformGrid />
        <Lp4SocialProof />
        <Lp4HowItWorks />
        <Lp4Studios />
        <Lp4Features />
        <Lp4Guided />
        <Lp4Testimonials />
        <Lp4Stats />
        <Lp4Pricing />
        <Lp4Faq />
        <Lp4FinalCta />
      </main>
      <Lp4Footer />
      <Lp4StickyCta />
      <Lp4CookieBar />
    </div>
  );
}

