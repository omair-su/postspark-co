import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "AI LinkedIn Post Generator — PostSpark";
const DESC = "Generate scroll-stopping LinkedIn posts from any blog, video, or PDF. Brand-voice trained, hook-optimized, and ready to publish in seconds.";
const URL = "https://postspark.co/features/linkedin-post-generator";

const FAQS = [
  { q: "Is the LinkedIn post generator free?", a: "Yes — Free plan includes 3 generations per month. Pro is $24/mo for unlimited posts with brand voice training." },
  { q: "Will my posts sound generic?", a: "No. PostSpark trains on your past LinkedIn writing samples (Pro feature) so every post matches your tone, vocabulary, and rhythm." },
  { q: "What hooks does PostSpark use?", a: "Our Hook Lab tests 50+ proven LinkedIn opening patterns and auto-picks the strongest match for your topic." },
  { q: "Can I schedule posts directly to LinkedIn?", a: "Posts copy cleanly into Buffer, Hypefury, Typefully, or LinkedIn's native composer with one click." },
];

export const Route = createFileRoute("/features/linkedin-post-generator")({
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
      eyebrow="LinkedIn Generator"
      h1="The AI LinkedIn post generator that sounds like you"
      subhead="Train PostSpark on your voice, paste any source, and get 3 LinkedIn-ready posts with proven hooks and formatting — every time."
      benefits={[
        { title: "Brand voice training", description: "Upload past posts; PostSpark mirrors your tone instead of producing AI-flavored slop." },
        { title: "Hook Lab built in", description: "50+ tested LinkedIn opening patterns. We pick the best match per topic automatically." },
        { title: "Optimized formatting", description: "Line breaks, emojis, and length tuned for the LinkedIn algorithm." },
      ]}
      steps={[
        { title: "Add a source", description: "Blog URL, YouTube link, PDF, or raw text." },
        { title: "Pick LinkedIn output", description: "Or generate every format at once for cross-channel publishing." },
        { title: "Copy & publish", description: "Drops into LinkedIn's composer, Buffer, Typefury, or Hypefury cleanly." },
      ]}
      outputs={["3 LinkedIn Posts", "LinkedIn Carousel", "Hook Variations", "Comment Starters"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/features/repurpose-blog-to-social", label: "Blog → Social" },
        { to: "/features/youtube-to-tweets", label: "YouTube → Tweets" },
        { to: "/for/creators", label: "For Creators" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
