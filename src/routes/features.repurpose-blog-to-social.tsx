import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "Repurpose Blog Posts to Social Media — PostSpark";
const DESC = "Turn any blog post into 30+ tweets, LinkedIn posts, threads, and email newsletters with AI. Paste a URL and get publish-ready content in seconds.";
const URL = "https://postspark.co/features/repurpose-blog-to-social";

const FAQS = [
  { q: "How does PostSpark repurpose blog posts?", a: "Paste any blog URL. PostSpark fetches the article, extracts key points with Claude AI, and generates platform-optimized posts for Twitter/X, LinkedIn, threads, and email — all matching your brand voice." },
  { q: "Can I edit the generated posts?", a: "Yes. Every output is editable in the dashboard before you copy or schedule it. You can regenerate any single post without redoing the whole batch." },
  { q: "Does it work with paywalled or private blogs?", a: "PostSpark reads any publicly accessible URL. For private content, paste the article text directly into the input field." },
  { q: "How many posts can I generate from one blog?", a: "Pro and Agency plans generate 30+ pieces per source: 10 tweets, a Twitter thread, 3 LinkedIn posts, an email newsletter, and a video script outline." },
];

export const Route = createFileRoute("/features/repurpose-blog-to-social")({
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
      eyebrow="Blog → Social"
      h1="Repurpose blog posts into 30+ social posts in seconds"
      subhead="Paste any blog URL. PostSpark turns it into tweets, LinkedIn posts, threads, and an email newsletter — all in your brand voice."
      benefits={[
        { title: "One URL → 30 posts", description: "A single article becomes a full week of content across Twitter/X, LinkedIn, and email." },
        { title: "Brand voice trained", description: "Train PostSpark on your past writing so every output sounds like you, not a chatbot." },
        { title: "Publish-ready output", description: "Hooks, formatting, hashtags, and length already optimized for each platform." },
      ]}
      steps={[
        { title: "Paste your blog URL", description: "Or drop in raw markdown / text. PostSpark handles the rest." },
        { title: "AI generates outputs", description: "Claude Sonnet 4.5 extracts key insights and rewrites for each format." },
        { title: "Copy, edit, publish", description: "Every post is editable. Copy with one click or schedule via your favorite tool." },
      ]}
      outputs={["10 Tweets", "Twitter Thread", "3 LinkedIn Posts", "Email Newsletter", "YouTube Script", "Instagram Carousel"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/features/youtube-to-tweets", label: "YouTube → Tweets" },
        { to: "/features/linkedin-post-generator", label: "LinkedIn Post Generator" },
        { to: "/for/creators", label: "PostSpark for Creators" },
        { to: "/for/agencies", label: "PostSpark for Agencies" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
