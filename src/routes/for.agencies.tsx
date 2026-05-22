import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "PostSpark for Agencies — Turn 1 Client Asset into a Week of Content";
const DESC = "The AI content engine for agencies, ghostwriters, and content marketers. Turn one blog or video into a full week of LinkedIn posts, tweets, carousels, thumbnails, and scheduled drafts. Unlimited client workspaces. $49/mo.";
const URL = "https://postspark.co/for/agencies";

const FAQS = [
  { q: "How does PostSpark help a content agency?", a: "Most agencies spend 3–6 hours per client per week rewriting one source asset (a blog, podcast, or video) into platform-specific posts. PostSpark turns that into 60 seconds: paste the source, pick the client's brand voice, and ship a full content pack across LinkedIn, X, carousels, captions, and newsletters." },
  { q: "Can I manage multiple clients with different brand voices?", a: "Yes — Agency plan includes unlimited client workspaces. Each one has its own brand voice (trained on past posts), brand kit (logo, colors, fonts), history, and team members. No tab switching, no prompt-hacking." },
  { q: "Do my clients see PostSpark branding on outputs?", a: "No. Agency tier is fully white-label — PDFs, images, and exports ship under your agency's brand, not ours." },
  { q: "Can my team review content before it goes to the client?", a: "Yes. Invite editors and reviewers with role-based access. Build approval workflows so nothing ships to a client without a human pass." },
  { q: "What's the seat limit and pricing?", a: "Agency is $49/month, includes 5 team seats and unlimited workspaces. Extra seats are $9/seat/month. Cancel anytime, no annual lock-in." },
  { q: "How is this different from ChatGPT or Jasper?", a: "ChatGPT gives you a chat window — you still have to prompt, format, paste, and rewrite for each platform. PostSpark is a content operations engine: one input, ten platform-native outputs, brand voice locked, approvals built-in, calendar ready." },
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
      eyebrow="For Content Agencies & Ghostwriters"
      h1="Turn one client asset into a full week of branded content — in 60 seconds"
      subhead="The AI content operations engine for agencies who repurpose long-form into ready-to-publish social campaigns. One source → LinkedIn posts, X threads, carousels, thumbnails, captions, newsletter. Unlimited client workspaces. $49/mo."
      primaryCtaLabel="Try it free — see your first content pack in 60s"
      benefits={[
        { title: "1 input → full content pack", description: "Paste a blog, podcast transcript, or YouTube link. Get LinkedIn posts, tweets, carousel outlines, captions, and a newsletter draft — all in one click." },
        { title: "Unlimited client workspaces", description: "One workspace per client. Brand voice trained on their past posts. Brand kit with their logo, colors, fonts. No more prompt-juggling." },
        { title: "Approvals + white-label delivery", description: "Editors review in-app, then export white-labeled content to the client. No 'made with' watermark on Agency tier." },
      ]}
      steps={[
        { title: "1. Add each client as a workspace", description: "Upload 5–10 of their past posts. PostSpark learns their voice, tone, vocabulary, and formatting in under 2 minutes." },
        { title: "2. Drop in one source asset per week", description: "A blog URL, a podcast file, a YouTube link, a PDF — anything. PostSpark generates the entire content calendar." },
        { title: "3. Review, approve, deliver", description: "Your editor approves in-app. Export white-labeled, schedule directly, or hand off to the client." },
      ]}
      outputs={["Unlimited workspaces", "5 team seats included", "White-label everything", "Approval workflows", "Brand voice per client", "Priority chat support", "Client-ready PDF exports", "Bulk repurposing"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/demo", label: "Try the free demo" },
        { to: "/for/creators", label: "For Creators" },
        { to: "/for/podcasters", label: "For Podcasters" },
        { to: "/pricing", label: "See pricing" },
      ]}
    />
  );
}
