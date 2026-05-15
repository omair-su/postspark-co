import { Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import heroSculpture from "@/assets/hero-ceramic-ring.png";

/**
 * AICM-style hero: light cream BG, huge bold navy headline,
 * 3D ceramic sculpture floating on the right with parallax + slow rotation.
 * No WebGL — pure CSS so it renders everywhere (incl. sandboxed previews).
 */
export function HeroAICM() {
  const sculptRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let targetIntensity = 0.55, intensity = 0.55;

    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = nx * 24;
      ty = ny * 18;
      // closer to ring (right side) → brighter glow
      const dist = Math.hypot(nx - 0.25, ny);
      targetIntensity = Math.max(0.45, Math.min(1, 1.1 - dist * 1.4));
    };
    const onScroll = () => {
      const y = window.scrollY;
      sculptRef.current?.style.setProperty("--scroll-y", `${y * 0.15}px`);
      // tilt the ring slightly with scroll, ring stays fully on-screen
      sculptRef.current?.style.setProperty("--scroll-tilt", `${Math.min(y * 0.04, 12)}deg`);
    };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      intensity += (targetIntensity - intensity) * 0.06;
      if (sculptRef.current) {
        sculptRef.current.style.setProperty("--mx", `${cx}px`);
        sculptRef.current.style.setProperty("--my", `${cy}px`);
        sculptRef.current.style.setProperty("--cursor-tilt", `${cx * 0.25}deg`);
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = intensity.toFixed(3);
        glowRef.current.style.transform = `translate3d(${cx * 1.4}px, ${cy * 1.2}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #f5ede2 0%, #f3e3d3 40%, #f0d9c5 100%)",
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Soft grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Subtle diagonal grid lines like AICM */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #1a1a2e 1px, transparent 1px), linear-gradient(-45deg, #1a1a2e 1px, transparent 1px)",
          backgroundSize: "180px 180px",
        }}
      />

      {/* 3D sculpture — floats on right, drifts with cursor + scroll, slowly spins */}
      <div
        ref={sculptRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[-10%] z-0 w-[110%] sm:right-[-5%] sm:w-[80%] lg:right-[-8%] lg:w-[65%]"
        style={
          {
            ["--mx" as string]: "0px",
            ["--my" as string]: "0px",
            ["--scroll-y" as string]: "0px",
            ["--scroll-tilt" as string]: "0deg",
            ["--cursor-tilt" as string]: "0deg",
            transform:
              "translate3d(var(--mx), calc(var(--my) + var(--scroll-y)), 0)",
            willChange: "transform",
          } as React.CSSProperties
        }
      >
        {/* Reactive glow halo behind ring */}
        <div
          ref={glowRef}
          aria-hidden
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,139,250,0.55) 0%, rgba(232,93,58,0.25) 35%, transparent 70%)",
            filter: "blur(40px)",
            opacity: 0.55,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center lux-float">
          <img
            src={heroSculpture}
            alt=""
            width={1280}
            height={1280}
            className="h-[90%] w-[90%] object-contain animate-[heroSpin_42s_linear_infinite]"
            style={{
              transform: "rotate(var(--cursor-tilt)) rotate(var(--scroll-tilt))",
              transformOrigin: "center",
              filter:
                "drop-shadow(0 40px 80px rgba(124,58,237,0.30)) drop-shadow(0 20px 40px rgba(232,93,58,0.18)) saturate(1.08) contrast(1.03)",
            }}
          />
        </div>
      </div>

      {/* Soft fade so text stays legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, rgba(245,237,226,0.92) 0%, rgba(245,237,226,0.55) 45%, rgba(245,237,226,0) 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-center px-5 pb-20 pt-28 sm:px-8 sm:pt-36">
        <div className="max-w-3xl">
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1a1a2e]/15 bg-white/40 px-3 py-1.5 backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7c3aed]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#1a1a2e]/80">
              AI Content Repurposing · Live
            </span>
          </div>

          <h1
            className="font-extrabold tracking-[-0.035em] text-[#1a1a2e]"
            style={{
              fontSize: "clamp(2.6rem, 8.5vw, 6.5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            <span className="block animate-[heroRise_0.9s_ease-out_both]">
              The Smarter,
            </span>
            <span
              className="block animate-[heroRise_0.9s_0.12s_ease-out_both]"
            >
              AI-Powered
            </span>
            <span
              className="block animate-[heroRise_0.9s_0.24s_ease-out_both]"
              style={{
                background:
                  "linear-gradient(120deg, #1a1a2e 0%, #4c1d95 55%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Content Engine
            </span>
          </h1>

          <p
            className="mt-7 max-w-xl text-base leading-relaxed text-[#1a1a2e]/70 sm:text-lg animate-[heroRise_0.9s_0.4s_ease-out_both]"
          >
            Paste a blog, YouTube link, or PDF. PostSpark turns one piece of
            content into 30+ posts — tweets, LinkedIn, newsletters &amp; scripts —
            in your voice, in seconds.
          </p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center animate-[heroRise_0.9s_0.55s_ease-out_both]">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-3 rounded-full bg-[#1a1a2e] px-7 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-15px_rgba(26,26,46,0.5)] transition-all hover:scale-[1.02] hover:bg-[#2a2a4a]"
            >
              <Search className="h-4 w-4" />
              Start with PostSpark
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e]/20 bg-white/30 px-7 py-4 text-sm font-semibold text-[#1a1a2e] backdrop-blur-md transition-all hover:bg-white/60"
            >
              See pricing
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[#1a1a2e]/55 animate-[heroRise_0.9s_0.7s_ease-out_both]">
            <span>★ 4.9 / 5 · 127 reviews</span>
            <span>No credit card</span>
            <span>10 free repurposes / month</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes heroRise {
          from { opacity: 0; transform: translate3d(0, 24px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-[heroSpin"],
          [class*="animate-[heroFloat"],
          [class*="animate-[heroRise"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
