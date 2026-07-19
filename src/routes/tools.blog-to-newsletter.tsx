import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/blog-to-newsletter")({
  head: () => segmentHead({
    title: "Blog to Newsletter Converter — Free AI Tool | PostSpark",
    desc: "Paste any blog URL, get a ready-to-send email newsletter with subject line, preview text, and a curated rewrite. Free plan, no signup.",
    url: "https://postspark.co/tools/blog-to-newsletter",
    path: "/tools/blog-to-newsletter"
  }),
  component: () => (
    <SegmentPage
      path="/tools/blog-to-newsletter"
      eyebrow="Free Tool · Blog → Newsletter"
      h1="Turn any blog post into an email newsletter — in your voice."
      sub="Paste your blog URL. PostSpark writes a subject line (A/B tested), preheader, intro hook, scannable body, and a CTA. Ready to paste into Beehiiv, Substack, ConvertKit, or Mailchimp."
      pains={[
        "Rewriting a blog post as an email takes an hour every week.",
        "Most newsletters are just a copy-paste of the blog — open rates suffer.",
        "Generic AI writes corporate-sounding emails nobody opens.",
      ]}
      solutions={[
        "Brand Voice AI keeps the email in your tone, not GPT default.",
        "5 subject line variants per email with predicted open-rate scoring.",
        "Free for 3 newsletters/month, Pro at $24/mo unlimited.",
      ]}
      workflow={[
        { title: "Paste blog URL", body: "Or upload a markdown file." },
        { title: "Pick the tone & length", body: "Casual, professional, witty — and short, medium, or full." },
        { title: "Copy the newsletter draft", body: "Paste into your ESP and send." },
      ]}
    />
  ),
});
