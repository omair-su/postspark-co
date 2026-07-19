import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/ai-humanizer")({
  head: () => segmentHead({
    title: "AI Humanizer — Make AI Text Read Handwritten | PostSpark",
    desc: "Paste AI-generated text. PostSpark rewrites it in your voice so it sounds handwritten — bypasses detectors, keeps your meaning. Free plan included.",
    url: "https://postspark.co/tools/ai-humanizer",
    path: "/tools/ai-humanizer",
  }),
  component: () => (
    <SegmentPage
      path="/tools/ai-humanizer"
      eyebrow="Free Tool · AI Humanizer"
      h1="Make AI text sound like you wrote it."
      sub="Paste ChatGPT/Claude/Gemini output. PostSpark rewrites it in your brand voice with real cadence, contractions, and quirks — no more robotic tells."
      pains={[
        "Raw AI copy sounds robotic — readers churn in the first sentence.",
        "GPTZero and Originality.ai flag your posts as 'AI-generated'.",
        "Manually humanizing every draft eats 20 minutes per post.",
      ]}
      solutions={[
        "Brand Voice AI keeps every rewrite in your tone (Pro users auto-apply).",
        "Real handwritten cadence — contractions, rhythm shifts, casual pivots.",
        "Free for 3 humanizations/month, Pro unlimited at $24/mo.",
      ]}
      workflow={[
        { title: "Paste AI text", body: "Any output from ChatGPT, Claude, Gemini or Jasper." },
        { title: "Pick your voice", body: "Casual, professional, witty, contrarian." },
        { title: "Copy & publish", body: "Ships ready for LinkedIn, X, blog, or email." },
      ]}
    />
  ),
});
