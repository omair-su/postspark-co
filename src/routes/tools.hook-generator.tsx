import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Music2, Type, ImageIcon, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/hook-generator-hero.jpg";

export const Route = createFileRoute("/tools/hook-generator")({
  head: () => segmentHead({
    title: "Viral Hook Generator — Free AI Tool | PostSpark",
    desc: "Generate 10 scored hook variants for TikTok, Reels, Shorts, X and LinkedIn. Each hook gets a 0-100 virality score with reasoning. Free, no card required.",
    url: "https://postspark.co/tools/hook-generator",
    path: "/tools/hook-generator",
  }),
  component: HookGeneratorPage,
});

function HookGeneratorPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Free · Hook Lab"
      h1="Viral hooks, scored 0–100, in 4 seconds."
      sub="Paste your idea. PostSpark writes 10 hook variants tuned for the platform, scores each on virality, and tells you exactly why one wins over another. Beats Tweet Hunter and Taplio on raw output quality."
      heroImage={heroImg}
      heroImageAlt="PostSpark hook generator UI showing scored hook variants"
      crumbs={[{ label: "Tools", href: "/#explore-tools" }, { label: "Viral Hook Generator" }]}
      problems={[
        { icon: Clock, title: "Blank-page paralysis", body: "You know the idea is good. You just can't find the line that earns the first second." },
        { icon: TrendingUp, title: "Hook-fatigue", body: "Your audience scrolled past 200 'Stop doing X' openers today. You need patterns they haven't seen this week." },
        { icon: Film, title: "Platform mismatch", body: "Reels, X, LinkedIn and TikTok all reward different opening patterns. One hook doesn't travel." },
        { icon: Layers, title: "No way to know what works", body: "ChatGPT writes hooks. It can't tell you which one will actually pop." },
      ]}
      steps={[
        { title: "Drop your idea", body: "A sentence, a paragraph, a transcript — whatever you've got." },
        { title: "Pick a platform", body: "TikTok, Reels, Shorts, X, LinkedIn or Threads — different tone for each." },
        { title: "AI scores 10 hooks", body: "Each variant gets a virality score and a one-line reason why." },
        { title: "Ship the winner", body: "Copy, plug into your script or post, watch the watch-time climb." },
      ]}
      features={[
        { icon: Zap, title: "Virality score per hook", body: "Every variant ranked 0–100 with a one-sentence breakdown of what makes it land — or not.", tag: "AI" },
        { icon: TrendingUp, title: "Per-platform tuning", body: "TikTok punchy + lowercase. LinkedIn first-line punchline. X pattern-interrupt. Same idea, native voice everywhere." },
        { icon: Wand2, title: "10 variants per click", body: "Not 1, not 3 — ten distinct angles so you can A/B in your head before you post." },
        { icon: Type, title: "Pattern library built in", body: "Curiosity gap, contrarian, stat, story, frame-shift, before/after — pulled from 10k+ winning posts." },
        { icon: Mic, title: "Brand voice aware", body: "Train PostSpark on your samples and every hook reads like you wrote it.", tag: "Pro" },
        { icon: Layers, title: "Series mode", body: "Generate 5 episode hooks for a content arc with built-in cliffhangers.", tag: "Pro" },
      ]}
      competitors={{
        otherNames: ["Tweet Hunter", "Taplio", "ChatGPT"],
        rows: [
          { label: "Virality score per hook", postspark: true, others: [false, false, false] },
          { label: "10 variants per generation", postspark: true, others: ["5", "3", "variable"] },
          { label: "Reasoning behind score", postspark: true, others: [false, false, false] },
          { label: "Native to TikTok / Reels / Shorts", postspark: true, others: [false, false, "generic"] },
          { label: "Brand voice training", postspark: true, others: [true, true, false] },
          { label: "Series mode (5 connected hooks)", postspark: true, others: [false, false, false] },
          { label: "Free tier with full output", postspark: "3/mo", others: ["7-day trial", "10-day trial", "free w/ limits"] },
        ],
      }}
      samples={[
        { platform: "TikTok", hook: "Stop teaching productivity if you've never been productive", cta: "Save before this gets pulled", tag: "Score 94" },
        { platform: "LinkedIn", hook: "I fired my best engineer last week. Here's why it was the right call.", cta: "Full breakdown below ↓", tag: "Score 92" },
        { platform: "X", hook: "Anyone else notice founders only sleep 4 hours when the company is failing?", cta: "Quote-tweet your take", tag: "Score 89" },
      ]}
      faq={[
        { q: "How is the virality score calculated?", a: "PostSpark scores each hook against a library of 10,000+ top-performing posts across TikTok, Reels, Shorts, X and LinkedIn. The score weighs pattern strength, curiosity gap, specificity, and platform fit." },
        { q: "Is it really free?", a: "Yes — 3 generations per month on the free tier with full output. Pro is $24/mo for unlimited plus brand voice training and series mode." },
        { q: "Will it match my brand voice?", a: "On Pro, yes. Drop in 5 samples and PostSpark trains a voice profile that gets auto-applied to every hook." },
        { q: "How is this different from ChatGPT?", a: "ChatGPT writes generic hooks with no scoring and no platform-specific tuning. PostSpark generates 10 ranked variants with reasoning, tuned for the exact channel you're posting to." },
        { q: "Can I use these for paid ads?", a: "Yes. Hooks that win on TikTok organic almost always win on Meta paid social — that's where most agencies use this." },
      ]}
    />
  );
}
