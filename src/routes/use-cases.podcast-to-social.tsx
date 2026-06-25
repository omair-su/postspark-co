import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Type, ImageIcon, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/podcast-to-social-hero.jpg";

export const Route = createFileRoute("/use-cases/podcast-to-social")({
  head: () => segmentHead({
    title: "Podcast to Social Media — AI Repurposing | PostSpark",
    desc: "Turn every podcast episode into 30+ pieces of content: clips, threads, LinkedIn posts, newsletter sections, Instagram carousels. Beats Castmagic and Capsho on output quality.",
    url: "https://postspark.co/use-cases/podcast-to-social",
    path: "/use-cases/podcast-to-social",
  }),
  component: PodcastToSocialPage,
});

function PodcastToSocialPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Use Case · Podcasters"
      h1="One podcast → 30 pieces of social content. Same week."
      sub="Drop your episode audio or YouTube URL. PostSpark transcribes, finds the 5 strongest moments, and writes hooked LinkedIn posts, X threads, Instagram carousels, newsletter sections, and ready-to-record Shorts scripts — all in your voice."
      heroImage={heroImg}
      heroImageAlt="PostSpark podcast-to-social repurposing tool"
      crumbs={[{ label: "Use Cases", href: "/#use-cases" }, { label: "Podcasters" }]}
      problems={[
        { icon: Clock, title: "Editing tax", body: "You spend 8 hours on the episode and 12 hours on the social rollout. The math doesn't work." },
        { icon: TrendingUp, title: "Most episodes die after release week", body: "No flywheel: the moment the RSS push ends, the audience growth ends." },
        { icon: Film, title: "Clip-only tools miss the words", body: "Opus / Castmagic make clips. They don't write the LinkedIn post, the thread, or the carousel that actually drives subs." },
        { icon: Layers, title: "Voice gets lost", body: "Hand the transcript to ChatGPT and the personality vanishes. Your audience notices immediately." },
      ]}
      steps={[
        { title: "Upload the episode", body: "Audio file, YouTube URL, or RSS link. Up to 3 hours." },
        { title: "AI finds the gold", body: "PostSpark detects the 5 strongest moments — quotes, frames, contrarian takes." },
        { title: "30+ assets generated", body: "LinkedIn posts, X threads, IG carousels, newsletter blocks, Shorts scripts — all from the same source." },
        { title: "Schedule & ship", body: "Push to your scheduler or export. Run the whole rollout in one afternoon." },
      ]}
      features={[
        { icon: Mic, title: "Studio-quality transcription", body: "AssemblyAI-powered with speaker diarization. Accurate even on noisy live recordings." },
        { icon: Zap, title: "Moment detection", body: "AI scans the transcript and surfaces the top 5 frames worth turning into standalone content.", tag: "AI" },
        { icon: Type, title: "5 LinkedIn posts per episode", body: "Each in a different format — story, list, contrarian, frame, lesson — to avoid algorithm fatigue." },
        { icon: Film, title: "Auto Shorts scripts", body: "3 Shorts per episode, each with scored hooks, shot list, captions, voiceover, and SRT export." },
        { icon: ImageIcon, title: "IG carousel generation", body: "10-slide carousels with bold typography, on-brand colors, and a hook slide that holds.", tag: "Pro" },
        { icon: Wand2, title: "Brand voice from past posts", body: "Train PostSpark once and every piece reads like you wrote it.", tag: "Pro" },
        { icon: Layers, title: "Series mode", body: "Turn one episode into a 5-day Shorts drip with cliffhangers.", tag: "Pro" },
        { icon: TrendingUp, title: "Native to every channel", body: "X gets pace. LinkedIn gets first-line punch. IG gets visual hierarchy. Each post tuned per platform." },
      ]}
      competitors={{
        otherNames: ["Castmagic", "Capsho", "Riverside Magic"],
        rows: [
          { label: "Transcription + moment detection", postspark: true, others: [true, true, true] },
          { label: "LinkedIn / X / IG written, not just clipped", postspark: true, others: ["limited", "limited", false] },
          { label: "Shorts scripts with scored hooks", postspark: true, others: [false, false, false] },
          { label: "AI voiceover for clips", postspark: true, others: [false, false, false] },
          { label: "Brand voice training", postspark: true, others: [true, true, false] },
          { label: "Series mode (5-ep drip)", postspark: true, others: [false, false, false] },
          { label: "Pricing (entry plan)", postspark: "$19/mo", others: ["$23/mo", "$27/mo", "$29/mo"] },
          { label: "Lifetime deal available", postspark: "$97", others: [false, false, false] },
        ],
      }}
      samples={[
        { platform: "LinkedIn", hook: "I asked 12 podcast hosts how they grew past 10k downloads. The answer wasn't 'better guests'.", cta: "Full breakdown in the comments ↓", tag: "Score 92" },
        { platform: "X thread", hook: "Spent 200 hours analysing why most podcasts plateau at episode 30. The pattern is uncomfortable:", cta: "Save before this gets pulled.", tag: "Score 90" },
        { platform: "IG carousel", hook: "5 questions every podcaster should answer before episode 50", cta: "Save · Share · Follow for the next drop", tag: "Score 87" },
      ]}
      faq={[
        { q: "What audio formats are supported?", a: "MP3, M4A, WAV, plus direct YouTube and RSS imports. Up to 3 hours per episode." },
        { q: "How accurate is the transcription?", a: "We use AssemblyAI's best-in-class model — ~95% on clean audio, with speaker diarization included." },
        { q: "Will the posts sound like me?", a: "On Pro, yes. Upload 5 sample posts and PostSpark trains a voice model that's auto-applied to every output." },
        { q: "Can I schedule directly?", a: "Yes — PostSpark has a built-in calendar plus integrations with Buffer, Typefully and Hypefury queues." },
        { q: "How is this different from Castmagic?", a: "Castmagic gives you transcripts and clip moments. PostSpark turns those moments into fully written LinkedIn posts, X threads, IG carousels and Shorts scripts — in your voice." },
      ]}
    />
  );
}
