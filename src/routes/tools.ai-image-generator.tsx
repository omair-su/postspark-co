import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/ai-image-generator")({
  head: () => segmentHead({
    title: "AI Image Generator for Social Media — Free | PostSpark",
    desc: "Generate scroll-stopping AI images for X, LinkedIn, Instagram, and YouTube — sized per platform, brand-color matched. Free plan, no card required.",
    url: "https://postspark.co/tools/ai-image-generator",
  }),
  component: () => (
    <SegmentPage
      eyebrow="Free Tool · AI Image Generator"
      h1="AI image generator built for social media — not generic art."
      sub="Type a prompt or paste a post, get platform-sized images (X 16:9, LinkedIn 1.91:1, Instagram square, Story 9:16, YouTube thumbnail). Brand colors and logo auto-applied if you have a Brand Kit."
      pains={[
        "Midjourney and DALL·E output square art you still have to crop per platform.",
        "Generic AI images all look the same — no brand colors, no on-brand typography.",
        "Paying $20/mo for an image tool that doesn't know what platform you're posting to.",
      ]}
      solutions={[
        "Pre-set aspect ratios for X, LinkedIn, IG, Stories, Reels covers, and YouTube thumbnails.",
        "Brand Kit auto-applies your palette and logo placement — every image stays on-brand.",
        "Free plan: 3 images/month. Pro: unlimited, $19/mo. Switch from Midjourney and save.",
      ]}
      workflow={[
        { title: "Pick a platform", body: "X post, LinkedIn carousel slide, IG square, Reels cover, YouTube thumbnail." },
        { title: "Describe or paste a post", body: "We turn your text into a matching visual concept automatically." },
        { title: "Download or schedule", body: "Drop straight into the calendar or export PNG/JPG." },
      ]}
    />
  ),
});
