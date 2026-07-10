import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, Check, X, Zap, Mic, Film, Wand2, Clock, Music2,
  Type, Image as ImageIcon, Layers, TrendingUp, Star,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { LuxIconCard } from "@/components/landing/v2/LuxIconCard";
import { Breadcrumbs, type Crumb } from "@/components/marketing/Breadcrumbs";

export interface PremiumShortsLandingProps {
  eyebrow: string;
  h1: string;
  sub: string;
  heroImage: string;
  heroImageAlt: string;
  ctaPrimary?: { label: string; to: string };
  ctaSecondary?: { label: string; href: string };
  crumbs?: Crumb[];
  problems: { icon: typeof Zap; title: string; body: string }[];
  steps: { title: string; body: string }[];
  features: { icon: typeof Zap; title: string; body: string; tag?: string }[];
  mosaicImage?: string;
  competitors: {
    rows: { label: string; postspark: boolean | string; others: (boolean | string)[] }[];
    otherNames: string[];
  };
  samples?: { platform: string; hook: string; cta: string; tag: string }[];
  faq: { q: string; a: string }[];
}

const NAVY = "#0F172A";
const PRIMARY = "#7C3AED";
const PRIMARY_DARK = "#6D28D9";
const GOLD = "#C9A87C";
const MUTED = "#64748B";

