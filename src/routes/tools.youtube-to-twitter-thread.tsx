import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "YouTube to Twitter Thread Generator — Free Tool | PostSpark";
const DESC = "Turn any YouTube video into a high-engagement Twitter (X) thread in 60 seconds. Free, no signup — paste a URL, get a publish-ready thread written in your voice.";
const URL = "https://postspark.co/tools/youtube-to-twitter-thread";

const FAQS = [
  { q: "Is the YouTube to Twitter thread tool free?", a: "Yes — your first thread is free with no signup. After that, free accounts get 3 repurposes per month." },
  { q: "Do I need the video's transcript?", a: "No. PostSpark fetches the transcript automatically from the YouTube URL." },
  { q: "Can I edit the thread before posting?", a: "Yes. Every tweet is editable in the dashboard, and we generate 3 hook variants so you can A/B test." },
  { q: "How long can the source video be?", a: "Up to 3 hours. Longer videos are chunked and summarized in stages." },
];

export const Route = createFileRoute("/tools/youtube-to-twitter-thread")({
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
      eyebrow="Free Tool · YouTube → X Thread"
      h1="Turn any YouTube video into a viral Twitter thread"
      subhead="Paste a URL. Get a 10-tweet thread with hook variants, optimized for engagement on X. No signup required for your first thread."
      benefits={[
        { title: "Hook variants included", description: "We generate 3 opening tweets so you can pick the one most likely to stop the scroll." },
        { title: "Native X formatting", description: "Line breaks, emoji placement, and character counts tuned for the X algorithm." },
        { title: "Your voice, not AI-speak", description: "Brand Voice training keeps the tone yours, not generic." },
      ]}
      steps={[
        { title: "Paste the YouTube URL", description: "Any public video works — no channel ownership needed." },
        { title: "AI builds the thread", description: "Claude reads the transcript and pulls the most quotable moments." },
        { title: "Copy & post", description: "One-click copy or schedule via your favorite tool." },
      ]}
      outputs={["10-tweet thread", "3 hook variants", "Quote tweet ideas", "Reply suggestions"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/blog-to-linkedin-carousel", label: "Blog → LinkedIn Carousel" },
        { to: "/tools/podcast-to-newsletter", label: "Podcast → Newsletter" },
        { to: "/features/youtube-to-tweets", label: "Full YouTube → Social Suite" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
