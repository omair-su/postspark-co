import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/reply-generator")({
  head: () => segmentHead({
    title: "AI Reply Generator for X & LinkedIn — Free | PostSpark",
    desc: "Generate on-brand replies for X and LinkedIn comments in your voice. Speed up engagement without sounding like a bot. Free plan included.",
    url: "https://postspark.co/tools/reply-generator",
    path: "/tools/reply-generator"
  }),
  component: () => (
    <SegmentPage
      path="/tools/reply-generator"
      eyebrow="Free Tool · Reply Generator"
      h1="Reply to 10× more comments — in your actual voice."
      sub="Paste the comment you want to reply to. PostSpark generates 5 on-brand, context-aware replies — supportive, witty, contrarian, question, value-add — in seconds."
      pains={[
        "Engagement decides reach, but replying to 100 comments/day burns 90 minutes.",
        "Generic 'thanks for sharing' replies kill your authority.",
        "ChatGPT replies sound like a customer support bot.",
      ]}
      solutions={[
        "Brand Voice AI keeps replies in your tone — Pro users see this auto-applied.",
        "5 reply angles per comment so you pick the one that fits.",
        "Free for 3 replies/month, Pro at $24/mo unlimited.",
      ]}
      workflow={[
        { title: "Paste the comment", body: "Optional: paste the original post for context." },
        { title: "Pick the reply angle", body: "Supportive, witty, contrarian, question, or value-add." },
        { title: "Copy & post", body: "Or save to a swipe file for batch-replying later." },
      ]}
    />
  ),
});
