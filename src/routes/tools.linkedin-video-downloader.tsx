import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "LinkedIn Video Downloader — Free Tool | PostSpark";
const DESC = "Paste any public LinkedIn video URL and download the MP4 in seconds. Free, no signup. Built for creators who repurpose video into tweets, Shorts, and Reels.";
const URL = "https://postspark.co/tools/linkedin-video-downloader";

const FAQS = [
  { q: "Is the LinkedIn video downloader free?", a: "Yes — downloading public LinkedIn videos is free with no signup. PostSpark's repurposing features kick in once you want to turn that video into tweets, Reels, or a newsletter." },
  { q: "Which LinkedIn videos can I download?", a: "Any publicly visible LinkedIn post video. We do not support videos behind login walls, in private groups, or shared only with connections — that would violate LinkedIn's terms." },
  { q: "What format do I get?", a: "Videos are returned as MP4 in their original resolution, ready for upload to YouTube Shorts, TikTok, Instagram Reels, or your editor." },
  { q: "Can PostSpark turn the video into other content?", a: "Yes. After download, paste the same URL into PostSpark to generate a Twitter thread, LinkedIn carousel, newsletter, or short-form scripts in your voice." },
  { q: "Do you store the downloaded videos?", a: "No. Files stream straight to your device. We do not host or cache LinkedIn content." },
];

export const Route = createFileRoute("/tools/linkedin-video-downloader")({
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
  return (
    <SeoLandingPage
      eyebrow="Free Tool · LinkedIn Video Downloader"
      h1="Download any public LinkedIn video in seconds"
      subhead="Paste the LinkedIn post URL, get a clean MP4. No watermark, no signup, no LinkedIn login. Then repurpose it into tweets, Reels, and newsletters with PostSpark."
      benefits={[
        { title: "Clean MP4, original quality", description: "No watermarks, no re-encoding. Exactly what was uploaded — ready for editing." },
        { title: "Works with public posts", description: "Drop in any LinkedIn URL where the video plays without logging in. We respect LinkedIn's terms and skip private content." },
        { title: "Built for repurposing", description: "Pair the downloader with PostSpark to turn one LinkedIn video into a week of multi-platform posts." },
      ]}
      steps={[
        { title: "Copy the LinkedIn post URL", description: "Click the three dots on any public LinkedIn video post → Copy link to post." },
        { title: "Paste it into the tool", description: "We fetch the highest-quality public stream and prepare your MP4." },
        { title: "Download & repurpose", description: "Save the file, then optionally paste the same URL into PostSpark for tweets, carousels, and Reels scripts." },
      ]}
      outputs={["MP4 video file", "Auto-generated transcript (optional)", "Tweet thread from the video", "Short-form scripts for Reels & Shorts"]}
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
