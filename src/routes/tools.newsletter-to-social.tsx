import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "Newsletter to Twitter Thread & LinkedIn Posts | PostSpark";
const DESC = "Stop writing the same idea three times. Paste your newsletter — get a Twitter thread, 3 LinkedIn posts, and an Instagram carousel in one click.";
const URL = "https://postspark.co/tools/newsletter-to-social";

const FAQS = [
  { q: "Which newsletter platforms work?", a: "Substack, Beehiiv, ConvertKit, Ghost, Mailchimp — anything with a public URL or pasted content." },
  { q: "Will the social posts feel native, not recycled?", a: "Yes. Each platform gets its own structure, hook, and voice — not the same text copy-pasted." },
  { q: "Can I keep my email link in the social posts?", a: "Every post ends with a customizable CTA — link to the issue, your signup page, or anywhere you choose." },
  { q: "Is this better than ChatGPT?", a: "ChatGPT writes generic copy. PostSpark trains on your past newsletters to match your voice and includes platform-native formatting." },
];

export const Route = createFileRoute("/tools/newsletter-to-social")({
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
      eyebrow="Free Tool · Newsletter → Social"
      h1="One newsletter. A week of social content."
      subhead="Paste your issue. Get a Twitter thread, LinkedIn posts, and an Instagram carousel — each rewritten for its platform, not just copy-pasted."
      benefits={[
        { title: "Platform-native, not recycled", description: "X gets punchy line breaks. LinkedIn gets the slow-burn opener. IG gets carousel-ready chunks." },
        { title: "Your voice, not GPT's", description: "Brand Voice training reads your past newsletters and matches the rhythm." },
        { title: "Drives readers back to email", description: "Every post ends with a CTA you customize — most users see 2–3x signup lift." },
      ]}
      steps={[
        { title: "Paste your issue URL or text", description: "Substack, Beehiiv, ConvertKit — or just paste the content." },
        { title: "AI rewrites for each platform", description: "Not just chopping it up — actual platform-native rewrites." },
        { title: "Schedule with one click", description: "Copy out or push to Buffer / Hypefury / Typefully." },
      ]}
      outputs={["Twitter thread", "3 LinkedIn posts", "Instagram carousel", "Quote-tweet snippets"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/youtube-to-twitter-thread", label: "YouTube → Twitter Thread" },
        { to: "/tools/podcast-to-newsletter", label: "Podcast → Newsletter" },
        { to: "/for/creators", label: "For Creators" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
