import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/use-cases/content-repurposing-agencies")({
  head: () => segmentHead({
    title: "Content Repurposing System for Agencies | PostSpark",
    desc: "The content repurposing system agencies actually need. Per-client brand voice, approval workflows, white-label exports.",
    url: "https://postspark.co/use-cases/content-repurposing-agencies",
    path: "/use-cases/content-repurposing-agencies"
  }),
  component: () => (
    <SegmentPage
      path="/use-cases/content-repurposing-agencies"
      eyebrow="Agency Operations"
      h1="The Content Repurposing System Agencies Actually Need."
      sub="Per-client brand voice. Approval workflows. White-label exports. PostSpark is the operations layer that turns one source asset into a full content week for every client."
      pains={[
        "Repurposing eats more of your team's time than strategy does.",
        "Different clients need different voices — and ChatGPT can't keep them straight.",
        "Approval cycles are a mess of Google Docs, emails, and missed deadlines.",
      ]}
      solutions={[
        "One repurposing engine for the whole agency, with per-client workspaces and voices.",
        "Built-in approval links so clients sign off on content without leaving the link.",
        "White-label exports — PDFs, images, decks go out under your agency's brand.",
      ]}
      workflow={[
        { title: "Stand up the workspace", body: "Each client gets their own workspace, brand kit, and voice profile." },
        { title: "Run repurposing on autopilot", body: "Paste sources, generate weekly packs in one click." },
        { title: "Get sign-off and ship", body: "Send approval links, export white-labeled, schedule." },
      ]}
    />
  ),
});
