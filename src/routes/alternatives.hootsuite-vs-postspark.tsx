import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/alternatives/hootsuite-vs-postspark")({
  head: () => segmentHead({
    title: "PostSpark vs Hootsuite — Cheaper, AI-First Alternative",
    desc: "Hootsuite starts at $99/mo and still doesn't write your posts. PostSpark is $24/mo, writes in your voice, and includes a scheduler. Full comparison.",
    url: "https://postspark.co/alternatives/hootsuite-vs-postspark",
    path: "/alternatives/hootsuite-vs-postspark"
  }),
  component: () => (
    <SegmentPage
      path="/alternatives/hootsuite-vs-postspark"
      eyebrow="PostSpark vs Hootsuite"
      h1="PostSpark vs Hootsuite: 5× cheaper, and the AI actually writes the posts."
      sub="Hootsuite is built for enterprise social teams with $99-739/month budgets. PostSpark is built for creators and SMB agencies — $24/mo, AI-first, with all the generation Hootsuite makes you bolt on."
      pains={[
        "Hootsuite Professional is $99/mo for one user — and you still write every post.",
        "Hootsuite's AI add-ons cost extra and are weak vs purpose-built generation tools.",
        "Dated UI, enterprise sales process, painful onboarding for solo creators.",
      ]}
      solutions={[
        "PostSpark Pro is $24/mo. Agency at $49/mo includes 5 seats and client approvals.",
        "AI repurposing is the core product — not a bolted-on add-on.",
        "Self-serve signup, no demo call, no annual contract. Cancel in dashboard.",
      ]}
      workflow={[
        { title: "Sign up free in 30 seconds", body: "3 repurposes/month, no card." },
        { title: "Generate a week of posts from one input", body: "Blog, podcast, YouTube → 30+ platform-ready posts." },
        { title: "Schedule + manage clients", body: "Per-client workspaces, brand voice, approval flows." },
      ]}
    />
  ),
});
