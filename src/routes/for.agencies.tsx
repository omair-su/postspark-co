import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "PostSpark for Agencies — Scale Client Content with AI";
const DESC = "Manage 10+ client brand voices from one dashboard. White-label outputs, team seats, approval workflows, and unlimited repurposing for $49/mo.";
const URL = "https://postspark.co/for/agencies";

const FAQS = [
  { q: "How many clients can I manage?", a: "Agency plan supports unlimited workspaces. Each workspace has its own brand voice, brand kit, and team members." },
  { q: "Do my clients see PostSpark branding?", a: "No. Agency tier includes white-label exports — outputs ship under your agency's brand." },
  { q: "Can my team collaborate on content?", a: "Yes. Invite team members with roles (admin, editor, viewer) and approval workflows for client review." },
  { q: "What's the seat limit?", a: "Agency includes 5 seats; add more for $9/seat/month." },
];

export const Route = createFileRoute("/for/agencies")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(buildSoftwareJsonLd("PostSpark Agency", DESC, URL)) },
      { type: "application/ld+json", children: JSON.stringify(buildFaqJsonLd(FAQS)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SeoLandingPage
      eyebrow="For Agencies"
      h1="Scale content production across every client — without scaling headcount"
      subhead="One dashboard, unlimited client workspaces, white-label exports, and brand voices that actually sound like each client."
      primaryCtaLabel="Try Agency free for 7 days"
      benefits={[
        { title: "Unlimited workspaces", description: "Separate brand voice, brand kit, and history per client. No tab switching." },
        { title: "Team seats & approvals", description: "Invite editors and reviewers. Build approval workflows before content ships to clients." },
        { title: "White-label outputs", description: "Export and deliver content with your agency branding, not ours." },
      ]}
      steps={[
        { title: "Create a workspace per client", description: "Upload their voice samples, logo, colors, and preferred tone once." },
        { title: "Generate at scale", description: "Repurpose blogs, videos, and PDFs across every client in minutes." },
        { title: "Approve & deliver", description: "Editors review in-app, then export white-labeled content to the client." },
      ]}
      outputs={["Unlimited workspaces", "5 team seats", "White-label", "Approval workflows", "Brand voice per client", "Priority support"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/for/creators", label: "For Creators" },
        { to: "/features/repurpose-blog-to-social", label: "Blog → Social" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
