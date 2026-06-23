import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/use-cases/youtube-to-instagram")({
  head: () => segmentHead({
    title: "YouTube to Instagram — Turn Videos into Reels & Square Posts | PostSpark",
    desc: "Repurpose YouTube videos into Instagram Reels, carousels, and square posts. PostSpark auto-extracts highlights and resizes for every Instagram aspect ratio.",
    url: "https://postspark.co/use-cases/youtube-to-instagram",
    path: "/use-cases/youtube-to-instagram"
  }),
  component: () => (
    <SegmentPage
      path="/use-cases/youtube-to-instagram"
      eyebrow="YouTube → Instagram"
      h1="Turn Long-Form YouTube into Scroll-Stopping Reels."
      sub="Paste your YouTube URL. PostSpark pulls the strongest highlights, auto-resizes to 9:16 and 1:1, and ships a full Instagram pack — Reels, carousels, and captions — in under a minute."
      pains={[
        "Editing a 20-minute video into 5 vertical Reels eats a whole afternoon.",
        "Manual cropping kills the framing — heads get cut off and captions disappear.",
        "Writing Reel hooks and Instagram captions from scratch every time is exhausting.",
      ]}
      solutions={[
        "PostSpark auto-detects the highest-retention moments and clips them into Reel-length cuts.",
        "Every clip is reframed for 9:16 (Reels) and 1:1 (feed) with subjects kept in frame and burned-in captions.",
        "Each Reel ships with a swipe-stopping hook, a caption tuned to your brand voice, and ready-to-paste hashtags.",
      ]}
      workflow={[
        { title: "Paste your YouTube URL", body: "Any public video works — long-form, podcast, or tutorial. PostSpark handles transcript and download." },
        { title: "Generate the Instagram pack", body: "5 vertical Reels (9:16), 3 carousel posts (1:1), captions, hooks, and hashtags — auto-resized and captioned." },
        { title: "Publish or schedule", body: "Export the clips or schedule directly. Drive Instagram discovery back to your YouTube channel." },
      ]}
    />
  ),
});
