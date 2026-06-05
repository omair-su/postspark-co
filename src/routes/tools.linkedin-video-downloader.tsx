import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";
import { LinkedInDownloaderTool } from "@/components/tools/LinkedInDownloaderTool";

const TITLE = "LinkedIn Video Downloader — Free Tool | PostSpark";
const DESC = "Paste any public LinkedIn video URL and download the MP4 in seconds. Free, 3 downloads/month, no watermark. Built for creators who repurpose video into tweets, Shorts, and Reels.";
const URL = "https://postspark.co/tools/linkedin-video-downloader";

const FAQS = [
  { q: "Is the LinkedIn video downloader free?", a: "Yes — free accounts get 3 LinkedIn downloads every month with no watermark. Upgrade to Pro for unlimited downloads plus the full repurposing suite (tweets, carousels, newsletters, Reels)." },
  { q: "Which LinkedIn videos can I download?", a: "Any publicly visible LinkedIn post video. We do not support videos behind login walls, in private groups, or shared only with connections — that would violate LinkedIn's terms." },
  { q: "What format do I get?", a: "Videos are returned as MP4 in their original resolution, ready for upload to YouTube Shorts, TikTok, Instagram Reels, or your editor." },
  { q: "Can PostSpark turn the video into other content?", a: "Yes. After download, click 'Repurpose this video' to generate a Twitter thread, LinkedIn carousel, newsletter, or short-form scripts in your voice." },
  { q: "Do you store the downloaded videos?", a: "No. Files stream straight to your device. We log only the source URL and timestamp in your history so you can retry or repurpose later." },
  { q: "Why did the download fail?", a: "The most common reasons: the post is private or members-only, the post no longer exists, or LinkedIn served a login wall. Confirm the URL opens in an incognito tab without signing in." },
];

const searchSchema = z.object({
  url: z.string().url().optional(),
});

export const Route = createFileRoute("/tools/linkedin-video-downloader")({
  validateSearch: (s) => searchSchema.parse(s),
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
      { type: "application/ld+json", children: JSON.stringify(buildSoftwareJsonLd("PostSpark LinkedIn Video Downloader", DESC, URL)) },
      { type: "application/ld+json", children: JSON.stringify(buildFaqJsonLd(FAQS)) },
    ],
  }),
  component: Page,
});

function Page() {
  const { url } = Route.useSearch();
  return (
    <SeoLandingPage
      eyebrow="Free Tool · LinkedIn Video Downloader"
      h1="Download any public LinkedIn video in seconds"
      subhead="Paste the LinkedIn post URL, get a clean MP4. No watermark, no LinkedIn login. Then repurpose it into tweets, Reels, and newsletters with PostSpark."
      hideHeroCtas
      interactiveSlot={<LinkedInDownloaderTool initialUrl={url || ""} />}
      benefits={[
        { title: "Clean MP4, original quality", description: "No watermarks, no re-encoding. Exactly what was uploaded — ready for editing." },
        { title: "Works with public posts", description: "Drop in any LinkedIn URL where the video plays without logging in. We respect LinkedIn's terms and skip private content." },
        { title: "Built for repurposing", description: "Pair the downloader with PostSpark to turn one LinkedIn video into a week of multi-platform posts." },
      ]}
      steps={[
        { title: "Copy the LinkedIn post URL", description: "Click the three dots on any public LinkedIn video post → Copy link to post." },
        { title: "Paste it into the tool", description: "We fetch the highest-quality public stream and prepare your MP4 in seconds." },
        { title: "Download & repurpose", description: "Save the file, then hit 'Repurpose this video' to generate tweets, carousels, and short-form scripts." },
      ]}
      supportedInputs={[
        "linkedin.com/posts/...",
        "linkedin.com/feed/update/...",
        "Public LinkedIn video posts",
        "LinkedIn newsletter videos",
      ]}
      outputs={["MP4 video file", "Shareable URL", "Tweet thread", "LinkedIn carousel", "Short-form scripts"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/tools/youtube-to-twitter-thread", label: "YouTube → Twitter Thread" },
        { to: "/tools/blog-to-linkedin-carousel", label: "Blog → LinkedIn Carousel" },
        { to: "/use-cases/youtube-to-linkedin", label: "YouTube to LinkedIn workflow" },
        { to: "/features/linkedin-post-generator", label: "LinkedIn Post Generator" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
