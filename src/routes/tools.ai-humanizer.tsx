import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";
import { HumanizerExample, HUMANIZER_FAQS } from "@/components/tools/HumanizerExample";

export const Route = createFileRoute("/tools/ai-humanizer")({
  head: () => segmentHead({
    title: "AI Humanizer — Rewrite AI Text in Your Voice | PostSpark",
    desc: "Three-pass AI humanizer with a live signal breakdown, sentence-level control and a meaning check on every run. Honest scores, no fake guarantees. 3 free runs/month.",
    url: "https://postspark.co/tools/ai-humanizer",
    path: "/tools/ai-humanizer",
    faq: HUMANIZER_FAQS,
  }),
  component: () => (
    <SegmentPage
      path="/tools/ai-humanizer"
      eyebrow="Free Tool · AI Humanizer"
      h1="Make AI text read like you actually wrote it."
      sub="Paste ChatGPT, Claude or Gemini output. PostSpark analyses it, rewrites it in your Brand Voice, then re-reads its own draft to check your facts survived — and shows you every number behind the change."
      quickAnswer={{
        question: "How do you make AI-generated text sound human?",
        answer:
          "Rebuild the statistical signals models flatten: vary sentence length (burstiness), replace stock phrasing like 'in today's landscape' or 'leverage', break repeated sentence openers and passive voice, and add real specifics. PostSpark does this in three passes — analyse, rewrite, repair — then verifies your numbers, names and links are still intact and shows the before/after score for each signal. Free for 3 runs per month.",
      }}
      pains={[
        "Raw AI copy reads mechanical — readers bounce on the first line.",
        "Other humanizers swap synonyms, mangle your numbers, and promise '100% undetectable'.",
        "You get one block of text back with no way to fix the sentences you dislike.",
      ]}
      solutions={[
        "Three passes: analyse the tells, rewrite against them, repair anything that drifted.",
        "Per-sentence accept, revert or re-roll — the final copy is assembled from your choices.",
        "Your trained Brand Voice and Brand Kit tone feed the rewrite, so it stays yours.",
      ]}
      workflow={[
        { title: "Paste or import your draft", body: "Up to 20,000 words, or pull it straight from Google Drive." },
        { title: "Set intensity and purpose", body: "Light, medium or strong — plus purpose, style and anything to preserve." },
        { title: "Review the diff, then publish", body: "Score breakdown, meaning check, sentence controls, and full run history." },
      ]}
      extra={<HumanizerExample />}
    />
  ),
});
