import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/use-cases/youtube-to-linkedin")({
  head: () => segmentHead({
    title: "YouTube to LinkedIn — Turn Videos into LinkedIn Posts | PostSpark",
    desc: "Paste your YouTube URL. PostSpark extracts insights and turns them into LinkedIn posts that drive traffic back to your channel.",
    url: "https://postspark.co/use-cases/youtube-to-linkedin",
  }),
  component: () => (
    <SegmentPage
      eyebrow="YouTube → LinkedIn"
      h1="Your YouTube Videos Deserve a LinkedIn Audience."
      sub="Paste your YouTube URL. PostSpark extracts the key insights, quotes, and lessons — and turns them into 5 LinkedIn posts that drive traffic back to your channel."
      pains={[
        "Your best video insights stay trapped on YouTube and never reach LinkedIn's decision-makers.",
        "Writing 5 LinkedIn posts per video takes 2+ hours you don't have.",
        "Generic AI summaries of your videos sound nothing like you and convert nobody.",
      ]}
      solutions={[
        "PostSpark pulls the strongest hooks, quotes, and lessons from any video URL.",
        "Get 5 ready-to-publish LinkedIn posts per video in under a minute.",
        "Each post is tuned to your brand voice and links back to drive channel traffic.",
      ]}
      workflow={[
        { title: "Paste the video URL", body: "Any YouTube link works. PostSpark handles transcript extraction." },
        { title: "Generate the LinkedIn pack", body: "5 posts, each with a strong hook and a link back to the video." },
        { title: "Schedule and publish", body: "Copy or export. Watch your LinkedIn drive subscribers to YouTube." },
      ]}
    />
  ),
});
