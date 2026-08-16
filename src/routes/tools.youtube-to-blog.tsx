import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";
import { YoutubeToBlogExample, YT_TO_BLOG_FAQS } from "@/components/tools/YoutubeToBlogExample";

export const Route = createFileRoute("/tools/youtube-to-blog")({
  head: () => segmentHead({
    title: "YouTube to Article AI — Publish-Ready Blog Post, Free",
    desc: "Free YouTube to article AI: paste a link, get a publish-ready blog post — keyword title, meta, H2 outline, FAQ and pull quotes. Not a raw transcript. No card.",
    url: "https://postspark.co/tools/youtube-to-blog",
    path: "/tools/youtube-to-blog",
    faq: YT_TO_BLOG_FAQS,
  }),
  component: () => (
    <SegmentPage
      path="/tools/youtube-to-blog"
      eyebrow="Free Tool · YouTube → Blog"
      h1="Turn your YouTube videos into SEO blog posts that rank."
      sub="Paste a YouTube URL. PostSpark transcribes, generates a keyword-optimized title, meta description, H2 outline, body, FAQ section, and pull quotes — all formatted in markdown."
      quickAnswer={{
        question: "How do you turn a YouTube video into a blog post?",
        answer:
          "Paste the video URL into PostSpark. It transcribes the audio, then rewrites it as a structured article — SEO title, meta description, H2/H3 outline, body in your voice, pull quotes and an FAQ section — and returns it as markdown you can paste into WordPress, Webflow, Ghost or Notion. Free for 3 per month.",
      }}
      pains={[
        "You publish to YouTube but never index on Google — 90% of search traffic missed.",
        "Manually transcribing and rewriting a 20-min video for a blog takes 4+ hours.",
        "Generic 'video to text' tools dump a raw transcript — not a blog post.",
      ]}
      solutions={[
        "Real SEO structure: H1, H2/H3 outline, meta, FAQ schema, internal link suggestions.",
        "Auto-pulls keyword from video title + adds secondary keywords from transcript.",
        "Free for 3/month, Pro at $24/mo unlimited + brand-voice trained for your blog.",
      ]}
      workflow={[
        { title: "Paste YouTube URL", body: "Public videos only. We pull transcript via Whisper if no captions exist." },
        { title: "Pick target keyword (optional)", body: "Or let PostSpark suggest one from the video title." },
        { title: "Get a publish-ready markdown blog post", body: "Copy into Webflow, WordPress, Ghost, or Notion." },
      ]}
      extra={<YoutubeToBlogExample />}
    />
  ),
});
