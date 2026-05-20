import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "PostSpark for YouTubers — Repurpose Every Video | PostSpark";
const DESC = "YouTubers using PostSpark turn every upload into tweets, LinkedIn posts, an email newsletter, and a Shorts script — in minutes per video.";
const URL = "https://postspark.co/for/youtubers";

const FAQS = [
  { q: "Does it work for videos under 5 minutes?", a: "Yes — Shorts, long-form, and everything in between. Short videos get punchier output." },
  { q: "Can I generate ideas for my next video?", a: "Yes. Every run includes 5 follow-up video angle ideas based on what resonated in the source." },
  { q: "Will it match my channel's vibe?", a: "Brand Voice training reads your past video descriptions and community posts to keep tone consistent." },
  { q: "Do I need the video uploaded publicly?", a: "Unlisted videos work if you have the URL. Private videos require a transcript paste." },
];

export const Route = createFileRoute("/for/youtubers")({
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
      eyebrow="Built for YouTubers"
      h1="Stop letting your best videos die at 10k views."
      subhead="One YouTube URL → a Twitter thread, LinkedIn posts, an email newsletter, and a Shorts script. Drive traffic back to the video on every platform."
      benefits={[
        { title: "Subscribe-funnel built in", description: "Every post includes a CTA back to the video — most users see 20–40% lift in subs from social." },
        { title: "Shorts script auto-generated", description: "Take the strongest 30-second moment and get a vertical-format script back." },
        { title: "Next-video ideas", description: "AI suggests 5 follow-up angles based on what the source video covered." },
      ]}
      steps={[
        { title: "Paste the YouTube URL", description: "Public or unlisted videos both work." },
        { title: "AI extracts the gold", description: "Strongest hooks, quotable moments, and CTA-ready takeaways." },
        { title: "Post everywhere", description: "Copy or push to your scheduler — full week of content from one upload." },
      ]}
      outputs={["Twitter thread", "3 LinkedIn posts", "Email newsletter", "Shorts script", "Pinned-comment ideas", "5 next-video angles"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/youtube-to-twitter-thread", label: "YouTube → Twitter Thread Tool" },
        { to: "/features/youtube-to-tweets", label: "Full YouTube Suite" },
        { to: "/for/creators", label: "For Creators" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
