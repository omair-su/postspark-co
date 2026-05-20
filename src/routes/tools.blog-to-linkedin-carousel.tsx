import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "Blog to LinkedIn Carousel Generator | PostSpark";
const DESC = "Turn any blog post into a swipe-stopping LinkedIn carousel (PDF) in under a minute. Free first carousel — branded slides, your voice, ready to upload.";
const URL = "https://postspark.co/tools/blog-to-linkedin-carousel";

const FAQS = [
  { q: "What format is the carousel exported in?", a: "PDF — the format LinkedIn natively supports for document/carousel posts." },
  { q: "Can I add my brand colors and logo?", a: "Yes. Pro and Agency plans include Brand Kit — set your colors, fonts, and logo once and they apply to every carousel." },
  { q: "How many slides will it generate?", a: "Default is 8 slides (cover + 6 insight + CTA). You can tune slide count and depth in the editor." },
  { q: "Will it work for a long blog post?", a: "Yes. PostSpark extracts the strongest takeaways and condenses them into snackable slides." },
];

export const Route = createFileRoute("/tools/blog-to-linkedin-carousel")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(buildSoftwareJsonLd("PostSpark", DESC, URL)) },
      { type: "application/ld+json", children: JSON.stringify(buildFaqJsonLd(FAQS)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SeoLandingPage
      eyebrow="Free Tool · Blog → LinkedIn Carousel"
      h1="Turn any blog post into a LinkedIn carousel"
      subhead="Paste a URL. Get a branded, swipe-stopping PDF carousel with your voice and visuals — ready to upload to LinkedIn."
      benefits={[
        { title: "Branded out of the box", description: "Pro plans auto-apply your Brand Kit (colors, fonts, logo) to every slide." },
        { title: "Hook-first structure", description: "Cover slide built for the LinkedIn algorithm — designed to stop the scroll mid-feed." },
        { title: "Editable in-app", description: "Tweak any slide before exporting. No Figma, no design skills required." },
      ]}
      steps={[
        { title: "Paste the blog URL", description: "Any public article works — Medium, Substack, your own blog." },
        { title: "AI builds 8 slides", description: "Strongest takeaways become slide titles + supporting copy." },
        { title: "Export PDF & upload", description: "Drop into LinkedIn as a document post — done." },
      ]}
      outputs={["8-slide PDF carousel", "Hook + CTA slides", "Companion LinkedIn caption", "Reusable template"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/youtube-to-twitter-thread", label: "YouTube → Twitter Thread" },
        { to: "/tools/podcast-to-newsletter", label: "Podcast → Newsletter" },
        { to: "/features/linkedin-post-generator", label: "LinkedIn Post Generator" },
        { to: "/dashboard/brand-kit", label: "Brand Kit" },
      ]}
    />
  );
}
