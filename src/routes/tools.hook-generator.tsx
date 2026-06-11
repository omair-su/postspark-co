import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/hook-generator")({
  head: () => segmentHead({
    title: "Twitter & LinkedIn Hook Generator — Free A/B Test | PostSpark",
    desc: "Generate 10 scroll-stopping hooks per topic for X and LinkedIn — ranked by a model trained on viral posts. Free, no signup for first 3 uses.",
    url: "https://postspark.co/tools/hook-generator",
  }),
  component: () => (
    <SegmentPage
      eyebrow="Free Tool · Hook Lab"
      h1="The hook decides if your post gets read. We generate 10."
      sub="Paste your topic or full post. PostSpark generates 10 hook variations — question hooks, contrarian hooks, story hooks, stat hooks — and scores each on predicted scroll-stop rate."
      pains={[
        "80% of viewers decide in the first line. Most posts die on the hook.",
        "Writing 10 hook variants manually takes 20 minutes per post.",
        "You have no way to predict which hook will actually perform.",
      ]}
      solutions={[
        "10 distinct hook types per request — variety guaranteed, not 10 reworded versions.",
        "Predicted scroll-stop score per hook, trained on top-performing X & LinkedIn posts.",
        "Free for 3 uses, Pro at $19/mo. Pair with PostSpark to build the full post.",
      ]}
      workflow={[
        { title: "Paste topic or post", body: "A sentence is enough." },
        { title: "Pick platform & angle", body: "X thread, LinkedIn long-form, IG caption." },
        { title: "Copy the winning hook", body: "Or run the full post through Repurpose to get the body, too." },
      ]}
    />
  ),
});
