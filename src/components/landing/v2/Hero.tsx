import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { HeroDemoWidget } from "./HeroDemoWidget";
import { track } from "@/lib/analytics";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#FFFFFF" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #E9D5FF 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-28 sm:px-6 md:grid-cols-12 md:gap-8 md:pt-32 lg:pb-24">
        <div className="md:col-span-7">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{
              background: "#F5F3FF",
              border: "1px solid #DDD6FE",
              color: "#7C3AED",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            }}
          >
            ⚡ Powered by Claude AI · Free to try
          </span>

          <h1
            className="mt-8 text-[40px] leading-[1.05] tracking-tight md:text-[52px] lg:text-[64px]"
            style={{
              color: "#0F172A",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              fontWeight: 700,
            }}
          >
            Turn 1 blog post into
            <br /> <span className="ps-display-accent">30 platform-ready</span>
            <br /> pieces in 90 seconds.
          </h1>

          <p
            className="mt-6 max-w-xl text-base sm:text-lg"
            style={{ color: "#64748B", lineHeight: 1.7 }}
          >
            Paste a blog, YouTube video, or podcast. PostSpark writes tweets,
            LinkedIn posts, newsletters, and video scripts <strong>in your voice</strong>
            {" "}— powered by Claude AI.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              onClick={() => track("cta_click", { from: "hero_primary" })}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold text-white transition"
              style={{
                background: "#7C3AED",
                boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#6D28D9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#try-demo"
              onClick={() => track("cta_click", { from: "hero_secondary" })}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold transition"
              style={{
                border: "2px solid #7C3AED",
                color: "#7C3AED",
                background: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Try It Live ↓
            </a>
          </div>

          <ul
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs"
            style={{ color: "#64748B" }}
          >
            {[
              "3 free repurposes/month",
              "No credit card required",
              "Cancel anytime",
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" style={{ color: "#10B981" }} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div id="try-demo" className="md:col-span-5">
          <HeroDemoWidget />
        </div>
      </div>
    </section>
  );
}
