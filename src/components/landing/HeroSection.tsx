import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Star, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { PostSparkLogo } from "@/components/PostSparkLogo";

const SAMPLE_INPUT =
  "We just shipped a new way to repurpose long-form content into 30+ short posts in under 10 seconds.";

const SAMPLE_OUTPUTS: Array<{ platform: string; emoji: string; text: string }> = [
  {
    platform: "Tweet",
    emoji: "🐦",
    text: "Stop writing 30 posts a week.\n\nWrite 1. Repurpose into 30.\n\n10 seconds. No copy-paste. No burnout.",
  },
  {
    platform: "LinkedIn",
    emoji: "💼",
    text: "Most creators burn out trying to be on every platform.\n\nWe just shipped something that fixes that:\n→ 1 input\n→ 30 ready-to-publish posts\n→ Under 10 seconds",
  },
  {
    platform: "Hook",
    emoji: "🔥",
    text: "I used to spend 4 hours every Monday rewriting my essay for social. Now it takes 20 minutes — and the posts perform better.",
  },
];

function useTypewriter(text: string, speed = 18, startDelay = 400) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    let cancelled = false;
    const start = setTimeout(function tick() {
      if (cancelled) return;
      i += 1;
      setOut(text.slice(0, i));
      if (i < text.length) setTimeout(tick, speed);
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, speed, startDelay]);
  return out;
}

function HeroDemo() {
  const [tab, setTab] = useState(0);
  const typed = useTypewriter(SAMPLE_OUTPUTS[tab].text, 14, 250);

  // Auto-rotate tabs every 6s
  useEffect(() => {
    const t = setInterval(() => setTab((i) => (i + 1) % SAMPLE_OUTPUTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-4 backdrop-blur-md shadow-2xl sm:p-5">
      {/* Input row */}
      <div className="rounded-xl border border-primary-foreground/10 bg-navy/40 p-4 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/50">
          Your input
        </p>
        <p className="mt-1.5 text-sm text-primary-foreground/90 leading-relaxed">{SAMPLE_INPUT}</p>
      </div>

      {/* Arrow + tabs */}
      <div className="my-3 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-primary-foreground/10" />
        <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">
          <Zap className="h-3 w-3" /> AI repurpose
        </div>
        <div className="h-px flex-1 bg-primary-foreground/10" />
      </div>

      {/* Output tabs */}
      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {SAMPLE_OUTPUTS.map((o, i) => (
          <button
            key={o.platform}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              tab === i
                ? "bg-primary-foreground text-navy shadow"
                : "bg-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/20"
            }`}
          >
            <span className="mr-1">{o.emoji}</span>
            {o.platform}
          </button>
        ))}
      </div>

      {/* Animated output */}
      <div className="rounded-xl border border-primary-foreground/15 bg-navy/60 p-4 text-left min-h-[140px]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/50">
          Generated · {SAMPLE_OUTPUTS[tab].platform}
        </p>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-primary-foreground">
          {typed}
          <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-primary-foreground/80 align-middle" />
        </p>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero pt-20 pb-14 sm:pt-32 sm:pb-24">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-electric blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-electric blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 animate-fade-in">
        <div className="mb-4 flex justify-center sm:mb-6">
          <PostSparkLogo
            variant="icon"
            size={56}
            className="drop-shadow-[0_0_40px_rgba(167,139,250,0.4)] sm:!h-[72px] sm:!w-[72px]"
          />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 sm:mb-5">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-[11px] font-medium text-primary-foreground">
            AI-Powered Content Repurposing
          </span>
        </div>

        <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
          Turn 1 Piece of Content
          <br />
          <span className="text-gradient">Into 30 — Instantly</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:mt-5 sm:text-lg">
          Paste a blog, YouTube link, or PDF. Get tweets, LinkedIn posts, newsletters & video scripts in seconds — in your voice.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-6 py-3 text-sm font-bold text-navy shadow-lg transition-all hover:opacity-90"
          >
            Try PostSpark Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/10"
          >
            See pricing
          </Link>
        </div>

        {/* Trust line */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-primary-foreground/70">
          <span className="inline-flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3 w-3 fill-amber-300 text-amber-300" />
            ))}
            <span className="ml-1 font-semibold text-primary-foreground">4.9/5</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3" /> 10 free repurposes/month
          </span>
        </div>

        {/* Live demo */}
        <HeroDemo />
      </div>
    </section>
  );
}
