import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { delay } from "./parts";
import { CountUpOnView, PlatformLogo } from "./primitives";
import { BRAND_ICON, PUBLISH_PLATFORMS } from "@/lib/brandIcons";

const GUIDED = [
  {
    accent: "linear-gradient(90deg,#7C3AED,#3B82F6)",
    emoji: "🚀",
    title: "Founder Lesson",
    desc: "Turn a lesson into authority content with scored hooks and multi-platform posts.",
    tags: ["LinkedIn", "Thread", "Email", "Newsletter"],
    badge: "MOST POPULAR",
  },
  {
    accent: "linear-gradient(90deg,#F59E0B,#EF4444)",
    emoji: "✏️",
    title: "Creator Playbook",
    desc: "Knowledge → 10-slide carousels, Instagram captions, and Twitter threads.",
    tags: ["Carousel", "Thread", "Instagram"],
  },
  {
    accent: "linear-gradient(90deg,#10B981,#06B6D4)",
    emoji: "📦",
    title: "Product Launch",
    desc: "Complete launch copy for your product: ads, emails, social, and landing page.",
    tags: ["FB Ad", "Email", "Shopify", "LinkedIn"],
    badge: "NEW",
  },
  {
    accent: "linear-gradient(90deg,#8B5CF6,#EC4899)",
    emoji: "📊",
    title: "Marketing Tip",
    desc: "Turn one insight into a week of authority content across every channel.",
    tags: ["LinkedIn", "Newsletter", "Thread"],
  },
];

