import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/for/agencies")({
  head: () => segmentHead({
    title: "PostSpark for Content Agencies — Scale Client Production",
    desc: "Stop letting reformatting eat billable hours. PostSpark turns one client asset into a week of platform-ready content — with per-client brand voice.",
    url: "https://postspark.co/for/agencies",
  }),
  component: () => (
    <SegmentPage
      eyebrow="For Content Agencies"
      h1="Your Agency Delivers Content. PostSpark Makes It Scalable."
      sub="Stop letting content reformatting eat your team's billable hours. PostSpark turns one client asset into a full week of platform-ready content — automatically."
      pains={[
        "You charge for strategy but your team spends 60% of time reformatting the same content.",
        "Every new client means more manual work, not more revenue.",
        "Maintaining each client's unique brand voice across platforms takes hours you do not have.",
      ]}
      solutions={[
        "PostSpark handles all reformatting automatically. Your team focuses on strategy and client relationships.",
        "Multi-brand workspaces mean adding a new client takes 10 minutes, not days.",
        "Brand Voice AI learns each client's writing style. Every piece of content sounds like them — automatically.",
      ]}
      workflow={[
        { title: "Add the client workspace", body: "Spin up a new workspace, drop in writing samples, set brand kit. 10 minutes." },
        { title: "Paste source content", body: "Blog post, podcast transcript, YouTube URL — anything." },
        { title: "Ship the pack", body: "Approve, white-label, deliver. Multiply your output without multiplying your team." },
      ]}
    />
  ),
});
