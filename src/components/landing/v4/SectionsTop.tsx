import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X as XIcon, Upload, Sparkles, Send, Play, ArrowRight } from "lucide-react";
import { SOCIALS, SocialCircle, Wordmark, delay } from "./parts";

const NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Studios", to: "/#studios" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
];

export function Lp4Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        height: 64,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F3F4F6",
        boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow .2s ease",
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

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          style={{ color: "#0F0F1A" }}
        >
          {open ? <Menu className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: "#fff" }}>
          <div className="flex h-16 items-center justify-between px-6">
            <Wordmark />
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} style={{ color: "#0F0F1A" }}>
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col gap-6 px-6 pt-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.to}
                onClick={() => setOpen(false)}
                style={{ fontSize: 20, fontWeight: 600, color: "#0F0F1A" }}
              >
                {l.label}
              </a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} style={{ fontSize: 20, fontWeight: 600, color: "#6B7280" }}>
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="lp4-btn-primary mt-2 text-center"
              style={{ fontSize: 16, fontWeight: 600, padding: "14px 20px" }}
            >
              Start Free →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function DashboardMock() {
  const cards = [
    { name: "LinkedIn", color: "#0A66C2", lines: [96, 88, 70] },
    { name: "Twitter/X", color: "#0F0F1A", lines: [90, 74, 60] },
    { name: "TikTok Script", color: "#EC4899", lines: [92, 80, 66] },
  ];
  return (
    <div className="flex" style={{ height: 520, background: "linear-gradient(180deg, #0F0F1A 0%, #1A0A3D 100%)" }}>
      <aside className="hidden w-[240px] shrink-0 flex-col gap-2 p-5 sm:flex" style={{ background: "#0F0F1A" }}>
        <div className="mb-4 flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}
          />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>PostSpark</span>
        </div>
        {["Dashboard", "Repurpose Studio", "Hook Lab", "Image Studio", "Shorts Studio", "Publishing", "Brand Kit"].map(
          (item, i) => (
            <div
              key={item}
              className="rounded-lg px-3 py-2"
              style={{
                fontSize: 12.5,
                fontWeight: i === 1 ? 700 : 500,
                color: i === 1 ? "#fff" : "rgba(255,255,255,0.55)",
                background: i === 1 ? "rgba(124,58,237,0.28)" : "transparent",
              }}
            >
              {item}
            </div>
          ),
        )}
      </aside>

      <div className="flex-1 p-5" style={{ background: "linear-gradient(160deg,#FFFFFF, #F5F3FF)" }}>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E5E7EB" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#7C3AED" }}>SOURCE</p>
          <div
            className="mt-2 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
            style={{ background: "#FAFAFA", border: "1px solid #E5E7EB" }}
          >
            <span style={{ fontSize: 12.5, color: "#6B7280" }}>youtube.com/watch?v=our-best-episode</span>
            <span
              className="shrink-0 rounded-md px-3 py-1.5"
              style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", color: "#fff", fontSize: 11.5, fontWeight: 700 }}
            >
              Repurpose
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.name} className="rounded-xl border bg-white p-3.5" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full" style={{ background: c.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F0F1A" }}>{c.name}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {c.lines.map((w, i) => (
                  <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: "#EEF0F4" }} />
                ))}
                <div className="h-2 rounded-full" style={{ width: "45%", background: "#DDD6FE" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Hooks scored 9.2/10", "Carousel · 10 slides ready"].map((t) => (
            <div
              key={t}
              className="rounded-xl border p-3.5"
              style={{ borderColor: "#DDD6FE", background: "#F5F3FF", fontSize: 12.5, fontWeight: 600, color: "#4C1D95" }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Lp4Hero() {
  const marquee = [...SOCIALS, ...SOCIALS];
  return (
    <section
      className="relative overflow-hidden px-6 pb-16 pt-[104px] sm:pt-[136px]"
      style={{
        background:
          "radial-gradient(ellipse 800px 600px at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 70%), #FFFFFF",
      }}
    >
      <div className="mx-auto max-w-[900px] text-center">
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
            ⚡ Powered by Claude Sonnet 5 · GPT Image 2 · Gemini Flash 2.5
          </span>
        </div>

        <h1
          className="fade-in-up mt-7 text-balance"
          style={{
            fontSize: "clamp(44px, 7vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "#0F0F1A",
            ...delay(100),
          }}
        >
          Turn One Idea Into a
          <br />
          <span className="lp4-grad-text">Week of Content.</span>
        </h1>

        <p
          className="fade-in-up mx-auto mt-6 max-w-[620px]"
          style={{ fontSize: 18, lineHeight: 1.65, color: "#6B7280", ...delay(200) }}
        >
          PostSpark is your AI Content Operating System. Repurpose podcasts, blogs, and videos into LinkedIn posts,
          TikTok scripts, carousels, hooks, and more — published to 7 platforms in under 60 seconds.
        </p>

        <div className="fade-in-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={delay(300)}>
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

        <div
          className="fade-in-up mt-5 flex flex-wrap items-center justify-center gap-5"
          style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", ...delay(350) }}
        >
          <span>✓ No credit card required</span>
          <span>✓ Free forever plan</span>
          <span>✓ Setup in 2 minutes</span>
        </div>

        <div className="fade-in-up mt-14" style={delay(400)}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", color: "#9CA3AF" }}>PUBLISH DIRECTLY TO</p>
          <div className="lp4-marquee-wrap relative mt-4 w-full overflow-hidden">
            <div className="animate-marquee flex w-max gap-8">
              {marquee.map((s, i) => (
                <SocialCircle key={`${s.name}-${i}`} s={s} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fade-in-up mx-auto mt-16 max-w-[1000px]" style={delay(500)}>
        <div
          className="animate-float overflow-hidden"
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 20px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
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
          <DashboardMock />
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
          <p style={{ fontSize: 18, fontWeight: 700, color: "#0F0F1A" }}>1,200+ Creators &amp; Marketers</p>
          <p style={{ fontSize: 14, color: "#6B7280" }}>trust PostSpark daily</p>
        </div>
        <div>
          <p style={{ fontSize: 20, color: "#F59E0B", letterSpacing: "2px" }}>★★★★★</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F0F1A" }}>4.9/5 rating</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>from early users</p>
        </div>
        <div>
          <p className="lp4-grad-text" style={{ fontSize: 24, fontWeight: 800 }}>
            27 days
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
    Icon: Upload,
    title: "Drop Your Source",
    body: "Paste a YouTube link, upload a podcast MP3, or import a blog URL. PostSpark reads it and handles transcription automatically.",
  },
  {
    n: "02",
    Icon: Sparkles,
    title: "AI Creates Everything",
    body: "PostSpark learns your Brand Voice, then generates 30+ platform-ready outputs: hooks, carousels, threads, shorts scripts, SEO blogs, and images.",
  },
  {
    n: "03",
    Icon: Send,
    title: "Publish Everywhere",
    body: "Schedule or publish instantly to LinkedIn, Twitter/X, Instagram, TikTok, YouTube, Facebook, and Threads — all from one place.",
  },
];

export function Lp4HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white px-6 py-16 sm:py-[100px]">
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="lp4-label fade-in-up">How it works</p>
        <h2
          className="fade-in-up mt-3"
          style={{ fontSize: "clamp(34px,5vw,48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
        >
          From One Source to Everywhere
        </h2>
        <p className="fade-in-up mx-auto mt-4 max-w-[560px]" style={{ fontSize: 18, color: "#6B7280", ...delay(200) }}>
          Three steps. That's all it takes to turn any content into a full week of platform-ready posts.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="lp4-card lp4-card-lg fade-in-up relative px-8 py-9 text-left"
              style={delay(i * 100)}
            >
              <span
                aria-hidden
                className="absolute right-6 top-4"
                style={{ fontSize: 56, fontWeight: 800, color: "#F3F0FF", lineHeight: 1 }}
              >
                {s.n}
              </span>
              <span
                className="grid place-items-center rounded-full"
                style={{ width: 52, height: 52, background: "#F5F3FF" }}
              >
                <s.Icon className="h-6 w-6" style={{ color: "#7C3AED" }} />
              </span>
              <h3 className="mt-4" style={{ fontSize: 20, fontWeight: 700, color: "#0F0F1A" }}>
                {s.title}
              </h3>
              <p className="mt-2" style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
