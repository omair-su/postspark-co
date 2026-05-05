import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage, buildSoftwareJsonLd, buildFaqJsonLd } from "@/components/landing/SeoLandingPage";

const TITLE = "PostSpark for Creators — Publish 10× More Without Burning Out";
const DESC = "Solo creators use PostSpark to turn one piece of content into a full week of social posts, threads, and newsletters. $19/mo, unlimited.";
const URL = "https://postspark.co/for/creators";

const FAQS = [
  { q: "Do I need a big audience to benefit?", a: "No — PostSpark is built for creators at every stage. Free plan covers 3 repurposes per month so you can ship more without overhead." },
  { q: "Will my posts feel authentic?", a: "Yes. Train PostSpark on 5 of your past posts and outputs match your voice, not a generic AI tone." },
  { q: "How is this different from ChatGPT?", a: "PostSpark is specialized for content repurposing: platform formatting, hook optimization, brand voice persistence, and multi-output batching — all built in." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard; access continues until your billing period ends." },
];

export const Route = createFileRoute("/for/creators")({
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
      { type: "application/ld+json", children: JSON.stringify(buildSoftwareJsonLd("PostSpark Pro", DESC, URL)) },
      { type: "application/ld+json", children: JSON.stringify(buildFaqJsonLd(FAQS)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SeoLandingPage
      eyebrow="For Creators"
      h1="Publish 10× more content without writing 10× more"
      subhead="One blog, video, or podcast → a full week of tweets, LinkedIn posts, threads, and a newsletter. Done in 60 seconds."
      benefits={[
        { title: "Save 10+ hrs/week", description: "Stop rewriting the same idea for every platform. Generate, edit, ship." },
        { title: "Stay in your voice", description: "Brand voice training keeps every post sounding like you, not AI." },
        { title: "Never run out of ideas", description: "Hook Lab and Calendar tools keep your queue full and consistent." },
      ]}
      steps={[
        { title: "Drop in any source", description: "Blog URL, YouTube link, podcast, PDF, or raw notes." },
        { title: "Generate the full batch", description: "30+ pieces formatted for every platform you publish on." },
        { title: "Edit & schedule", description: "Polish in our editor, then export to your favorite scheduler." },
      ]}
      outputs={["Unlimited generations", "Brand Voice training", "Hook Lab", "Content Calendar", "Image Studio", "Analytics"]}
      faqs={FAQS}
      internalLinks={[
        { to: "/for/agencies", label: "For Agencies" },
        { to: "/features/youtube-to-tweets", label: "YouTube → Tweets" },
        { to: "/features/linkedin-post-generator", label: "LinkedIn Generator" },
        { to: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
