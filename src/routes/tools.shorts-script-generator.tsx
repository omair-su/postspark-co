import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Music2, Type, ImageIcon, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/shorts-hero-mockup.jpg";
import mosaicImg from "@/assets/shorts-features-mosaic.jpg";

export const Route = createFileRoute("/tools/shorts-script-generator")({
  head: () => segmentHead({
    title: "TikTok & Shorts Script Generator — Free | PostSpark",
    desc: "Turn any blog post, video or idea into a ready-to-record TikTok, YouTube Shorts or Instagram Reels script — hooks, shot list, on-screen captions, hashtags. Free.",
    url: "https://postspark.co/tools/shorts-script-generator",
    path: "/tools/shorts-script-generator",
  }),
  component: ShortsScriptGeneratorPage,
});

function ShortsScriptGeneratorPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Free · Shorts Studio"
      h1="Turn any idea into a viral 60-second script — in under a minute."
      sub="Paste a blog, transcript, or rough idea. PostSpark writes 3 scored hook variants, a timed shot list, AI voiceover, on-screen captions, B-roll suggestions, and a ready-to-record SRT. Native to TikTok, Reels, and Shorts."
      heroImage={heroImg}
      heroImageAlt="PostSpark Shorts Studio editor mockup showing a vertical video with hook text and timeline"
      mosaicImage={mosaicImg}
      crumbs={[{ label: "Tools", href: "/#explore-tools" }, { label: "Shorts Script Generator" }]}
      ctaPrimary={{ label: "Start Free — No Card", to: "/signup" }}
      ctaSecondary={{ label: "Open Shorts Studio →", href: "/dashboard/shorts-studio" }}
      problems={[
        { icon: Clock, title: "Blank-script paralysis", body: "Staring at the editor at 11pm trying to remember the hook framework that worked last week." },
        { icon: Film, title: "Retake hell", body: "Recording 4 takes because the captions and shot order weren't planned." },
        { icon: TrendingUp, title: "Flat-line opens", body: "Posts die in the first 1.5 seconds because the hook never earned the watch time." },
        { icon: Layers, title: "Platform whiplash", body: "TikTok, Reels and Shorts each need a different tone — most tools give you one script." },
      ]}
      steps={[
        { title: "Paste source", body: "Blog post, YouTube transcript, podcast notes, or a rough idea." },
        { title: "Pick platform", body: "TikTok, Reels or Shorts — at 30, 45 or 60 seconds." },
        { title: "AI directs the shoot", body: "3 scored hooks, timed shot list, VO, captions, B-roll, CTA, hashtags." },
        { title: "Record & ship", body: "Export the script as .txt for teleprompter, .srt for captions, or generate the voiceover." },
      ]}
      features={[
        { icon: Zap, title: "Hook virality scores", body: "Every hook gets a 0-100 score with a one-line reason — pick the one most likely to land.", tag: "AI" },
        { icon: Mic, title: "AI voiceover (6 voices)", body: "One-click studio-quality narration. Download as WAV, drop into CapCut.", tag: "Pro" },
        { icon: Film, title: "B-roll library", body: "Pexels-powered vertical clip search for every shot — auto-matched to the voiceover." },
        { icon: Type, title: "Burned-in captions", body: "Export ready-to-use SRT for any editor, or burn captions directly into your clip." },
        { icon: Music2, title: "Trending audio picker", body: "Curated sounds per platform and niche — copy the exact in-app search string." },
        { icon: ImageIcon, title: "AI cover thumbnail", body: "Four styles (Bold / Editorial / Meme / Cinematic) generated from your title.", tag: "Pro" },
        { icon: Wand2, title: "Series mode", body: "Turn one source into 5 episodic scripts with cliffhangers — a week of content in one click.", tag: "Pro" },
        { icon: Layers, title: "Multi-clip editor", body: "Drag-reorder clips, trim, crop to 9:16, burn captions, export WebM — pure browser, no install.", tag: "Beta" },
        { icon: TrendingUp, title: "Native to every platform", body: "Different hook tone, caption rules, and hashtag pattern for TikTok, Reels and Shorts." },
      ]}
      competitors={{
        otherNames: ["Opus Clip", "Submagic", "Vizard"],
        rows: [
          { label: "AI script with timed shot list", postspark: true, others: [false, false, "limited"] },
          { label: "3 scored hook variants", postspark: true, others: [false, false, false] },
          { label: "AI voiceover (6 voices)", postspark: true, others: [false, "1 voice", false] },
          { label: "B-roll auto-matched per shot", postspark: true, others: [false, false, false] },
          { label: "Series mode (5 scripts from 1 source)", postspark: true, others: [false, false, false] },
          { label: "Trending audio picker", postspark: true, others: [false, true, false] },
          { label: "AI cover thumbnail", postspark: true, others: [false, false, false] },
          { label: "Free tier with full output", postspark: "3/mo", others: ["limited", "60s only", "5min/mo"] },
          { label: "Lifetime deal available", postspark: "$97", others: [false, false, false] },
        ],
      }}
      samples={[
        { platform: "TikTok", hook: "Nobody talks about the 4-second rule that 10x'd my watch time", cta: "Save this before TikTok kills the algo again", tag: "Score 94" },
        { platform: "Reels", hook: "If you're still editing Reels in CapCut by hand, you're 6 months behind", cta: "Follow for the workflow drop tomorrow", tag: "Score 91" },
        { platform: "Shorts", hook: "I shipped 30 Shorts in 30 days — here's what actually moved subs", cta: "Full breakdown on the channel", tag: "Score 88" },
      ]}
      faq={[
        { q: "Is the script generator really free?", a: "Yes — 3 scripts per month on the free tier, no credit card. Pro unlocks unlimited generation plus voiceover, AI cover thumbnails, Series mode, and brand voice training." },
        { q: "Which languages does it support?", a: "100+ languages. Set the source language in your input and PostSpark generates the script, captions and hashtags in that language." },
        { q: "Can I record from the script directly?", a: "Yes. Export as .txt for any teleprompter app, .srt for auto-captions in CapCut or Premiere, or generate the AI voiceover and drop it straight into your edit." },
        { q: "Do I own the scripts?", a: "100% yours. PostSpark gives you the output — no watermarks, no attribution, no usage restrictions." },
        { q: "How is this different from ChatGPT?", a: "ChatGPT gives you text. PostSpark gives you a hook-scored shot list, voiceover audio, b-roll matches, on-screen captions, SRT export, trending audio, and a cover thumbnail — built specifically for vertical video." },
        { q: "What platforms is the output tuned for?", a: "TikTok, YouTube Shorts and Instagram Reels — each gets a different hook tone, caption style and hashtag pattern. We're adding LinkedIn video and Pinterest Idea Pins next." },
        { q: "Can I publish directly from PostSpark?", a: "YouTube publishing is live. TikTok, Instagram and LinkedIn are rolling out as those platforms approve our developer apps — your scripts and videos are ready the moment they ship." },
        { q: "What's the multi-clip editor?", a: "Upload up to 5 clips, drag to reorder, trim, crop to 9:16, burn captions, and export a finished WebM — all in your browser. No CapCut, no Premiere, no install." },
      ]}
    />
  );
}
