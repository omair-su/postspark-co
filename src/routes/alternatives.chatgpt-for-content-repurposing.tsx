import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/alternatives/chatgpt-for-content-repurposing")({
  head: () => segmentHead({
    title: "PostSpark vs ChatGPT for Content Repurposing — Full Comparison",
    desc: "ChatGPT is a general AI assistant. PostSpark is a dedicated content repurposing engine. Here is the honest difference.",
    url: "https://postspark.co/alternatives/chatgpt-for-content-repurposing",
  }),
  component: () => (
    <SegmentPage
      eyebrow="PostSpark vs ChatGPT"
      h1="PostSpark vs ChatGPT for Content Repurposing"
      sub="ChatGPT is a general AI assistant. PostSpark is a dedicated content repurposing engine. Here is the honest difference."
      pains={[
        "ChatGPT requires a fresh prompt every single time you want to repurpose.",
        "It has no memory of your brand voice between sessions.",
        "You manage outputs, formatting, and platform conventions by hand.",
      ]}
      solutions={[
        "PostSpark has pre-built workflows for every platform — one click, not 12 prompts.",
        "Brand Voice AI persists across all your generations and only gets sharper over time.",
        "Outputs come platform-native: thread shape, LinkedIn length, newsletter formatting — done.",
      ]}
      workflow={[
        { title: "Paste once", body: "Drop a blog post, transcript, or URL into PostSpark." },
        { title: "Get the full pack", body: "30+ outputs across every platform in your voice — without re-prompting." },
        { title: "Stay consistent", body: "Your voice, your formats, every time. ChatGPT can't promise that." },
      ]}
    />
  ),
});
