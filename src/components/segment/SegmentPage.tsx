import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HeroDemoWidget } from "@/components/landing/v2/HeroDemoWidget";
import { PricingV2 } from "@/components/landing/v2/PricingV2";
import { FinalCTA } from "@/components/landing/v2/FinalCTA";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { FAQv2 } from "@/components/landing/v2/FAQv2";
import { track } from "@/lib/analytics";

export type SegmentPageProps = {
  eyebrow: string;
  h1: string;
  sub: string;
  pains: string[];
  solutions: string[];
  workflow?: { title: string; body: string }[];
};

export function SegmentPage(p: SegmentPageProps) {
  return (
    <div className="min-h-screen scroll-smooth" style={{ background: "#FFFFFF" }}>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden" style={{ background: "#FFFFFF" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, #E9D5FF 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.5,
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-28 sm:px-6 md:grid-cols-12 md:gap-8 md:pt-32 lg:pb-24">
            <div className="md:col-span-7">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#7C3AED", letterSpacing: "0.1em" }}
              >
                <Sparkles className="h-3 w-3" /> {p.eyebrow}
              </span>
              <h1
                className="mt-6 text-[36px] leading-[1.05] tracking-tight sm:text-5xl md:text-[54px]"
                style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif", fontWeight: 800 }}
              >
                {p.h1}
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg" style={{ color: "#64748B", lineHeight: 1.7 }}>
                {p.sub}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  onClick={() => track("cta_click", { from: "segment_hero", page: p.eyebrow })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold text-white transition"
                  style={{ background: "#7C3AED", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#6D28D9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
                >
                  Start Free — No Card Needed <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#try-demo"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold transition"
                  style={{ border: "2px solid #7C3AED", color: "#7C3AED" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Try the live demo
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "#64748B" }}>
                {["10 free repurposes monthly", "No credit card required", "Cancel anytime"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" style={{ color: "#10B981" }} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div id="try-demo" className="md:col-span-5">
              <HeroDemoWidget />
            </div>
          </div>
        </section>

        {/* PAINS + SOLUTIONS */}
        <section style={{ background: "#F8FAFC" }} className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C3AED", letterSpacing: "0.1em" }}>
              The problem · The fix
            </p>
            <h2
              className="mt-3 max-w-3xl text-3xl sm:text-4xl"
              style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif", fontWeight: 800, lineHeight: 1.1 }}
            >
              What's costing you hours — and how PostSpark removes it.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div
                className="rounded-2xl p-7"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "4px solid #EF4444" }}
              >
                <h3 className="text-lg font-bold" style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}>
                  😩 What's draining your week
                </h3>
                <ul className="mt-4 space-y-3">
                  {p.pains.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#334155", lineHeight: 1.7 }}>
                      <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#EF4444" }} /> {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="rounded-2xl p-7"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderLeft: "4px solid #10B981" }}
              >
                <h3 className="text-lg font-bold" style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}>
                  ⚡ What PostSpark gives you
                </h3>
                <ul className="mt-4 space-y-3">
                  {p.solutions.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#334155", lineHeight: 1.7 }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#10B981" }} /> {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        {p.workflow && p.workflow.length > 0 && (
          <section style={{ background: "#FFFFFF" }} className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C3AED", letterSpacing: "0.1em" }}>
                Your workflow
              </p>
              <h2
                className="mt-3 text-3xl sm:text-4xl"
                style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif", fontWeight: 800, lineHeight: 1.1 }}
              >
                How it works for you
              </h2>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {p.workflow.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6"
                    style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ background: "#F5F3FF", color: "#7C3AED" }}
                    >
                      Step {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="mt-3 text-lg font-bold" style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}>
                      {w.title}
                    </h3>
                    <p className="mt-2 text-sm" style={{ color: "#64748B", lineHeight: 1.7 }}>
                      {w.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <PricingV2 />
        <FAQv2 />
        <FinalCTA />
        <FooterV2 />
      </main>
    </div>
  );
}

export function segmentHead(opts: { title: string; desc: string; url: string }) {
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.desc },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.desc },
      { property: "og:url", content: opts.url },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: opts.url },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "PostSpark",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: opts.desc,
          url: opts.url,
        }),
      },
    ],
  };
}
