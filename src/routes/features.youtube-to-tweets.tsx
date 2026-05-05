import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "YouTube to Tweets & Threads Generator — PostSpark";
const DESC = "Convert any YouTube video into 10+ tweets, a Twitter thread, LinkedIn posts, and a newsletter. Paste a YouTube URL and get publish-ready posts in 60 seconds.";
const URL = "https://postspark.co/features/youtube-to-tweets";

const FAQS = [
  { q: "How does PostSpark turn a YouTube video into tweets?", a: "We pull the video transcript, summarize the key insights with Claude AI, and rewrite them as platform-native tweets, threads, and posts that match your brand voice." },
  { q: "Do I need to upload the video?", a: "No. Just paste the YouTube URL — PostSpark fetches the transcript automatically." },
  { q: "Will it work with long-form videos?", a: "Yes. PostSpark handles videos up to 3 hours. Longer videos are chunked and summarized in stages." },
  { q: "Can I generate a LinkedIn post from a YouTube video?", a: "Every repurpose includes 3 LinkedIn-formatted posts in addition to tweets, a thread, and an email newsletter." },
];

export const Route = createFileRoute("/features/youtube-to-tweets")({
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
      eyebrow="YouTube → Social"
      h1="Turn any YouTube video into tweets, threads & LinkedIn posts"
      subhead="Stop letting your best videos collect dust. Paste a YouTube URL and get a full content batch optimized for every platform."
      benefits={[
        { title: "Auto-transcribed", description: "PostSpark grabs the transcript instantly — no manual upload, no Whisper setup." },
        { title: "Hooks that convert", description: "Tweets and LinkedIn openers built from your strongest moments using our Hook Lab AI." },
        { title: "Multi-platform output", description: "Threads for X, carousels for Instagram, posts for LinkedIn, and newsletters for email." },
      ]}
      steps={[
        { title: "Paste the YouTube URL", description: "Public videos work — no channel ownership required." },
        { title: "AI extracts insights", description: "Claude reads the transcript and identifies the most quotable moments." },
        { title: "Get 30+ ready-to-post pieces", description: "Edit in our dashboard or copy with one click." },
      ]}
      outputs={["10 Tweets", "Twitter Thread", "3 LinkedIn Posts", "Email Newsletter", "Instagram Carousel", "Blog Article"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/features/repurpose-blog-to-social", label: "Blog → Social" },
        { to: "/features/linkedin-post-generator", label: "LinkedIn Post Generator" },
        { to: "/for/creators", label: "For Creators" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