export function PremiumShortsLanding(p: PremiumShortsLandingProps) {
  const cta1 = p.ctaPrimary ?? { label: "Start Free — No Card", to: "/signup" };
  const cta2 = p.ctaSecondary ?? { label: "Open Shorts Studio", href: "/dashboard/shorts-studio" };

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF" }}>
      <style>{`
        @keyframes ps-aurora {
          0%, 100% { transform: translate(-10%, -8%) scale(1); opacity: 0.55; }
          50% { transform: translate(8%, 6%) scale(1.15); opacity: 0.75; }
        }
        @keyframes ps-aurora-2 {
          0%, 100% { transform: translate(12%, 6%) scale(1.1); opacity: 0.45; }
          50% { transform: translate(-6%, -8%) scale(1); opacity: 0.65; }
        }
        @keyframes ps-shine {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes ps-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes ps-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ps-card-tilt {
          transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s ease;
        }
        .ps-card-tilt:hover {
          transform: perspective(900px) rotateX(-3deg) rotateY(3deg) translateY(-4px);
          box-shadow: 0 24px 48px rgba(124,58,237,0.18), 0 0 0 1px rgba(124,58,237,0.25);
        }
        .ps-glow-border {
          position: relative;
        }
        .ps-glow-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1.5px;
          background: linear-gradient(135deg, ${PRIMARY}, ${GOLD}, ${PRIMARY});
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
        }
        .ps-shine-strip {
          position: absolute; top: 0; bottom: 0; width: 40%;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
          animation: ps-shine 3.5s ease-in-out infinite;
          pointer-events: none;
        }
        .ps-float { animation: ps-float 6s ease-in-out infinite; }
        .ps-marquee-row { animation: ps-marquee 30s linear infinite; }
      `}</style>

      <Navbar />

      <main>
        {p.crumbs && p.crumbs.length > 0 && <Breadcrumbs items={p.crumbs} />}

        {/* ── HERO ──────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, #0B0B1F 0%, ${NAVY} 60%, #1B1B3A 100%)` }}>
          {/* Aurora blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div style={{
              position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "70%",
              background: `radial-gradient(circle, ${PRIMARY} 0%, transparent 60%)`,
              filter: "blur(80px)", animation: "ps-aurora 18s ease-in-out infinite", opacity: 0.55,
            }} />
            <div style={{
              position: "absolute", bottom: "-30%", right: "-15%", width: "65%", height: "80%",
              background: `radial-gradient(circle, #4F46E5 0%, transparent 60%)`,
              filter: "blur(90px)", animation: "ps-aurora-2 22s ease-in-out infinite", opacity: 0.5,
            }} />
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-28 sm:px-6 md:grid-cols-12 md:pt-36 lg:pb-32">
            <div className="md:col-span-6 lg:col-span-7">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur"
                style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(167,139,250,0.35)", color: "#DDD6FE" }}
              >
                <Sparkles className="h-3 w-3" /> {p.eyebrow}
              </span>
              <h1
                className="mt-7 text-[40px] leading-[1.02] tracking-tight sm:text-5xl md:text-[60px]"
                style={{ color: "#FFFFFF", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}
              >
                {p.h1}
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg" style={{ color: "#CBD5E1", lineHeight: 1.7 }}>
                {p.sub}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={cta1.to}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-7 py-4 text-sm font-bold text-white transition"
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
                    boxShadow: `0 12px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                >
                  <span className="ps-shine-strip" />
                  <span className="relative z-10 flex items-center gap-2">
                    {cta1.label} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
                <a
                  href={cta2.href}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-bold backdrop-blur transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "#FFFFFF" }}
                >
                  {cta2.label}
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px]" style={{ color: "#94A3B8" }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#10B981" }} />
                  Powered by Claude Sonnet 5
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" style={{ color: GOLD }} fill={GOLD} />
                  4.9/5 · 12,000+ creators
                </span>
                <span>No credit card · Free forever plan</span>
              </div>
            </div>

            {/* Hero mockup */}
            <div className="md:col-span-6 lg:col-span-5 flex items-center justify-center">
              <div className="relative ps-float">
                <div
                  aria-hidden
                  className="absolute -inset-8 rounded-[40px]"
                  style={{
                    background: `radial-gradient(circle, ${PRIMARY} 0%, transparent 65%)`,
                    filter: "blur(40px)", opacity: 0.55,
                  }}
                />
                <div className="ps-glow-border relative overflow-hidden rounded-[28px]"
                  style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
                  <img
                    src={p.heroImage}
                    alt={p.heroImageAlt}
                    width={640}
                    height={640}
                    className="block w-full max-w-[460px]"
                    style={{ borderRadius: "26px" }}
                  />
                </div>

                {/* Floating glass pills */}
                <div className="absolute -left-6 top-12 hidden md:flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold backdrop-blur"
                  style={{ background: "rgba(255,255,255,0.92)", color: NAVY, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
                  <Zap className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                  Hook score 92/100
                </div>
                <div className="absolute -right-4 bottom-16 hidden md:flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold backdrop-blur"
                  style={{ background: "rgba(255,255,255,0.92)", color: NAVY, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
                  <Mic className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                  AI voiceover ready
                </div>
              </div>
            </div>
          </div>

          {/* Logo marquee */}
          <div className="relative border-t" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)" }}>
            <div className="mx-auto max-w-7xl overflow-hidden px-4 py-6 sm:px-6">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#64748B" }}>
                Trusted by creators publishing to
              </p>
              <div className="mt-4 flex gap-12 overflow-hidden">
                <div className="ps-marquee-row flex shrink-0 items-center gap-12 whitespace-nowrap text-[15px] font-bold" style={{ color: "#CBD5E1" }}>
                  {["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn", "Threads", "X (Twitter)", "Pinterest", "Facebook Reels"].concat(
                    ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn", "Threads", "X (Twitter)", "Pinterest", "Facebook Reels"]
                  ).map((n, i) => (
                    <span key={i} className="opacity-80">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEMS ──────────────────────────────────── */}
        <section className="py-24 sm:py-32" style={{ background: "#F8FAFC" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>
                Why creators give up on short-form
              </p>
              <h2 className="mt-3 text-3xl sm:text-[40px]"
                style={{ color: NAVY, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Short-form burns out the best creators.
              </h2>
              <p className="mt-4 text-base" style={{ color: MUTED, lineHeight: 1.7 }}>
                Scripting, hooks, captions, vertical re-edits, hashtags — the editing tax kills the channel before it grows.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {p.problems.map((pr, i) => (
                <div key={i} className="ps-card-tilt rounded-2xl p-7"
                  style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
                  <LuxIconCard icon={pr.icon} size={64} />
                  <h3 className="mt-5 text-[17px] font-bold" style={{ color: NAVY }}>{pr.title}</h3>
                  <p className="mt-2 text-sm" style={{ color: MUTED, lineHeight: 1.6 }}>{pr.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <section className="py-24 sm:py-32" style={{ background: "#FFFFFF" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>
                The PostSpark pipeline
              </p>
              <h2 className="mt-3 text-3xl sm:text-[40px]"
                style={{ color: NAVY, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                From idea to ready-to-record in under 60 seconds.
              </h2>
            </div>

            <div className="relative mt-16">
              {/* Connecting line */}
              <div aria-hidden className="absolute left-0 right-0 top-[42px] hidden h-px md:block"
                style={{ background: `linear-gradient(90deg, transparent, ${PRIMARY} 20%, ${PRIMARY} 80%, transparent)` }} />
              <div className="relative grid gap-8 md:grid-cols-4">
                {p.steps.map((s, i) => (
                  <div key={i} className="relative">
                    <div
                      className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-full text-xl font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
                        boxShadow: `0 12px 32px rgba(124,58,237,0.4), inset 0 2px 0 rgba(255,255,255,0.25)`,
                      }}
                    >
                      0{i + 1}
                    </div>
                    <h3 className="mt-5 text-center text-[17px] font-bold" style={{ color: NAVY }}>{s.title}</h3>
                    <p className="mt-2 text-center text-sm" style={{ color: MUTED, lineHeight: 1.6 }}>{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURE MOSAIC ───────────────────────────── */}
        <section className="py-24 sm:py-32" style={{ background: `linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)` }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>
                Inside Shorts Studio
              </p>
              <h2 className="mt-3 text-3xl sm:text-[40px]"
                style={{ color: NAVY, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                A full short-form production studio in one tab.
              </h2>
            </div>

            {p.mosaicImage && (
              <div className="mt-14 overflow-hidden rounded-3xl"
                style={{ boxShadow: "0 40px 80px rgba(15,23,42,0.15)", border: "1px solid #E2E8F0" }}>
                <img src={p.mosaicImage} alt="PostSpark Shorts Studio features"
                  width={1536} height={1024} loading="lazy" className="block w-full" />
              </div>
            )}

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {p.features.map((f, i) => (
                <div key={i} className="ps-card-tilt relative rounded-2xl p-7"
                  style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
                  {f.tag && (
                    <span className="absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: "rgba(124,58,237,0.1)", color: PRIMARY, border: "1px solid rgba(124,58,237,0.25)" }}>
                      {f.tag}
                    </span>
                  )}
                  <LuxIconCard icon={f.icon} size={56} />
                  <h3 className="mt-5 text-[17px] font-bold" style={{ color: NAVY }}>{f.title}</h3>
                  <p className="mt-2 text-sm" style={{ color: MUTED, lineHeight: 1.6 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPETITOR COMPARISON ────────────────────── */}
        <section className="py-24 sm:py-32" style={{ background: NAVY }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#A78BFA" }}>
                Head-to-head
              </p>
              <h2 className="mt-3 text-3xl sm:text-[40px]"
                style={{ color: "#FFFFFF", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Why creators leave {p.competitors.otherNames.join(" and ")} for PostSpark.
              </h2>
            </div>

            <div className="mt-14 overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Feature</th>
                      <th className="px-6 py-5 text-center text-[13px] font-bold" style={{ color: "#FFFFFF" }}>
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} />
                          PostSpark
                        </span>
                      </th>
                      {p.competitors.otherNames.map((n) => (
                        <th key={n} className="px-6 py-5 text-center text-[13px] font-semibold" style={{ color: "#94A3B8" }}>{n}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.competitors.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < p.competitors.rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
                        <td className="px-6 py-4 font-medium" style={{ color: "#E2E8F0" }}>{row.label}</td>
                        <td className="px-6 py-4 text-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                          {typeof row.postspark === "boolean"
                            ? row.postspark
                              ? <Check className="mx-auto h-5 w-5" style={{ color: GOLD }} strokeWidth={3} />
                              : <X className="mx-auto h-5 w-5 text-red-400" />
                            : <span className="text-[13px] font-bold" style={{ color: GOLD }}>{row.postspark}</span>}
                        </td>
                        {row.others.map((v, j) => (
                          <td key={j} className="px-6 py-4 text-center">
                            {typeof v === "boolean"
                              ? v
                                ? <Check className="mx-auto h-5 w-5" style={{ color: "#64748B" }} />
                                : <X className="mx-auto h-5 w-5" style={{ color: "#475569" }} />
                              : <span className="text-[12px]" style={{ color: "#94A3B8" }}>{v}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px]" style={{ color: "#64748B" }}>
              Comparison based on publicly available features as of {new Date().getFullYear()}.
            </p>
          </div>
        </section>

        {/* ── SAMPLES ──────────────────────────────────── */}
        {p.samples && p.samples.length > 0 && (
          <section className="py-24 sm:py-32" style={{ background: "#FFFFFF" }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>
                  Real outputs
                </p>
                <h2 className="mt-3 text-3xl sm:text-[40px]"
                  style={{ color: NAVY, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                  Hooks PostSpark wrote this week.
                </h2>
              </div>
              <div className="mt-14 grid gap-6 md:grid-cols-3">
                {p.samples.map((s, i) => (
                  <div key={i} className="ps-card-tilt overflow-hidden rounded-2xl"
                    style={{ background: `linear-gradient(180deg, #1B1B3A 0%, #0F172A 100%)`, border: "1px solid rgba(124,58,237,0.3)" }}>
                    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#A78BFA" }}>{s.platform}</span>
                      <span className="text-[10px] font-semibold" style={{ color: GOLD }}>{s.tag}</span>
                    </div>
                    <div className="p-6">
                      <p className="text-lg font-bold leading-snug" style={{ color: "#FFFFFF" }}>"{s.hook}"</p>
                      <p className="mt-4 text-xs uppercase tracking-wider" style={{ color: "#64748B" }}>CTA</p>
                      <p className="mt-1 text-sm" style={{ color: "#CBD5E1" }}>{s.cta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────── */}
        <section className="py-24 sm:py-32" style={{ background: "#F8FAFC" }}>
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>FAQ</p>
              <h2 className="mt-3 text-3xl sm:text-[40px]"
                style={{ color: NAVY, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Questions creators ask first.
              </h2>
            </div>
            <div className="mt-12 space-y-4">
              {p.faq.map((f, i) => (
                <details key={i} className="group rounded-2xl p-6"
                  style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  <summary className="flex cursor-pointer items-center justify-between text-[15px] font-bold" style={{ color: NAVY }}>
                    {f.q}
                    <span className="ml-3 text-xl transition group-open:rotate-45" style={{ color: PRIMARY }}>+</span>
                  </summary>
                  <p className="mt-3 text-sm" style={{ color: MUTED, lineHeight: 1.7 }}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1B1B3A 100%)` }}>
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div style={{
              position: "absolute", top: "10%", left: "20%", width: "60%", height: "80%",
              background: `radial-gradient(circle, ${PRIMARY} 0%, transparent 65%)`,
              filter: "blur(80px)", opacity: 0.4,
            }} />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl sm:text-[44px]" style={{ color: "#FFFFFF", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Stop editing. Start posting.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base" style={{ color: "#CBD5E1", lineHeight: 1.7 }}>
              Join 12,000+ creators using PostSpark to turn one idea into a week of short-form content.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={cta1.to}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
                  boxShadow: `0 16px 40px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}
              >
                <span className="ps-shine-strip" />
                <span className="relative z-10 flex items-center gap-2">{cta1.label} <ArrowRight className="h-4 w-4" /></span>
              </Link>
              <a href={cta2.href} className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold backdrop-blur"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "#FFFFFF" }}>
                {cta2.label}
              </a>
            </div>
            <p className="mt-6 text-[12px]" style={{ color: "#64748B" }}>
              Free forever plan · No card needed · Cancel anytime
            </p>
          </div>
        </section>

        <FooterV2 />
      </main>
    </div>
  );
}

// Re-export commonly used icons so consumer files don't need separate imports
export { Zap, Mic, Film, Wand2, Clock, Music2, Type, ImageIcon, Layers, TrendingUp };
