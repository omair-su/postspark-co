import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Type, ImageIcon, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/yt-to-ig-hero.jpg";

export const Route = createFileRoute("/use-cases/youtube-to-linkedin")({
  head: () => segmentHead({
    title: "YouTube to LinkedIn — AI Repurposing Tool | PostSpark",
    desc: "Turn every YouTube video into 5 LinkedIn posts that drive comments, plus a carousel and a newsletter section. Beats Repurpose.io and Taplio on output quality.",
    url: "https://postspark.co/use-cases/youtube-to-linkedin",
    path: "/use-cases/youtube-to-linkedin",
  }),
  component: YouTubeToLinkedInPage,
});

function YouTubeToLinkedInPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Use Case · YouTube → LinkedIn"
      h1="One YouTube video → 5 LinkedIn posts that actually drive comments."
      sub="Paste a URL. PostSpark engineers 5 LinkedIn posts in different formats (story, list, contrarian, frame, lesson), a 10-slide carousel, and a newsletter section — each tuned for the first-line punchline LinkedIn rewards."
      heroImage={heroImg}
      heroImageAlt="PostSpark YouTube to LinkedIn tool"
      crumbs={[{ label: "Use Cases", href: "/#use-cases" }, { label: "YouTube → LinkedIn" }]}
      problems={[
        { icon: Clock, title: "Pivot tax", body: "Your YouTube audience and LinkedIn audience are different humans — writing twice is dead time." },
        { icon: TrendingUp, title: "First-line collapse", body: "On LinkedIn, the first line decides everything. Most repurposing tools bury the punchline by line 4." },
        { icon: Film, title: "Format fatigue", body: "Posting the same story 5 weeks in a row tanks reach. You need 5 different angles, not 5 copies." },
        { icon: Layers, title: "Carousel-blocked", body: "Carousels still hit hardest on LinkedIn — but designing them in Figma every week is unsustainable." },
      ]}
      steps={[
        { title: "Paste YouTube URL", body: "PostSpark fetches the transcript and metadata automatically." },
        { title: "Pick post count", body: "1, 3 or 5 posts — each in a different LinkedIn format." },
        { title: "AI writes & paces", body: "First-line hook, scannable middle, soft CTA. Brand voice applied automatically on Pro." },
        { title: "Carousel + newsletter free", body: "Same source also generates a 10-slide carousel and a 200-word newsletter section." },
      ]}
      features={[
        { icon: Zap, title: "First-line engineering", body: "Every post tested against LinkedIn's specific scroll-stop patterns — not generic 'engagement bait'.", tag: "AI" },
        { icon: TrendingUp, title: "5 formats per video", body: "Story, list, contrarian, frame, lesson — so 1 video fuels 5 weeks of LinkedIn content without sounding repetitive." },
        { icon: ImageIcon, title: "Carousel generator", body: "10-slide carousels with bold type and on-brand colors. Export as PDF for native LinkedIn upload.", tag: "Pro" },
        { icon: Wand2, title: "Brand voice training", body: "Drop in 5 of your best posts. PostSpark copies your cadence, vocabulary and CTA style.", tag: "Pro" },
        { icon: Type, title: "Newsletter section", body: "Same source generates a 200-word newsletter block you can paste into Beehiiv or Substack." },
        { icon: Film, title: "Shorts script bonus", body: "Get a vertical Shorts script (hooks, shot list, captions) for the same video — for free." },
        { icon: Mic, title: "Engagement-aware CTAs", body: "Soft asks that drive comments instead of 'agree?' Each one A/B-tested in our corpus." },
        { icon: Layers, title: "Calendar + scheduling", body: "Drag posts onto a 30-day calendar, schedule with Buffer or Typefully, ship in one batch." },
      ]}
      competitors={{
        otherNames: ["Repurpose.io", "Taplio", "Castmagic"],
        rows: [
          { label: "Paste YouTube URL → LinkedIn posts", postspark: true, others: ["clip only", false, false] },
          { label: "5 distinct post formats per video", postspark: true, others: [false, "1-2", false] },
          { label: "First-line scroll-stop engineering", postspark: true, others: [false, true, false] },
          { label: "Carousel generation", postspark: true, others: [false, false, false] },
          { label: "Newsletter section bonus", postspark: true, others: [false, false, false] },
          { label: "Brand voice training", postspark: true, others: [false, true, true] },
          { label: "Pricing", postspark: "$19/mo", others: ["$15/mo (limited)", "$39/mo", "$23/mo"] },
          { label: "Lifetime deal available", postspark: "$97", others: [false, false, false] },
        ],
      }}
      samples={[
        { platform: "LinkedIn · Story", hook: "I almost cancelled the YouTube channel last March. Here's the email that saved it.", cta: "What pulled you back from your last quit moment?", tag: "Score 94" },
        { platform: "LinkedIn · Contrarian", hook: "Every founder I meet says 'fail fast'. The best ones I've watched fail slowly, on purpose. Here's why:", cta: "Disagree? Walk me through it ↓", tag: "Score 91" },
        { platform: "LinkedIn · Frame", hook: "Stop calling it 'content creation'. It's 'attention compounding'. The difference matters more than you think.", cta: "What's your reframe?", tag: "Score 88" },
      ]}
      faq={[
        { q: "Does it pull the YouTube transcript automatically?", a: "Yes — paste any public YouTube URL and PostSpark fetches the transcript, metadata, and chapters in seconds." },
        { q: "Will the posts match my LinkedIn voice?", a: "On Pro, yes. Train PostSpark on 5 of your best posts and every output copies your cadence and CTA pattern." },
        { q: "Can I schedule from PostSpark?", a: "Yes. Built-in 30-day calendar plus push to Buffer, Typefully, and Hypefury queues. Native LinkedIn auto-publish is rolling out as the platform approves our app." },
        { q: "What carousel sizes do you export?", a: "1080×1350 (LinkedIn standard) and 1080×1080 (cross-post to IG). PDF export for native LinkedIn carousel upload." },
        { q: "How is this different from Taplio?", a: "Taplio rewrites single posts. PostSpark takes one source video and generates 5 distinct LinkedIn post formats, a carousel, a newsletter block, and a Shorts script — in your voice." },
      ]}
    />
  );
}
