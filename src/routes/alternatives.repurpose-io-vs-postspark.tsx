import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/alternatives/repurpose-io-vs-postspark")({
  head: () => segmentHead({
    title: "PostSpark vs Repurpose.io — AI-First Content Repurposing",
    desc: "Repurpose.io reformats and republishes the same clip across platforms. PostSpark uses Claude AI to rewrite for each platform in your voice. Full comparison.",
    url: "https://postspark.co/alternatives/repurpose-io-vs-postspark",
    path: "/alternatives/repurpose-io-vs-postspark",
  }),
  component: () => (
    <SegmentPage
      path="/alternatives/repurpose-io-vs-postspark"
      eyebrow="PostSpark vs Repurpose.io"
      h1="PostSpark vs Repurpose.io: AI that rewrites, not just reformats."
      sub="Repurpose.io is a great file-mover — it takes one video and pushes it to 8 platforms. PostSpark is what you want when you need the post itself to be different for LinkedIn vs Twitter vs a newsletter, written in your voice."
      pains={[
        "Repurpose.io just copies the same caption and clip to every platform — no platform-native rewriting.",
        "No AI writing, no brand voice training, no hook generation, no carousels or newsletters.",
        "Built for video-only workflows. Blog posts, podcasts-to-newsletters, and long-form repurposing aren't the focus.",
      ]}
      solutions={[
        "PostSpark generates a unique LinkedIn post, Twitter thread, newsletter, and 5 shorts — each rewritten for that platform's audience.",
        "Brand Voice training on Pro: paste 5 samples, every output sounds like you, not generic AI.",
        "One workflow for blogs, podcasts, YouTube, PDFs — not just video re-uploads.",
      ]}
      workflow={[
        { title: "Paste a blog, podcast, YouTube URL, or PDF", body: "Any long-form input — no manual clipping required." },
        { title: "Claude AI generates 30+ platform-native posts", body: "Hook-scored, in your voice, ready to ship." },
        { title: "Edit, schedule, or export", body: "Built-in scheduler, client approvals, carousel & shorts studio." },
      ]}
    />
  ),
});
