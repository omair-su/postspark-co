import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/for/creators")({
  head: () => segmentHead({
    title: "PostSpark for Creators — Create Once, Publish Everywhere",
    desc: "You spend hours reformatting the same ideas. PostSpark generates a full week of content from your best work — in under 60 seconds.",
    url: "https://postspark.co/for/creators",
  }),
  component: () => (
    <SegmentPage
      eyebrow="For Solo Creators"
      h1="Create Once. Publish Everywhere."
      sub="You spend hours every week reformatting the same ideas. PostSpark generates a full week of content from your best work — in under 60 seconds."
      pains={[
        "You have great ideas but limited time to turn them into content for every platform.",
        "Starting fresh every day leads to creative burnout and inconsistent posting.",
        "Generic AI tools produce content that sounds nothing like your voice.",
      ]}
      solutions={[
        "Paste once. Get tweets, LinkedIn, newsletter, video script, captions — all platform-native.",
        "A week of content from one good idea, so you can stop the daily blank-page panic.",
        "Brand Voice AI learns from your past work so outputs sound like you, not like ChatGPT.",
      ]}
      workflow={[
        { title: "Drop in your best thinking", body: "A blog post, an essay, a podcast clip — your source material." },
        { title: "Generate the pack", body: "30+ pieces across formats. Pick your favorites, regenerate the rest." },
        { title: "Publish all week", body: "Stay consistent without grinding. Your voice on every platform." },
      ]}
    />
  ),
});
