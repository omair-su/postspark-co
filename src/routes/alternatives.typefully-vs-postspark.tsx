import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/alternatives/typefully-vs-postspark")({
  head: () => segmentHead({
    title: "PostSpark vs Typefully — Multi-Platform Alternative",
    desc: "Typefully is Twitter-only. PostSpark covers X, LinkedIn, Instagram, TikTok, YouTube, and newsletters from one input. Same price, 6× the platforms.",
    url: "https://postspark.co/alternatives/typefully-vs-postspark",
    path: "/alternatives/typefully-vs-postspark"
  }),
  component: () => (
    <SegmentPage
      path="/alternatives/typefully-vs-postspark"
      eyebrow="PostSpark vs Typefully"
      h1="PostSpark vs Typefully: Same price. Six more platforms."
      sub="Typefully is a beautiful Twitter editor. But your audience is also on LinkedIn, Instagram, TikTok, YouTube, and your newsletter. PostSpark covers all of them — for the same monthly price."
      pains={[
        "Typefully is locked to Twitter/X — you maintain a separate tool for every other platform.",
        "Writing the same idea 6 different ways for 6 platforms eats your week.",
        "Typefully Pro is $12.50/mo but you still pay separately for LinkedIn, IG, newsletter tools.",
      ]}
      solutions={[
        "One PostSpark input → posts for X, LinkedIn, IG, TikTok, YouTube Shorts, and newsletter.",
        "$24/mo Pro replaces Typefully + Hypefury + Shield + your newsletter tool.",
        "Brand Voice AI keeps the same tone across every platform.",
      ]}
      workflow={[
        { title: "Drop your source content", body: "Blog, podcast, YouTube, or just an idea." },
        { title: "Get platform-native posts", body: "Thread-style for X, long-form for LinkedIn, captions for IG." },
        { title: "Schedule everything in one calendar", body: "No more 6 tabs open." },
      ]}
    />
  ),
});
