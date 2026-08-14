import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X as XIcon, Upload, Sparkles, Rocket, Play, ArrowRight } from "lucide-react";
import { Wordmark, delay } from "./parts";
import { SCREENS } from "./screens";
import { PUBLISH_PLATFORMS } from "@/lib/brandIcons";
import { CountUpOnView, PlatformLogo, useWordCycle } from "./primitives";
import { FloatingBadges } from "./FloatingBadges";
import heroPerson from "@/assets/landing-v5/hero-person.png.asset.json";

const NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Studios", to: "/#studios" },
  { label: "Compare", to: "/alternatives/repurpose-io-vs-postspark" },
];

/** Full-width purple announcement strip above the header. */
export function Lp4Announcement({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center px-10"
      style={{ height: 36, background: "linear-gradient(90deg,#4C1D95,#6D28D9)" }}
    >
      <Link
        to="/signup"
        className="truncate text-center hover:underline"
        style={{ fontSize: 12.5, fontWeight: 600, color: "#FFFFFF" }}
      >
        🎉 New: Direct publishing to 9 platforms — LinkedIn, Instagram, TikTok, YouTube, and more. Try it free →
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={onClose}
        className="absolute right-4 grid place-items-center rounded-full"
        style={{ width: 20, height: 20, color: "rgba(255,255,255,0.8)" }}
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Lp4Nav({ offset = 0 }: { offset?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header
      className="fixed inset-x-0 z-50"

      style={{
        top: offset,
        height: 64,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F3F4F6",
        boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow .2s ease, top .2s ease",
      }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 lg:px-10">
        <Link to="/" aria-label="PostSpark home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.to}
              className="transition-colors"
              style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F0F1A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>
            Log in
          </Link>
          <Link
            to="/signup"
            className="lp4-btn-primary animate-cta-glow"
            style={{ fontSize: 14, fontWeight: 600, padding: "10px 20px" }}
          >
            Start Free →
          </Link>
        </div>

        {/* Mobile: CTA pill stays visible next to the menu button */}
        <div className="flex items-center gap-2.5 md:hidden">
          <Link
            to="/signup"
            className="lp4-btn-primary"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 999 }}
          >
            Start Free
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid place-items-center rounded-lg"
            style={{ width: 38, height: 38, border: "1px solid #E5E7EB", color: "#0F0F1A", background: "#fff" }}
          >
            {open ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

    </header>

    {open && (
      <div
        className="fixed inset-0 z-[100] overflow-y-auto md:hidden"
        style={{ background: "#FFFFFF", backgroundImage: "linear-gradient(180deg,#FFFFFF 0%,#F7F6FF 100%)" }}
      >
        <div className="flex h-16 items-center justify-between px-6" style={{ borderBottom: "1px solid #EEF0F6" }}>
          <Wordmark />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid place-items-center rounded-lg"
            style={{ width: 38, height: 38, border: "1px solid #E5E7EB", color: "#0F0F1A", background: "#fff" }}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-1 px-6 pt-4 pb-10">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3.5"
              style={{ fontSize: 18, fontWeight: 600, color: "#0F0F1A" }}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-3.5"
            style={{ fontSize: 18, fontWeight: 600, color: "#4B5563" }}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            onClick={() => setOpen(false)}
            className="lp4-btn-primary mt-3 text-center"
            style={{ fontSize: 16, fontWeight: 600, padding: "14px 20px" }}
          >
            Start Free →
          </Link>
        </div>
      </div>
    )}
    </>
  );
}


const CYCLE = ["Week of Content.", "30 Platform Posts.", "Viral LinkedIn Thread.", "Full SEO Blog.", "7 Social Platforms."];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      {/* soft purple halo behind the person */}
      <div
        aria-hidden
        className="lp4-mesh pointer-events-none absolute left-1/2 top-[8%] -translate-x-1/2 rounded-full"
        style={{
          width: "86%",
          aspectRatio: "1",
          background: "radial-gradient(circle at 50% 50%, rgba(167,139,250,0.45), rgba(236,72,153,0.18) 55%, transparent 72%)",
          filter: "blur(2px)",
        }}
      />
      <div
        aria-hidden
        className="lp4-ring pointer-events-none absolute left-1/2 top-[10%] -translate-x-1/2 rounded-full"
        style={{
          width: "82%",
          aspectRatio: "1",
          border: "1.5px dashed rgba(124,58,237,0.28)",
        }}
      />

      <img
        src={heroPerson.url}
        alt="Creator using PostSpark on a phone to publish content to every platform"
        width={1024}
        height={1280}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="relative z-10 mx-auto block w-[82%]"
      />

      {/* Floating real platform badges — scroll-triggered, drifting, hoverable */}
      <FloatingBadges size={56} />

      {/* Live notification cards */}
      <div
        className="fade-in-up lp4-glass-chip absolute left-[-6%] top-[38%] z-30 px-3 py-2"
        style={{ ...delay(600), maxWidth: 210 }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0F0F1A" }}>✅ LinkedIn post published</p>
        <p style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>2 seconds ago</p>
      </div>
      <div
        className="fade-in-up lp4-glass-chip absolute right-[-8%] top-[64%] z-30 px-3 py-2"
        style={{ ...delay(750), maxWidth: 220 }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0F0F1A" }}>⚡ 30 posts generated</p>
        <p style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>in 4.2 seconds</p>
      </div>
      <div
        className="fade-in-up lp4-glass-chip absolute bottom-[2%] left-[6%] z-30 px-3 py-2"
        style={{ ...delay(900), maxWidth: 220 }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0F0F1A" }}>🔥 Hook went viral</p>
        <p style={{ fontSize: 11, color: "#EA580C", fontWeight: 600 }}>847 reposts</p>
      </div>
    </div>
  );
}

export function Lp4Hero() {
  const word = useWordCycle(CYCLE, 2500);
  return (
    <section
      className="relative overflow-hidden px-6 pb-14 pt-[104px] sm:pt-[132px]"
      style={{
        background:
          "radial-gradient(ellipse 900px 700px at 50% 10%, #FFFFFF 0%, rgba(245,243,255,0.6) 100%), #FFFFFF",
      }}
    >
      {/* ambient blurred circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { top: "6%", left: "4%", size: 320 },
          { top: "34%", right: "6%", size: 380 },
          { bottom: "4%", left: "26%", size: 300 },
          { top: "0%", left: "48%", size: 260 },
        ].map((c, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              ...c,
              width: (c as { size: number }).size,
              height: (c as { size: number }).size,
              background: "#7C3AED",
              opacity: 0.08,
              filter: "blur(80px)",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <div className="fade-in-up">
            <span
              className="inline-flex items-center rounded-full px-4 py-2"
              style={{
                border: "1px solid #DDD6FE",
                background: "#F5F3FF",
                fontSize: 12,
                fontWeight: 600,
                color: "#7C3AED",
                letterSpacing: ".03em",
              }}
            >
              ⚡ PostSpark — AI Content OS · Claude · GPT Image 2 · Flux Pro 1.1
            </span>
          </div>

          <h1
            className="fade-in-up mt-7 text-balance"
            style={{
              fontSize: "clamp(40px,6.2vw,66px)",
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              color: "#0F0F1A",
              ...delay(100),
            }}
          >
            Turn One Idea Into a
            <br />
            <span key={word} className="lp4-word lp4-grad-text">
              {word}
            </span>
          </h1>

          <p
            className="fade-in-up mt-6 max-w-[600px] lg:mx-0 mx-auto"
            style={{ fontSize: 18, lineHeight: 1.65, color: "#6B7280", ...delay(200) }}
          >
            PostSpark is your AI Content OS. One idea → 30 platform-ready pieces, published to 9 social platforms in
            under 60 seconds. Powered by Claude, GPT Image 2, and Flux Pro 1.1.
          </p>

          <div
            className="fade-in-up mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center"
            style={delay(300)}
          >
            <Link
              to="/signup"
              className="lp4-btn-primary animate-cta-glow inline-flex items-center gap-2"
              style={{ fontSize: 15, fontWeight: 600, padding: "14px 28px" }}
            >
              Start Creating Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/#how-it-works"
              className="lp4-btn-ghost inline-flex items-center gap-2"
              style={{ fontSize: 15, fontWeight: 500, padding: "14px 24px" }}
            >
              <Play className="h-4 w-4" /> Watch Demo
            </a>
          </div>

          <p
            className="fade-in-up mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 lg:justify-start"
            style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", ...delay(350) }}
          >
            <span>✓ No credit card</span>
            <span aria-hidden>|</span>
            <span>✓ Free forever plan</span>
            <span aria-hidden>|</span>
            <span>✓ Setup in 2 minutes</span>
            <span aria-hidden>|</span>
            <span>✓ Cancel anytime</span>
          </p>
        </div>

        <div className="fade-in-up relative" style={delay(400)}>
          <HeroVisual />
        </div>
      </div>

      {/* Product screenshot with glow */}
      <div className="fade-in-up relative mx-auto mt-16 max-w-[1000px]" style={delay(500)}>
        <div
          className="overflow-hidden"
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 0 60px 0 rgba(124,58,237,0.15), 0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4"
            style={{ height: 40, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}
          >
            {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            ))}
            <div
              className="mx-auto flex max-w-[280px] flex-1 items-center justify-center rounded-full bg-white"
              style={{ height: 24, border: "1px solid #E5E7EB", fontSize: 12, color: "#9CA3AF" }}
            >
              postspark.co/dashboard
            </div>
          </div>
          <img
            src={SCREENS.dashboard}
            alt="PostSpark dashboard showing the AI content workspace, quick actions and generation stats"
            width={1800}
            height={1125}
            loading="lazy"
            decoding="async"
            className="block w-full"
          />
        </div>
      </div>
    </section>
  );
}

export function Lp4SocialProof() {
  return (
    <section
      className="px-6 py-8"
      style={{ background: "#FAFAFA", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6" }}
    >
      <div className="fade-in-up mx-auto flex max-w-[1000px] flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#0F0F1A" }}>
            <CountUpOnView value={1200} suffix="+" /> Creators &amp; Marketers
          </p>
          <p style={{ fontSize: 14, color: "#6B7280" }}>trust PostSpark daily</p>
        </div>
        <div>
          <p style={{ fontSize: 20, color: "#F59E0B", letterSpacing: "2px" }}>★★★★★</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F0F1A" }}>
            <CountUpOnView value={4.9} decimals={1} />
            /5 rating
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>from early users</p>
        </div>
        <div>
          <p className="lp4-grad-text" style={{ fontSize: 24, fontWeight: 800 }}>
            <CountUpOnView value={27} suffix=" days" />
          </p>
          <p style={{ fontSize: 14, color: "#6B7280" }}>longest active streak 🔥</p>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    num: 1,
    Icon: Upload,
    anim: "lp4-anim-bounce",
    title: "Drop Your Source",
    body: "Paste a YouTube URL, upload a podcast MP3, or paste any blog post. PostSpark reads it all and transcribes automatically.",
    chips: ["🎬 YouTube", "🎙 Podcast MP3", "📝 Blog URL", "📄 Google Doc", "✍️ Raw Text"],
    shot: SCREENS.repurpose,
    shotAlt: "PostSpark import panel with source options",
  },
  {
    n: "02",
    num: 2,
    Icon: Sparkles,
    anim: "lp4-anim-wand",
    title: "AI Creates Everything",
    body: "Claude reads your brand voice, applies your tone, and generates 30+ platform-optimised pieces: tweets, LinkedIn posts, SEO blogs, carousels, hooks, and video scripts.",
    chips: ["⚡ Generated in 4.2 seconds"],
    shot: SCREENS.imageStudio,
    shotAlt: "PostSpark output panel with generated content pieces",
  },
  {
    n: "03",
    num: 3,
    Icon: Rocket,
    anim: "lp4-anim-rocket",
    title: "Publish to 9 Platforms",
    body: "Review everything in the Content Calendar, schedule your posts, and publish directly to X, Instagram, TikTok, YouTube, Facebook, LinkedIn, Threads, and WhatsApp — from one place.",
    chips: [],
    shot: SCREENS.publishing,
    shotAlt: "PostSpark publishing center with platform toggles",
  },
];

export function Lp4HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white px-6 py-16 sm:py-[100px]">
      <div className="mx-auto max-w-[1000px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">How it works</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(32px,5vw,48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
          >
            From One Idea to <span className="lp4-grad-text">30 Posts</span> in 3 Steps
          </h2>
          <p className="fade-in-up mx-auto mt-4 max-w-[520px]" style={{ fontSize: 17, color: "#6B7280", ...delay(200) }}>
            No editing. No reformatting. No switching between 6 tools.
          </p>
        </div>

        <div className="relative mt-14">
          {/* dashed timeline rail */}
          <span
            aria-hidden
            className="absolute left-[26px] top-4 hidden md:block"
            style={{ width: 2, bottom: 24, borderLeft: "2px dashed #DDD6FE" }}
          />

          <div className="flex flex-col gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="fade-in-up relative md:pl-[76px]" style={delay(i * 120)}>
                <span
                  aria-hidden
                  className="absolute left-0 top-4 hidden place-items-center rounded-full bg-white md:grid"
                  style={{ width: 54, height: 54, border: "2px solid #EDE9FE" }}
                >
                  <s.Icon className={`h-6 w-6 ${s.anim}`} style={{ color: "#7C3AED" }} />
                </span>
                <div className="lp4-card lp4-card-lg grid gap-6 px-7 py-8 md:grid-cols-[1fr_240px] md:items-center">
                  <div>
                    <span style={{ fontSize: 34, fontWeight: 800, color: "#EDE9FE", lineHeight: 1 }}>{s.n}</span>
                    <h3 className="mt-2" style={{ fontSize: 21, fontWeight: 700, color: "#0F0F1A" }}>
                      {s.title}
                    </h3>
                    <p className="mt-2" style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65 }}>
                      {s.body}
                    </p>
                    {s.chips.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {s.chips.map((c) => (
                          <span
                            key={c}
                            className="rounded-full px-3 py-1"
                            style={{ fontSize: 12, fontWeight: 600, background: "#F5F3FF", color: "#7C3AED" }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.num === 3 && (
                      <div className="mt-4 flex flex-wrap items-center gap-2.5">
                        {PUBLISH_PLATFORMS.map((p) => (
                          <PlatformLogo key={p.key} p={p} size={22} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="lp4-shot">
                    <img
                      src={s.shot}
                      alt={s.shotAlt}
                      width={1800}
                      height={1125}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
