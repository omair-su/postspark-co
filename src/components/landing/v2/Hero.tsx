import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { HeroDemoWidget } from "./HeroDemoWidget";
import { track } from "@/lib/analytics";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-44 lg:pb-32"
      style={{ background: "#FFFFFF" }}
    >
      <style>{`
        @keyframes auroraFloat1 {
          0%   { transform: translate(0%, 0%) scale(1); }
          100% { transform: translate(6%, -8%) scale(1.12); }
        }
        @keyframes auroraFloat2 {
          0%   { transform: translate(0%, 0%) scale(1); }
          100% { transform: translate(-7%, 5%) scale(1.08); }
        }
        @keyframes auroraFloat3 {
          0%   { transform: translate(0%, 0%) scale(1); }
          100% { transform: translate(4%, 9%) scale(1.15); }
        }
        @keyframes beamRotate {
          0%   { --beam-angle: 0deg; }
          100% { --beam-angle: 360deg; }
        }
        .hero-beam-wrapper {
          position: relative;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px);
          padding: 8px;
          box-shadow: 0 25px 50px -12px rgba(124, 58, 237, 0.15);
        }
        .hero-beam-wrapper::before {
          content: "";
          position: absolute;
          inset: -1.5px;
          border-radius: 26px;
          padding: 1.5px;
          background: conic-gradient(
            from var(--beam-angle, 0deg),
            #7C3AED 0%,
            #A78BFA 20%,
            transparent 40%,
            transparent 80%,
            #7C3AED 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: beamRotate 4s linear infinite;
          opacity: 0.75;
        }
        @property --beam-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        .premium-glow-text {
          background: linear-gradient(135deg, #0F172A 0%, #4C1D95 50%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Aurora blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "70%",
            height: "70%",
            background: "radial-gradient(ellipse at center, #A78BFA 0%, transparent 70%)",
            opacity: 0.4,
            mixBlendMode: "multiply",
            animation: "auroraFloat1 40s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-15%",
            width: "65%",
            height: "65%",
            background: "radial-gradient(ellipse at center, #F0ABFC 0%, transparent 70%)",
            opacity: 0.35,
            mixBlendMode: "multiply",
            animation: "auroraFloat2 40s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "25%",
            width: "55%",
            height: "55%",
            background: "radial-gradient(ellipse at center, #C4B5FD 0%, transparent 70%)",
            opacity: 0.3,
            mixBlendMode: "multiply",
            animation: "auroraFloat3 40s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #E9D5FF 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
          maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Glass pill */}
          <div className="animate-fade-in">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                color: "#7C3AED",
                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.1)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Trusted by 12,000+ High-Growth Creators
            </span>
          </div>

          <h1
            className="mt-8 max-w-4xl text-[44px] leading-[1.1] tracking-tight sm:text-[64px] lg:text-[80px]"
            style={{
              color: "#0F172A",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              fontWeight: 800,
            }}
          >
            Turn 1 Post Into <span className="premium-glow-text">30 Platform-Ready</span> Pieces in 90 Seconds
          </h1>

          <p
            className="mt-8 max-w-2xl text-lg sm:text-xl"
            style={{ color: "#475569", lineHeight: 1.6 }}
          >
            Stop re-writing. PostSpark uses Claude AI to transform your blogs, videos, and podcasts into viral social content <strong>in your exact voice</strong>.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link
              to="/signup"
              onClick={() => track("cta_click", { from: "hero_primary" })}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
              }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              Start Free Now <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#try-demo"
              onClick={() => track("cta_click", { from: "hero_secondary" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white/50 px-8 py-4 text-base font-bold text-slate-900 backdrop-blur-sm transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700"
            >
              Try Interactive Demo ↓
            </a>
          </div>

          <ul
            className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium"
            style={{ color: "#64748B" }}
          >
            {[
              "3 free repurposes/month",
              "No credit card required",
              "Cancel anytime",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div id="try-demo" className="mt-20 lg:mt-24">
          <div className="mx-auto max-w-5xl">
            <div className="hero-beam-wrapper">
              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                <HeroDemoWidget />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
