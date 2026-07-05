import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Type, ImageIcon, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/shorts-hero-mockup.jpg";

export const Route = createFileRoute("/use-cases/tiktok-to-youtube-shorts")({
  head: () => segmentHead({
    title: "TikTok to YouTube Shorts — AI Repurposing | PostSpark",
    desc: "Convert TikTok videos into watermark-free YouTube Shorts optimized for retention. Auto-captions, hook rewrites, and Shorts-native pacing in one click.",
    url: "https://postspark.co/use-cases/tiktok-to-youtube-shorts",
    path: "/use-cases/tiktok-to-youtube-shorts",
  }),
  component: TikTokToShortsPage,
});

function TikTokToShortsPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Use Case · Cross-platform"
      h1="TikTok → YouTube Shorts. Watermark gone, retention up."
      sub="Drop a TikTok URL. PostSpark strips the watermark, re-cuts for Shorts retention curves, rewrites the hook for YouTube's audience, and burns in captions styled to your channel — ready to upload in minutes."
      heroImage={heroImg}
      heroImageAlt="PostSpark TikTok to YouTube Shorts converter"
      crumbs={[{ label: "Use Cases", href: "/#use-cases" }, { label: "TikTok → Shorts" }]}
      problems={[
        { icon: Clock, title: "Manual re-uploads waste hours", body: "Downloading, cropping, re-captioning, and re-hooking one video per platform doesn't scale past 3 posts a week." },
        { icon: Film, title: "Watermarks tank YouTube reach", body: "YouTube deprioritizes recycled TikToks with visible watermarks — you lose the algorithm boost before you start." },
        { icon: TrendingUp, title: "TikTok hooks don't work on Shorts", body: "YouTube's audience swipes faster and demands a payoff in 3 seconds. Your TikTok opener needs a rewrite." },
        { icon: Layers, title: "Captions styled for the wrong platform", body: "TikTok caption fonts feel off on Shorts. Native styling matters for retention." },
      ]}
      steps={[
        { title: "Paste the TikTok URL", body: "Any public TikTok — vertical or horizontal, up to 10 minutes." },
        { title: "Watermark removed, re-cut", body: "PostSpark strips the watermark cleanly and re-times cuts for Shorts retention patterns." },
        { title: "Hook + captions rewritten", body: "AI rewrites the first 3 seconds for YouTube's audience and burns in styled captions." },
        { title: "Export & upload", body: "1080×1920 MP4, YouTube-ready title, description, and hashtags included." },
      ]}
      features={[
        { icon: Wand2, title: "Watermark removal", body: "Clean edge detection strips the TikTok logo without leaving artifacts.", tag: "AI" },
        { icon: Zap, title: "Retention-tuned re-cutting", body: "Cuts re-timed to match Shorts' 3-second attention curve, not TikTok's slower open." },
        { icon: Type, title: "Hook rewriter", body: "AI rewrites your first line for YouTube's audience — punchier, payoff-first." },
        { icon: Film, title: "Burned-in captions", body: "Word-by-word captions styled to Shorts conventions, not TikTok defaults." },
        { icon: ImageIcon, title: "Auto title + description", body: "YouTube-ready title, description, and hashtag set generated from the transcript." },
        { icon: Mic, title: "Voice preserved", body: "Original audio kept; only the visual container changes." },
        { icon: Layers, title: "Batch mode", body: "Drop 10 TikTok URLs at once and get 10 Shorts back.", tag: "Pro" },
        { icon: TrendingUp, title: "Cross-post to Reels too", body: "One source, three platforms — TikTok stays live, Shorts and Reels go out watermark-free." },
      ]}
      competitors={{
        otherNames: ["Repurpose.io", "OpusClip", "Munch"],
        rows: [
          { label: "TikTok watermark removal", postspark: true, others: [true, "limited", false] },
          { label: "Shorts-native re-cutting", postspark: true, others: [false, "limited", false] },
          { label: "AI hook rewriter for YouTube", postspark: true, others: [false, false, false] },
          { label: "Burned-in captions in Shorts style", postspark: true, others: ["limited", true, true] },
          { label: "Batch URL import", postspark: true, others: [true, false, false] },
          { label: "Pricing (entry plan)", postspark: "$19/mo", others: ["$15/mo", "$19/mo", "$49/mo"] },
          { label: "Lifetime deal available", postspark: "$97", others: [false, false, false] },
        ],
      }}
      samples={[
        { platform: "YouTube Shorts", hook: "The 3-second rewrite that 4x'd my Shorts retention", cta: "Full breakdown below ↓", tag: "Score 93" },
        { platform: "Shorts caption", hook: "You're posting TikToks on YouTube. Here's why that's costing you views:", cta: "Save · Subscribe for more", tag: "Score 88" },
        { platform: "Description", hook: "Recycled from TikTok in 2 minutes with PostSpark — watermark gone, hook rewritten, captions burned in.", cta: "Try it free · postspark.co", tag: "Auto" },
      ]}
      faq={[
        { q: "Does this actually remove the TikTok watermark?", a: "Yes — PostSpark detects the animated watermark position and cleanly patches it. Output is watermark-free and safe to upload to YouTube." },
        { q: "Will YouTube penalize me for reposting TikToks?", a: "YouTube penalizes visible watermarks and platform-mismatched content — not repurposing itself. PostSpark handles both: no watermark, and pacing tuned for Shorts." },
        { q: "How is this different from Repurpose.io?", a: "Repurpose.io moves the file. PostSpark rewrites the hook, re-times the cuts, and re-styles the captions for the target platform — so the Shorts version actually performs like a native Short." },
        { q: "Can I batch process TikToks?", a: "Yes — Pro plans let you paste up to 10 TikTok URLs at once and download all Shorts as a zip." },
        { q: "What video quality do I get back?", a: "1080×1920 MP4, H.264, matching YouTube Shorts' recommended spec exactly." },
      ]}
    />
  );
}
