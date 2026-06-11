import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/alternatives/jasper-vs-postspark")({
  head: () => segmentHead({
    title: "PostSpark vs Jasper — Which Is Right for Creators?",
    desc: "Jasper is built for enterprise marketing teams. PostSpark is built for creators and agencies who repurpose. Compare price, focus, and brand voice.",
    url: "https://postspark.co/alternatives/jasper-vs-postspark",
    path: "/alternatives/jasper-vs-postspark"
  }),
  component: () => (
    <SegmentPage
      path="/alternatives/jasper-vs-postspark"
      eyebrow="PostSpark vs Jasper"
      h1="PostSpark vs Jasper: Which Is Right for You?"
      sub="Jasper starts at $49/month and is built for enterprise marketing teams. PostSpark starts at $19/month and is built for creators and agencies who actually repurpose."
      pains={[
        "Jasper's enterprise pricing assumes a marketing team budget you don't have.",
        "Its general writing focus means you still build your own repurposing pipelines.",
        "Brand voice on Jasper is a manual style guide — not a per-client trained model.",
      ]}
      solutions={[
        "PostSpark Pro is $19/month — under half Jasper's entry price, with a real free tier.",
        "Repurposing is the product, not a side feature. One input, every platform, zero prompts.",
        "Brand Voice AI trains on your samples and only sharpens with use.",
      ]}
      workflow={[
        { title: "Sign up free", body: "10 repurposes/month, no card. See if PostSpark fits before you pay." },
        { title: "Train your voice once", body: "Drop in writing samples. Outputs sound like you immediately." },
        { title: "Cancel Jasper", body: "Keep the same output volume at less than half the price." },
      ]}
    />
  ),
});
