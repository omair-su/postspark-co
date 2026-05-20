import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "Podcast to Newsletter Generator | PostSpark";
const DESC = "Turn any podcast episode into a polished email newsletter in minutes. Paste the episode URL — get show notes, key quotes, and a ready-to-send newsletter.";
const URL = "https://postspark.co/tools/podcast-to-newsletter";

const FAQS = [
  { q: "What podcast platforms work?", a: "Any public RSS feed, Apple Podcasts, Spotify, or direct MP3 URL." },
  { q: "Does it generate show notes too?", a: "Yes. Every run gives you the newsletter, structured show notes with timestamps, and 5 tweet-sized takeaways." },
  { q: "What email platforms can I copy into?", a: "Anything. The output is clean HTML and markdown — works in Substack, Beehiiv, ConvertKit, Mailchimp, ghost, etc." },
  { q: "How accurate is the transcription?", a: "We use Whisper-grade transcription with speaker diarization for multi-host shows." },
];

export const Route = createFileRoute("/tools/podcast-to-newsletter")({
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
      eyebrow="Free Tool · Podcast → Newsletter"
      h1="Turn every podcast episode into a newsletter your list will read"
      subhead="Paste the episode URL. Get a publish-ready newsletter, show notes with timestamps, and tweet-sized takeaways — in minutes, not hours."
      benefits={[
        { title: "More than a transcript", description: "AI extracts the actual insights and turns them into narrative copy that reads like you wrote it." },
        { title: "Show notes included", description: "Every run gives you structured chapter markers and timestamps." },
        { title: "Repurpose-ready", description: "The same source can flow into LinkedIn posts, tweets, and a blog article with one click." },
      ]}
      steps={[
        { title: "Paste the episode URL", description: "Apple, Spotify, RSS feed, or direct MP3." },
        { title: "AI transcribes & summarizes", description: "Speaker diarization keeps multi-host conversations clear." },
        { title: "Copy to your email tool", description: "Substack, Beehiiv, ConvertKit, Mailchimp — works everywhere." },
      ]}
      outputs={["Newsletter draft", "Show notes with timestamps", "5 tweet-sized takeaways", "Blog article version"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/youtube-to-twitter-thread", label: "YouTube → Twitter Thread" },
        { to: "/tools/blog-to-linkedin-carousel", label: "Blog → LinkedIn Carousel" },
        { to: "/for/podcasters", label: "For Podcasters" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
