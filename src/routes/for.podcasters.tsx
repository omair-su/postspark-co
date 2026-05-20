import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "PostSpark for Podcasters — Repurpose Every Episode | PostSpark";
const DESC = "Podcasters using PostSpark turn each episode into a newsletter, thread, LinkedIn posts, and Instagram carousels — in under 10 minutes per episode.";
const URL = "https://postspark.co/for/podcasters";

const FAQS = [
  { q: "Does it work with my podcast host?", a: "Yes — Apple Podcasts, Spotify, Buzzsprout, Transistor, RSS feeds, or direct MP3 uploads all work." },
  { q: "How much time does it actually save?", a: "Podcasters report dropping from 4–6 hours per episode of post-production content work to under 15 minutes." },
  { q: "Does it handle multi-host shows?", a: "Yes. Speaker diarization keeps each voice attributed, so quotes stay accurate." },
  { q: "Can I use this for guest interviews?", a: "Especially. Guest pull-quotes and tag-friendly social posts are built-in — your guests will reshare." },
];

export const Route = createFileRoute("/for/podcasters")({
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
      eyebrow="Built for podcasters"
      h1="Every episode is a week of content. We turn it into one."
      subhead="Drop in your audio. Walk away with a newsletter, a thread, LinkedIn posts, show notes, and pull-quote graphics — in under 10 minutes."
      benefits={[
        { title: "Drops post-production to 10 minutes", description: "What used to take a VA half a day, PostSpark does while you stretch." },
        { title: "Guest-friendly", description: "Auto-generated pull quotes with guest attribution — they'll repost it for you." },
        { title: "Multi-host clarity", description: "Speaker diarization keeps quotes accurate even on chaotic 4-person panels." },
      ]}
      steps={[
        { title: "Connect your podcast", description: "RSS, Apple, Spotify, or direct MP3 upload." },
        { title: "AI handles the heavy lifting", description: "Transcript, show notes, social posts, newsletter — all auto-generated." },
        { title: "Publish where you publish", description: "Copy to Substack, Buffer, Hypefury, LinkedIn — one click each." },
      ]}
      outputs={["Newsletter", "Show notes + timestamps", "Twitter thread", "3 LinkedIn posts", "Instagram carousel", "Guest pull quotes"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/podcast-to-newsletter", label: "Podcast → Newsletter Tool" },
        { to: "/for/creators", label: "For Creators" },
        { to: "/pricing", label: "Pricing" },
        { to: "/gallery", label: "See examples" },
      ]}
    />
  );
}
