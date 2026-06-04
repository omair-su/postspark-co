import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/use-cases/linkedin-ghostwriters")({
  head: () => segmentHead({
    title: "PostSpark for LinkedIn Ghostwriters — Brand Voice AI per Client",
    desc: "Write for 10 clients and sound like all of them. Per-client brand voice, faster repurposing, more billable hours back.",
    url: "https://postspark.co/use-cases/linkedin-ghostwriters",
  }),
  component: () => (
    <SegmentPage
      eyebrow="For LinkedIn Ghostwriters"
      h1="Write for 10 Clients. Sound Like All of Them."
      sub="LinkedIn ghostwriters lose 60% of production time to manual reformatting. PostSpark gives you Brand Voice AI for every client — so you deliver more, bill more, and burn out less."
      pains={[
        "Each client needs a different voice, tone, and style. Managing that manually does not scale.",
        "Long-form client content takes hours to atomize into individual LinkedIn posts.",
        "Growing your client base means growing your workload — unless you change the system.",
      ]}
      solutions={[
        "A trained Brand Voice profile per client — every post sounds like them, not like AI.",
        "Drop a long source asset, get 10+ LinkedIn-ready posts in under a minute.",
        "Add new clients without adding nights and weekends. Scale your roster, not your hours.",
      ]}
      workflow={[
        { title: "Train each client's voice", body: "Paste 5–10 of their best past posts. PostSpark learns the rhythm." },
        { title: "Paste the brief or source", body: "Long-form thinking, an interview, a Loom transcript — drop it in." },
        { title: "Ship 10 posts in minutes", body: "Pick, polish, send for approval. Move on to the next client." },
      ]}
    />
  ),
});
