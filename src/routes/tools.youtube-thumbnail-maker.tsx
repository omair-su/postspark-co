import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/youtube-thumbnail-maker")({
  head: () => segmentHead({
    title: "AI YouTube Thumbnail Maker — Free Generator | PostSpark",
    desc: "Generate high-CTR YouTube thumbnails in seconds. AI handles face emphasis, bold text overlay, and brand colors. Free plan, no Photoshop needed.",
    url: "https://postspark.co/tools/youtube-thumbnail-maker",
  }),
  component: () => (
    <SegmentPage
      eyebrow="Free Tool · YouTube Thumbnail Maker"
      h1="YouTube thumbnails that actually get clicked."
      sub="Paste your video title, get 4 thumbnail options engineered for high CTR — bold text, face emphasis, brand colors. Replace Canva templates and $40 thumbnail designers."
      pains={[
        "Thumbnails are the #1 lever on YouTube CTR — but you waste hours in Canva each upload.",
        "Hiring a thumbnail designer costs $30-80 per video and slows your publishing.",
        "AI image tools don't understand text legibility on small thumbnails.",
      ]}
      solutions={[
        "Built specifically for the 1280×720 thumbnail spec — text stays readable at small sizes.",
        "Free for 3 thumbnails/month, Pro is $19/mo unlimited. Cheaper than one designer gig.",
        "Iterate variants in seconds — A/B test what gets clicks, not what looks pretty.",
      ]}
      workflow={[
        { title: "Paste video title", body: "Optional: drop transcript or upload a face shot." },
        { title: "Pick a style", body: "Bold meme, MrBeast-style face zoom, clean professional, educational." },
        { title: "Download 1280×720 PNG", body: "Upload to YouTube. Track CTR. Iterate." },
      ]}
    />
  ),
});
