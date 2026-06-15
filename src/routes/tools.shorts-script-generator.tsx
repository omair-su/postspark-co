import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/shorts-script-generator")({
  head: () => segmentHead({
    title: "TikTok & Shorts Script Generator — Free | PostSpark",
    desc: "Turn any blog post, video or idea into a ready-to-record TikTok, YouTube Shorts or Instagram Reels script — hooks, shot list, on-screen captions, hashtags. Free.",
    url: "https://postspark.co/tools/shorts-script-generator",
    path: "/tools/shorts-script-generator",
  }),
  component: () => (
    <SegmentPage
      path="/tools/shorts-script-generator"
      eyebrow="Free Tool · Shorts Studio"
      h1="Turn any idea into a 60-second vertical video script."
      sub="Paste a blog, transcript, or rough idea. PostSpark writes 3 hook variants, a full shot list with timestamps, on-screen captions, CTA, and 8 hashtags — ready to record in OBS or CapCut."
      pains={[
        "Staring at a blank script editor at 11pm trying to remember the hook framework that went viral last week.",
        "Recording 4 takes of the same shot because the captions weren't planned.",
        "Posts that flatline because the first 1.5 seconds didn't earn the rest of the watch time.",
      ]}
      solutions={[
        "3 hook variants every time — pattern-interrupt openings, never 'I' or 'In this video'.",
        "Timed shot list with VO, on-screen text, and b-roll suggestion per shot.",
        "Native to each platform — TikTok, Reels and Shorts get different hook tones and hashtag patterns.",
      ]}
      workflow={[
        { title: "Paste source", body: "Blog post, transcript, podcast notes — anything." },
        { title: "Pick platform & length", body: "30/45/60s for TikTok, Shorts, or Reels." },
        { title: "Record from the script", body: "Export as .txt for the teleprompter, or .srt for auto-captions." },
      ]}
    />
  ),
});
