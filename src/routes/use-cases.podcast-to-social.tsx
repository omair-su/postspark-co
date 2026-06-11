import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/use-cases/podcast-to-social")({
  head: () => segmentHead({
    title: "Podcast to Social Media — Turn Episodes into Posts | PostSpark",
    desc: "Every episode. Everywhere. Automatically. Turn each podcast into tweets, LinkedIn posts, newsletters, and show notes in minutes.",
    url: "https://postspark.co/use-cases/podcast-to-social",
    path: "/use-cases/podcast-to-social"
  }),
  component: () => (
    <SegmentPage
      path="/use-cases/podcast-to-social"
      eyebrow="For Podcasters"
      h1="Every Episode. Everywhere. Automatically."
      sub="You spend hours creating your podcast. PostSpark turns each episode into tweets, LinkedIn posts, email newsletters, and show notes — in minutes, not hours."
      pains={[
        "Your best insights are locked inside audio that 90% of your potential audience will never hear.",
        "Writing show notes, social posts, and newsletters from every episode is a full-time job by itself.",
        "Inconsistent social presence means your podcast never builds the audience it deserves.",
      ]}
      solutions={[
        "Paste a transcript or link — get a full content pack tied to every episode.",
        "Show notes, hooks, quote graphics, newsletter draft and 10+ posts in one shot.",
        "Stay consistent across platforms so every episode actually compounds your audience.",
      ]}
      workflow={[
        { title: "Drop in your episode", body: "Paste a transcript, link, or audio summary." },
        { title: "Generate the episode pack", body: "Show notes, social posts, newsletter, threads — all in your voice." },
        { title: "Publish across platforms", body: "Copy individually or export the whole pack. Done in 5 minutes per episode." },
      ]}
    />
  ),
});
