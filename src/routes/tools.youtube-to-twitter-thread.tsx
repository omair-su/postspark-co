import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Type, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/yt-to-ig-hero.jpg";

export const Route = createFileRoute("/tools/youtube-to-twitter-thread")({
  head: () => segmentHead({
    title: "YouTube to Twitter Thread — Free AI Generator | PostSpark",
    desc: "Paste a YouTube URL or transcript. PostSpark generates a 5–9 tweet thread that hooks, builds tension, and lands the CTA — in your voice. Free.",
    url: "https://postspark.co/tools/youtube-to-twitter-thread",
    path: "/tools/youtube-to-twitter-thread",
  }),
  component: YouTubeToTwitterThreadPage,
});

function YouTubeToTwitterThreadPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Free · YouTube → X"
      h1="Turn any YouTube video into a thread people actually finish."
      sub="Drop a URL or transcript. PostSpark engineers the hook, paces the tension, builds the payoff, and writes the CTA — formatted to X's 280-char rhythm. Outperforms Tweet Hunter and Hypefury on quality."
      heroImage={heroImg}
      heroImageAlt="PostSpark YouTube to Twitter thread tool"
      crumbs={[{ label: "Tools", href: "/#explore-tools" }, { label: "YouTube → Twitter Thread" }]}
      problems={[
        { icon: Clock, title: "Transcripts are not threads", body: "Pasting a transcript into ChatGPT gives you long rambling tweets nobody reads to the end." },
        { icon: TrendingUp, title: "Hook collapse", body: "You write tweet 1 then the thread loses energy by tweet 3 — and the analytics tell on you." },
        { icon: Film, title: "Format whiplash", body: "Same video needs different framings for X, LinkedIn, and email. Re-writing every time is dead time." },
        { icon: Layers, title: "Lost CTA", body: "Most threads forget the ending. PostSpark always closes with a payoff and a clean CTA." },
      ]}
      steps={[
        { title: "Drop the URL", body: "YouTube link, transcript, or rough notes — whatever you've got." },
        { title: "Pick thread shape", body: "5, 7 or 9 tweets. List, story, contrarian, breakdown, or case-study." },
        { title: "AI writes the thread", body: "Hook tweet, build, payoff, CTA. Each tweet hits the 280-char rhythm." },
        { title: "Tweak & post", body: "Edit inline. Copy to clipboard. Or push to Typefully / Hypefury queue." },
      ]}
      features={[
        { icon: Zap, title: "Scored hooks", body: "First tweet gets 3 variants with virality scores so you ship the one most likely to stop the scroll.", tag: "AI" },
        { icon: TrendingUp, title: "Pace engineering", body: "Tension up, payoff down, CTA clean. The same architecture top X writers spend years figuring out." },
        { icon: Wand2, title: "Brand voice training", body: "PostSpark studies your 5 best tweets and writes in your exact cadence.", tag: "Pro" },
        { icon: Type, title: "280-char aware", body: "Every tweet checked against the line-break and visual rhythm X rewards." },
        { icon: Mic, title: "Multi-format export", body: "Same source → X thread, LinkedIn post, Threads post, newsletter section. One click each.", tag: "Pro" },
        { icon: Layers, title: "Series mode", body: "Turn a single video into 5 threads on different angles — a month of X content from one upload.", tag: "Pro" },
      ]}
      competitors={{
        otherNames: ["Tweet Hunter", "Hypefury", "Typefully"],
        rows: [
          { label: "Paste YouTube URL → thread", postspark: true, others: [false, false, false] },
          { label: "Scored hook variants", postspark: true, others: [false, false, false] },
          { label: "Pace engineering (build / payoff)", postspark: true, others: [false, false, false] },
          { label: "Brand voice training", postspark: true, others: [true, false, false] },
          { label: "Multi-format export (LinkedIn / IG)", postspark: true, others: [false, false, false] },
          { label: "Free tier with full output", postspark: "3/mo", others: ["7-day trial", "limited", "limited"] },
          { label: "Lifetime deal available", postspark: "$97", others: [false, false, false] },
        ],
      }}
      samples={[
        { platform: "X · 7 tweets", hook: "I rewatched a 47-min Naval podcast 6 times. Here's the one frame that broke my career:", cta: "Save this thread. You'll want it in 3 years.", tag: "Score 93" },
        { platform: "X · 5 tweets", hook: "A founder asked me 'how do you get 10x leverage?' I sent her this 90-second answer:", cta: "RT if it lands.", tag: "Score 90" },
        { platform: "X · 9 tweets", hook: "Everyone says 'follow your curiosity'. Nobody tells you the math that makes it work. So I built it:", cta: "Tools below ↓", tag: "Score 88" },
      ]}
      faq={[
        { q: "How long does generation take?", a: "About 8 seconds for a 7-tweet thread. We use Claude Sonnet 5 with structured tool calls — no streaming hallucination, no fluff." },
        { q: "Will it match my X voice?", a: "On Pro, yes. Train PostSpark on 5 of your best-performing tweets and it copies your rhythm, vocabulary, and CTA style." },
        { q: "Can it pull the transcript itself?", a: "Yes — paste any YouTube URL and PostSpark fetches the transcript automatically. No copying or downloads needed." },
        { q: "Does it support Threads (Meta)?", a: "Yes. Same engine, retuned for the Threads format and voice." },
        { q: "How is this different from Tweet Hunter?", a: "Tweet Hunter writes single tweets. PostSpark engineers full threads from source content with scored hooks, paced tension, and brand voice — and gives you the LinkedIn / IG / newsletter versions for free." },
      ]}
    />
  );
}
