import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import heroDashboard from "@/assets/landing-v3/hero-dashboard.png";

export function HeroV3() {
  return (
    <section className="relative overflow-hidden lv3-aurora lv3-grain" style={{ minHeight: "100vh" }}>
      {/* drifting aurora glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 lv3-drift" style={{
        background: "radial-gradient(40% 30% at 30% 20%, rgba(124,58,237,0.35), transparent 70%), radial-gradient(35% 25% at 75% 25%, rgba(6,182,212,0.28), transparent 70%)"
      }} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="flex flex-col items-center text-center">
          <span className="lv3-chip lv3-fade-up">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
            New · Powered by Claude Sonnet 4.5
          </span>

          <h1
            className="mt-6 font-display-lux text-balance lv3-fade-up"
            style={{
              fontSize: "clamp(44px, 8vw, 104px)",
              lineHeight: 1.02,
              color: "#FAFAF9",
              maxWidth: "18ch",
            }}
          >
            Turn <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>one video</em>
            <br className="hidden sm:block" />
            into <span className="lv3-text-gradient">a month</span> of content.
          </h1>

          <p
            className="mt-6 max-w-2xl text-balance lv3-fade-up"
            style={{
              fontSize: "clamp(16px, 1.6vw, 20px)",
              lineHeight: 1.55,
              color: "rgba(250,250,249,0.72)",
            }}
          >
            PostSpark repurposes your podcast, YouTube, or Zoom into 30+ posts,
            shorts, and threads — in your voice, in under 60 seconds.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3 lv3-fade-up w-full sm:w-auto">
            <Link
              to="/signup"
              className="lv3-cta inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-[15px] font-semibold w-full sm:w-auto"
            >
              Start free — 3 repurposes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="lv3-cta-ghost inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-medium w-full sm:w-auto"
            >
              <Play className="h-4 w-4" />
              Watch 90s demo
            </a>
          </div>

          <p className="mt-5 text-xs lv3-fade-up" style={{ color: "rgba(250,250,249,0.5)" }}>
            No credit card · Cancel any time · 2,400+ creators shipping daily
          </p>
        </div>

        {/* Hero dashboard mockup */}
        <div className="relative mt-16 sm:mt-24 lv3-fade-up">
          <div aria-hidden className="absolute inset-x-0 -top-10 mx-auto h-72 max-w-4xl blur-3xl opacity-60"
            style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(124,58,237,0.6) 0%, rgba(6,182,212,0.35) 50%, transparent 80%)" }} />
          <div className="relative mx-auto max-w-6xl">
            <img
              src={heroDashboard}
              alt="PostSpark dashboard showing AI-generated tweets, LinkedIn posts and analytics"
              width={1600}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="relative w-full h-auto rounded-2xl"
              style={{ filter: "drop-shadow(0 60px 100px rgba(0,0,0,0.6))" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