export function Lp4Guided() {
  return (
    <section className="px-6 py-16 sm:py-[100px]" style={{ background: "#FAFAFA" }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">Guided Studios</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(34px,5vw,48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
          >
            Answer a Few Prompts.
            <br />
            <span className="lp4-grad-text">Get a Full Content Drop.</span>
          </h2>
          <p className="fade-in-up mx-auto mt-4 max-w-[600px]" style={{ fontSize: 18, color: "#6B7280", ...delay(200) }}>
            Four guided workflows that take you from one idea to a complete, publish-ready content package in minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {GUIDED.map((g, i) => (
            <div
              key={g.title}
              className="lp4-card lp4-card-lg fade-in-up relative overflow-hidden px-7 py-8"
              style={delay(i * 100)}
            >
              <span aria-hidden className="absolute inset-x-0 top-0" style={{ height: 3, background: g.accent }} />
              {g.badge && (
                <span
                  className="absolute right-5 top-5 rounded-full px-3 py-1"
                  style={{
                    background: g.badge === "NEW" ? "#10B981" : "#7C3AED",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  {g.badge}
                </span>
              )}
              <span style={{ fontSize: 32 }} aria-hidden>
                {g.emoji}
              </span>
              <h3 className="mt-4" style={{ fontSize: 20, fontWeight: 700, color: "#0F0F1A" }}>
                {g.title}
              </h3>
              <p className="mt-2" style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.55 }}>
                {g.desc}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-1"
                    style={{ fontSize: 12, fontWeight: 500, background: "#F3F4F6", color: "#4B5563" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <Link to="/signup" className="mt-4 inline-block hover:underline" style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED" }}>
                Start →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "I went from 2 posts a week to 18. PostSpark pays for itself in a single afternoon.",
    stat: "+412%",
    statLabel: "WEEKLY OUTPUT",
    name: "Maya Chen",
    title: "142K YouTube",
    platform: "youtube",
    avatar: "#7C3AED",
  },
  {
    quote: "We replaced three freelance contractors with PostSpark. Output quality went up, cost went down. Wild.",
    stat: "$6,200",
    statLabel: "SAVED / MONTH",
    name: "Daniel Reyes",
    title: "Founder, Northbound Agency",
    platform: "linkedin",
    avatar: "#3B82F6",
  },
  {
    quote:
      "The Brand Voice feature is a cheat code. Every post sounds exactly like me — I keep forgetting the AI wrote it.",
    stat: "18 posts",
    statLabel: "FROM 1 PODCAST",
    name: "Priya Sharma",
    title: "38K LinkedIn",
    platform: "linkedin",
    avatar: "#10B981",
  },
  {
    quote: "One podcast episode now covers my whole week — shorts, threads, newsletter. It saves me two full days.",
    stat: "8 hrs",
    statLabel: "SAVED / WEEK",
    name: "Tom Whitfield",
    title: "Podcast host · 60K downloads",
    platform: "x",
    avatar: "#EA580C",
  },
];

const HEAD_STATS = [
  { value: 1200, suffix: "+", label: "Creators & Marketers" },
  { value: 4.9, decimals: 1, suffix: "★", label: "Average Rating" },
  { value: 30, suffix: "+", label: "Content Formats" },
];

const TWEETS = [
  {
    name: "Alex Moreno",
    handle: "@alexbuilds",
    text: "PostSpark turned my 45-min podcast into 22 posts, 3 carousels and a newsletter. I checked every single one — all usable. This is unfair.",
    likes: "412",
    rt: "58",
    color: "#7C3AED",
  },
  {
    name: "Sara Lindqvist",
    handle: "@saraonlinkedin",
    text: "Cancelled Buffer + Jasper + Canva Pro this month. PostSpark does all three for my content workflow. 🤯",
    likes: "836",
    rt: "121",
    color: "#0A66C2",
  },
  {
    name: "Devon Price",
    handle: "@devonships",
    text: "The Hook Lab scoring is the best part. I A/B two hooks, publish the winner, and my impressions have doubled in 3 weeks.",
    likes: "295",
    rt: "34",
    color: "#EA580C",
  },
  {
    name: "Nina Rao",
    handle: "@ninagrowth",
    text: "Brand Voice actually works. My client posts sound like the client, not like ChatGPT. That alone is worth the subscription.",
    likes: "651",
    rt: "77",
    color: "#10B981",
  },
];

export function Lp4Testimonials() {
  return (
    <section className="bg-white px-6 py-16 sm:py-[100px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">What creators say</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(34px,5vw,48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
          >
            Creators &amp; Founders
            <br />
            <span className="lp4-grad-text">Love PostSpark</span>
          </h2>
        </div>

        {/* Stats bar */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {HEAD_STATS.map((s, i) => (
            <div key={s.label} className="lp4-card fade-in-up px-6 py-7 text-center" style={delay(i * 90)}>
              <p className="lp4-grad-text" style={{ fontSize: "clamp(30px,4vw,40px)", fontWeight: 800, lineHeight: 1 }}>
                <CountUpOnView value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
              </p>
              <p className="mt-2" style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#9CA3AF" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonial grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => {
            const plat = PUBLISH_PLATFORMS.find((p) => p.key === t.platform);
            return (
              <figure
                key={t.name}
                className="fade-in-up px-6 py-7"
                style={{ background: "#fff", border: "1px solid #EDE9FE", borderRadius: 16, boxShadow: "var(--lp-card-shadow)", ...delay((i % 2) * 100) }}
              >
                <p style={{ fontSize: 16, color: "#F59E0B", letterSpacing: "1px" }}>★★★★★</p>
                <blockquote className="mt-4" style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, fontStyle: "italic" }}>
                  “{t.quote}”
                </blockquote>
                <div className="mt-4">
                  <p className="lp4-grad-text" style={{ fontSize: 22, fontWeight: 800 }}>
                    {t.stat}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", color: "#9CA3AF" }}>{t.statLabel}</p>
                </div>
                <figcaption className="mt-5 flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <span className="relative shrink-0">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full"
                      style={{ background: t.avatar, color: "#fff", fontSize: 15, fontWeight: 700 }}
                    >
                      {t.name.charAt(0)}
                    </span>
                    {plat && (
                      <span
                        className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-white"
                        style={{ width: 18, height: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
                      >
                        <PlatformLogo p={plat} size={12} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate" style={{ fontSize: 14, fontWeight: 700, color: "#0F0F1A" }}>
                      {t.name}
                    </span>
                    <span className="block truncate" style={{ fontSize: 13, color: "#9CA3AF" }}>
                      {t.title}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {/* Wall of love */}
        <div className="mt-16">
          <h3 className="fade-in-up text-center" style={{ fontSize: 20, fontWeight: 700, color: "#0F0F1A" }}>
            What creators are saying on X →
          </h3>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {TWEETS.map((tw, i) => (
              <article key={tw.handle} className="lp4-card fade-in-up px-6 py-6" style={delay((i % 2) * 90)}>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ background: tw.color, color: "#fff", fontSize: 15, fontWeight: 700 }}
                  >
                    {tw.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate" style={{ fontSize: 14, fontWeight: 700, color: "#0F0F1A" }}>
                        {tw.name}
                      </span>
                      <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: "#1D9BF0" }} aria-label="Verified" />
                    </span>
                    <span className="block truncate" style={{ fontSize: 13, color: "#9CA3AF" }}>
                      {tw.handle}
                    </span>
                  </span>
                  <img
                    src={BRAND_ICON.xBlack}
                    alt="X logo"
                    width={18}
                    height={18}
                    loading="lazy"
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                </div>
                <p className="mt-4" style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
                  {tw.text}
                </p>
                <p className="mt-4 flex items-center gap-5" style={{ fontSize: 13, color: "#9CA3AF" }}>
                  <span>♡ {tw.likes}</span>
                  <span>⇄ {tw.rt}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { n: 9, suffix: "+", l: "Studios Built-in" },
  { n: 9, suffix: "", l: "Platforms Connected" },
  { n: 3, suffix: "", l: "AI Image Models" },
  { n: 60, suffix: "s", l: "Average Repurpose Time" },
];

export function Lp4Stats() {
  return (
    <section className="px-6 py-16 sm:py-20" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)" }}>
      <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-8 text-center md:grid-cols-4 md:divide-x md:divide-white/20">
        {STATS.map((s, i) => (
          <div key={s.l} className="fade-in-up px-2" style={delay(i * 100)}>
            <p style={{ fontSize: "clamp(38px,6vw,56px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              <CountUpOnView value={s.n} suffix={s.suffix} />
            </p>
            <p className="mt-2" style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

