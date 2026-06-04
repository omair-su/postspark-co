import { useEffect, useRef, useState } from "react";
import { FileText, Mic2, MousePointer2, Play, Sparkles, Zap } from "lucide-react";

const streamCards = [
  { icon: FileText, label: "BLOG", className: "ps3d-source ps3d-source-a" },
  { icon: Play, label: "VIDEO", className: "ps3d-source ps3d-source-b" },
  { icon: Mic2, label: "AUDIO", className: "ps3d-source ps3d-source-c" },
];

const outputCards = [
  { label: "X", className: "ps3d-output ps3d-output-a" },
  { label: "in", className: "ps3d-output ps3d-output-b" },
  { label: "✦", className: "ps3d-output ps3d-output-c" },
  { label: "▶", className: "ps3d-output ps3d-output-d" },
];

type Quality = "full" | "lite" | "static";

function detectInitialQuality(): Quality {
  if (typeof window === "undefined") return "full";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "static";
  if ((nav.deviceMemory ?? 8) <= 2) return "static";
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  if (cores <= 4 || mem <= 4) return "lite";
  return "full";
}

/**
 * Native premium 3D PostSpark hero visual.
 * No iframe, no external runtime — React + CSS 3D with adaptive quality,
 * skeleton-until-ready handoff, and a static premium frame for reduced motion
 * or low-end devices.
 */
export function PremiumHeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<Quality>("static"); // SSR-safe default
  const [ready, setReady] = useState(false);

  // Decide quality after mount (browser-only signals).
  useEffect(() => {
    setQuality(detectInitialQuality());
    // Two RAFs: layout settled + first paint flushed → skeleton fades to scene.
    const r1 = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true)),
    );
    return () => cancelAnimationFrame(r1);
  }, []);

  // Parallax + FPS-based throttle/downgrade (only for animated modes).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (quality === "static") return;

    let raf = 0;
    let rx = 0;
    let ry = 0;
    let tx = 0;
    let ty = 0;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let slowSamples = 0;
    let downgraded = false;
    const targetMs = quality === "full" ? 1000 / 60 : 1000 / 30;

    const onMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      tx = x * 7;
      ty = y * -6;
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Throttle to targetMs (low-FPS mode just skips frames).
      acc += dt;
      if (acc >= targetMs) {
        acc = 0;
        rx += (ty - rx) * 0.07;
        ry += (tx - ry) * 0.07;
        sceneRef.current?.style.setProperty("--scene-rx", `${rx.toFixed(2)}deg`);
        sceneRef.current?.style.setProperty("--scene-ry", `${ry.toFixed(2)}deg`);
      }

      // FPS sampling — if we're consistently <24fps, step down.
      frames++;
      if (dt > 45) slowSamples++;
      if (frames >= 90 && !downgraded) {
        if (slowSamples / frames > 0.45) {
          downgraded = true;
          // full → lite → static
          setQuality((q) => (q === "full" ? "lite" : "static"));
        }
        frames = 0;
        slowSamples = 0;
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [quality]);

  return (
    <div
      className={`ps3d-shell ps3d-${quality} ${ready ? "ps3d-ready" : ""}`}
      aria-hidden="true"
    >
      {/* Skeleton — visible until the scene is ready */}
      <div className="ps3d-skeleton" aria-hidden="true">
        <div className="ps3d-skeleton-orb" />
        <div className="ps3d-skeleton-orb ps3d-skeleton-orb-b" />
      </div>

      <div className="ps3d-aurora ps3d-aurora-one" />
      <div className="ps3d-aurora ps3d-aurora-two" />
      <div className="ps3d-aurora ps3d-aurora-rim" />
      <div className="ps3d-perspective">
        <div ref={sceneRef} className="ps3d-scene">
          <div className="ps3d-ground" />
          <div className="ps3d-orbit ps3d-orbit-outer" />
          <div className="ps3d-orbit ps3d-orbit-inner" />

          <div className="ps3d-core-wrap">
            <div className="ps3d-core-shadow" />
            <div className="ps3d-core">
              <div className="ps3d-core-rim" />
              <div className="ps3d-core-top">
                <div className="ps3d-core-chip">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="ps3d-core-screen">
                <span />
                <span />
                <span />
                <i />
              </div>
              <div className="ps3d-core-base">
                <Zap className="h-4 w-4" />
                <div className="ps3d-core-bars">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="ps3d-core-spec" />
            </div>
          </div>

          {streamCards.map(({ icon: Icon, label, className }) => (
            <div key={label} className={className}>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          ))}

          {outputCards.map(({ label, className }) => (
            <div key={label} className={className}>
              {label}
            </div>
          ))}

          <div className="ps3d-beam ps3d-beam-a" />
          <div className="ps3d-beam ps3d-beam-b" />
          <div className="ps3d-beam ps3d-beam-c" />
          <div className="ps3d-beam ps3d-beam-d" />

          <div className="ps3d-cursor-card">
            <MousePointer2 className="h-4 w-4" />
            <span />
          </div>
        </div>
      </div>

      <style>{`
        .ps3d-shell {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 520px;
          overflow: hidden;
        }

        /* Skeleton overlay — fades out once .ps3d-ready */
        .ps3d-skeleton {
          position: absolute;
          inset: 0;
          z-index: 5;
          background:
            radial-gradient(60% 50% at 62% 50%, color-mix(in oklab, var(--electric) 14%, transparent) 0%, transparent 70%),
            linear-gradient(135deg, color-mix(in oklab, var(--navy) 5%, transparent), transparent 60%);
          opacity: 1;
          transition: opacity 600ms ease;
          pointer-events: none;
        }
        .ps3d-skeleton-orb {
          position: absolute;
          width: 44%;
          aspect-ratio: 1;
          right: 18%;
          top: 22%;
          border-radius: 999px;
          background: linear-gradient(135deg,
            color-mix(in oklab, var(--electric) 28%, transparent),
            color-mix(in oklab, var(--navy) 22%, transparent));
          filter: blur(30px);
          animation: ps3d-shimmer 1.6s ease-in-out infinite;
        }
        .ps3d-skeleton-orb-b {
          width: 28%;
          right: 9%;
          bottom: 18%;
          top: auto;
          animation-delay: -0.7s;
        }

        /* Scene content fades in once ready */
        .ps3d-perspective,
        .ps3d-aurora { opacity: 0; transition: opacity 700ms ease 80ms; }
        .ps3d-ready .ps3d-perspective,
        .ps3d-ready .ps3d-aurora { opacity: 1; }
        .ps3d-ready .ps3d-skeleton { opacity: 0; }

        .ps3d-aurora {
          position: absolute;
          border-radius: 999px;
          filter: blur(38px);
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .ps3d-aurora-one {
          width: 48%;
          aspect-ratio: 1;
          right: 17%;
          top: 14%;
          background: radial-gradient(closest-side,
            color-mix(in oklab, var(--electric) 70%, white 10%) 0%,
            color-mix(in oklab, var(--electric) 35%, transparent) 45%,
            transparent 75%);
          animation: ps3d-glow 5s ease-in-out infinite;
        }
        .ps3d-aurora-two {
          width: 36%;
          aspect-ratio: 1;
          right: 5%;
          bottom: 12%;
          background: radial-gradient(closest-side,
            color-mix(in oklab, oklch(0.82 0.16 200) 70%, white 12%) 0%,
            color-mix(in oklab, oklch(0.82 0.16 200) 30%, transparent) 50%,
            transparent 80%);
          animation: ps3d-glow 6s ease-in-out -1.5s infinite;
        }
        .ps3d-aurora-rim {
          width: 70%;
          aspect-ratio: 1;
          right: -10%;
          top: 8%;
          background: radial-gradient(closest-side,
            color-mix(in oklab, oklch(0.92 0.04 280) 35%, transparent) 0%,
            transparent 70%);
          filter: blur(58px);
          opacity: .9;
        }

        .ps3d-perspective {
          position: absolute;
          inset: 0;
          perspective: 1200px;
          perspective-origin: 55% 45%;
          display: grid;
          place-items: center;
        }

        .ps3d-scene {
          --scene-rx: 0deg;
          --scene-ry: 0deg;
          position: relative;
          width: min(620px, 96%);
          aspect-ratio: 1 / 1;
          transform-style: preserve-3d;
          transform: rotateX(calc(62deg + var(--scene-rx))) rotateZ(-18deg) rotateY(var(--scene-ry));
          will-change: transform;
          animation: ps3d-breathe 7s ease-in-out infinite;
        }

        /* Reflective floor / ground plane */
        .ps3d-ground {
          position: absolute;
          inset: -8% -8% -22%;
          transform: translateZ(-140px);
          background:
            radial-gradient(60% 40% at 50% 60%,
              color-mix(in oklab, var(--electric) 28%, transparent) 0%,
              transparent 70%),
            radial-gradient(80% 60% at 50% 50%,
              color-mix(in oklab, var(--navy) 18%, transparent) 0%,
              transparent 80%);
          filter: blur(20px);
          border-radius: 999px;
        }

        .ps3d-orbit {
          position: absolute;
          inset: 11%;
          border: 1px solid color-mix(in oklab, var(--navy) 22%, transparent);
          border-radius: 42% 58% 48% 52%;
          transform: translateZ(-30px);
          box-shadow:
            inset 0 0 38px color-mix(in oklab, var(--electric) 22%, transparent),
            0 0 30px color-mix(in oklab, var(--electric) 14%, transparent);
        }
        .ps3d-orbit-inner {
          inset: 24%;
          border-color: color-mix(in oklab, var(--electric) 45%, transparent);
          animation: ps3d-spin 18s linear infinite reverse;
        }
        .ps3d-orbit-outer { animation: ps3d-spin 24s linear infinite; }

        .ps3d-core-wrap {
          position: absolute;
          inset: 31%;
          transform-style: preserve-3d;
          animation: ps3d-float 4.8s ease-in-out infinite;
        }

        .ps3d-core-shadow {
          position: absolute;
          inset: 14% 9% -10%;
          transform: translateZ(-88px);
          border-radius: 999px;
          background: color-mix(in oklab, var(--navy) 42%, transparent);
          filter: blur(28px);
        }

        .ps3d-core {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-rows: 34% 42% 24%;
          border-radius: 28px;
          overflow: hidden;
          transform-style: preserve-3d;
          transform: translateZ(92px);
          background:
            linear-gradient(145deg,
              color-mix(in oklab, var(--navy) 96%, white 6%),
              color-mix(in oklab, var(--electric) 55%, var(--navy)));
          border: 1px solid color-mix(in oklab, white 42%, transparent);
          box-shadow:
            0 50px 110px color-mix(in oklab, var(--navy) 42%, transparent),
            0 20px 40px color-mix(in oklab, var(--electric) 28%, transparent),
            inset 0 1px 0 color-mix(in oklab, white 55%, transparent),
            inset 0 -22px 60px color-mix(in oklab, var(--electric) 28%, transparent);
        }

        /* Rim light along the top-left edge for a polished bevel */
        .ps3d-core-rim {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          pointer-events: none;
          background:
            linear-gradient(160deg,
              color-mix(in oklab, white 55%, transparent) 0%,
              transparent 22%,
              transparent 78%,
              color-mix(in oklab, white 18%, transparent) 100%);
          mix-blend-mode: overlay;
          opacity: .9;
        }
        /* Specular highlight that sweeps subtly */
        .ps3d-core-spec {
          position: absolute;
          inset: -10% -30% auto auto;
          width: 70%;
          height: 70%;
          background: radial-gradient(closest-side,
            color-mix(in oklab, white 38%, transparent) 0%,
            transparent 70%);
          filter: blur(8px);
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .ps3d-core::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg,
            transparent 12%,
            color-mix(in oklab, white 32%, transparent) 28%,
            transparent 44%);
          transform: translateX(-80%);
          animation: ps3d-sheen 4.8s ease-in-out infinite;
        }

        .ps3d-core-top,
        .ps3d-core-base {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .ps3d-core-chip {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border-radius: 18px;
          background: color-mix(in oklab, white 14%, transparent);
          box-shadow:
            inset 0 0 0 1px color-mix(in oklab, white 28%, transparent),
            0 0 32px color-mix(in oklab, var(--electric) 72%, transparent);
        }

        .ps3d-core-screen {
          margin: 0 15%;
          border-radius: 18px;
          background: color-mix(in oklab, white 92%, var(--surface));
          transform: translateZ(14px);
          box-shadow:
            inset 0 0 0 1px color-mix(in oklab, var(--navy) 10%, transparent),
            0 6px 18px color-mix(in oklab, var(--navy) 22%, transparent);
          display: grid;
          align-content: center;
          gap: 8px;
          padding: 18px;
        }

        .ps3d-core-screen span,
        .ps3d-core-screen i,
        .ps3d-core-bars span,
        .ps3d-cursor-card span {
          display: block;
          height: 8px;
          border-radius: 99px;
          background: color-mix(in oklab, var(--navy) 76%, transparent);
        }

        .ps3d-core-screen span:nth-child(1) { width: 74%; }
        .ps3d-core-screen span:nth-child(2) { width: 92%; opacity: .42; }
        .ps3d-core-screen span:nth-child(3) { width: 58%; opacity: .32; }
        .ps3d-core-screen i {
          width: 42%;
          height: 12px;
          margin-top: 3px;
          background: linear-gradient(90deg, var(--electric), oklch(0.77 0.16 190));
          animation: ps3d-pulse 1.8s ease-in-out infinite;
        }

        .ps3d-core-base { gap: 10px; background: color-mix(in oklab, white 8%, transparent); }
        .ps3d-core-bars { display: flex; gap: 5px; align-items: end; }
        .ps3d-core-bars span {
          width: 5px;
          background: color-mix(in oklab, white 80%, var(--electric));
          animation: ps3d-bars 1.25s ease-in-out infinite;
        }
        .ps3d-core-bars span:nth-child(1) { height: 12px; animation-delay: -0.2s; }
        .ps3d-core-bars span:nth-child(2) { height: 20px; animation-delay: -0.45s; }
        .ps3d-core-bars span:nth-child(3) { height: 15px; }

        .ps3d-source,
        .ps3d-cursor-card {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border-radius: 18px;
          padding: 12px 15px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--navy);
          background: linear-gradient(180deg,
            color-mix(in oklab, white 82%, var(--surface)),
            color-mix(in oklab, white 62%, var(--surface)));
          border: 1px solid color-mix(in oklab, var(--navy) 14%, white 38%);
          box-shadow:
            0 24px 50px color-mix(in oklab, var(--navy) 22%, transparent),
            0 2px 0 color-mix(in oklab, var(--navy) 8%, transparent),
            inset 0 1px 0 color-mix(in oklab, white 80%, transparent);
          transform-style: preserve-3d;
        }

        .ps3d-source-a { left: 4%; top: 25%; transform: translateZ(62px) rotateZ(18deg); animation: ps3d-cardfloat 4.8s ease-in-out infinite; }
        .ps3d-source-b { left: 10%; bottom: 22%; transform: translateZ(110px) rotateZ(-5deg); animation: ps3d-cardfloat 5.2s ease-in-out -1.1s infinite; }
        .ps3d-source-c { right: 13%; top: 10%; transform: translateZ(84px) rotateZ(8deg); animation: ps3d-cardfloat 4.6s ease-in-out -2.1s infinite; }

        .ps3d-output {
          position: absolute;
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border-radius: 20px;
          font-size: 17px;
          font-weight: 900;
          color: white;
          background:
            radial-gradient(120% 120% at 22% 18%,
              color-mix(in oklab, white 38%, transparent) 0%,
              transparent 38%),
            linear-gradient(145deg,
              var(--electric),
              color-mix(in oklab, var(--navy) 72%, var(--electric)));
          border: 1px solid color-mix(in oklab, white 38%, transparent);
          box-shadow:
            0 24px 46px color-mix(in oklab, var(--electric) 42%, transparent),
            0 6px 14px color-mix(in oklab, var(--navy) 32%, transparent),
            inset 0 1px 0 color-mix(in oklab, white 48%, transparent);
          transform-style: preserve-3d;
          animation: ps3d-pop 3.6s ease-in-out infinite;
        }

        .ps3d-output-a { right: 11%; top: 34%; transform: translateZ(142px); }
        .ps3d-output-b { right: 22%; bottom: 19%; transform: translateZ(104px); animation-delay: -0.9s; }
        .ps3d-output-c { left: 33%; top: 5%; transform: translateZ(134px); animation-delay: -1.7s; }
        .ps3d-output-d { left: 45%; bottom: 6%; transform: translateZ(118px); animation-delay: -2.4s; }

        .ps3d-beam {
          position: absolute;
          height: 2px;
          border-radius: 99px;
          transform-origin: left center;
          background: linear-gradient(90deg,
            transparent,
            color-mix(in oklab, var(--electric) 80%, white) 50%,
            transparent);
          box-shadow:
            0 0 18px color-mix(in oklab, var(--electric) 55%, transparent),
            0 0 38px color-mix(in oklab, var(--electric) 25%, transparent);
          animation: ps3d-beam 2.4s ease-in-out infinite;
        }
        .ps3d-beam-a { width: 230px; left: 20%; top: 41%; transform: translateZ(44px) rotateZ(18deg); }
        .ps3d-beam-b { width: 225px; left: 30%; bottom: 35%; transform: translateZ(60px) rotateZ(-21deg); animation-delay: -0.8s; }
        .ps3d-beam-c { width: 190px; right: 21%; top: 32%; transform: translateZ(74px) rotateZ(143deg); animation-delay: -1.3s; }
        .ps3d-beam-d { width: 160px; right: 25%; bottom: 27%; transform: translateZ(92px) rotateZ(205deg); animation-delay: -1.9s; }

        .ps3d-cursor-card {
          right: 5%;
          bottom: 33%;
          transform: translateZ(172px) rotateZ(-12deg);
          padding: 10px 12px;
          color: white;
          background: color-mix(in oklab, var(--navy) 92%, var(--electric));
          border-color: color-mix(in oklab, white 24%, transparent);
          animation: ps3d-cursor 5s ease-in-out infinite;
        }
        .ps3d-cursor-card span { width: 36px; background: color-mix(in oklab, white 68%, transparent); }

        /* Animations */
        @keyframes ps3d-spin { to { transform: translateZ(-30px) rotate(360deg); } }
        @keyframes ps3d-glow { 0%, 100% { opacity: .7; transform: scale(.95); } 50% { opacity: 1; transform: scale(1.08); } }
        @keyframes ps3d-breathe { 0%, 100% { margin-top: 0; } 50% { margin-top: -18px; } }
        @keyframes ps3d-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -18px; } }
        @keyframes ps3d-sheen { 0%, 45% { transform: translateX(-90%); } 75%, 100% { transform: translateX(110%); } }
        @keyframes ps3d-pulse { 0%, 100% { opacity: .72; width: 36%; } 50% { opacity: 1; width: 56%; } }
        @keyframes ps3d-bars { 0%, 100% { scale: 1 .68; opacity: .7; } 50% { scale: 1 1.18; opacity: 1; } }
        @keyframes ps3d-cardfloat { 0%, 100% { margin-top: 0; } 50% { margin-top: -16px; } }
        @keyframes ps3d-pop { 0%, 100% { margin-top: 0; filter: saturate(1); } 50% { margin-top: -12px; filter: saturate(1.28); } }
        @keyframes ps3d-beam { 0%, 100% { opacity: .2; scale: .82 1; } 50% { opacity: .9; scale: 1.04 1; } }
        @keyframes ps3d-cursor { 0%, 100% { margin: 0; } 42% { margin: -20px 0 0 -18px; } 68% { margin: -2px 0 0 10px; } }
        @keyframes ps3d-shimmer { 0%, 100% { opacity: .55; transform: scale(.96); } 50% { opacity: 1; transform: scale(1.04); } }

        /* Lite mode — keep depth & glow, cut heavy infinite anims */
        .ps3d-lite .ps3d-scene,
        .ps3d-lite .ps3d-core-wrap,
        .ps3d-lite .ps3d-core::after,
        .ps3d-lite .ps3d-orbit-inner,
        .ps3d-lite .ps3d-orbit-outer,
        .ps3d-lite .ps3d-source,
        .ps3d-lite .ps3d-output,
        .ps3d-lite .ps3d-beam,
        .ps3d-lite .ps3d-cursor-card,
        .ps3d-lite .ps3d-core-bars span,
        .ps3d-lite .ps3d-core-screen i {
          animation: none !important;
        }
        .ps3d-lite .ps3d-aurora { filter: blur(28px); }

        /* Static mode — premium frozen frame, no animation, no parallax */
        .ps3d-static .ps3d-aurora,
        .ps3d-static .ps3d-scene,
        .ps3d-static .ps3d-core-wrap,
        .ps3d-static .ps3d-core::after,
        .ps3d-static .ps3d-orbit-inner,
        .ps3d-static .ps3d-orbit-outer,
        .ps3d-static .ps3d-source,
        .ps3d-static .ps3d-output,
        .ps3d-static .ps3d-beam,
        .ps3d-static .ps3d-cursor-card,
        .ps3d-static .ps3d-core-bars span,
        .ps3d-static .ps3d-core-screen i,
        .ps3d-static .ps3d-skeleton-orb {
          animation: none !important;
        }
        .ps3d-static .ps3d-scene {
          transform: rotateX(60deg) rotateZ(-18deg);
        }

        @media (max-width: 640px) {
          .ps3d-shell { min-height: 245px; }
          .ps3d-perspective { place-items: center; padding-bottom: 0; }
          .ps3d-scene { width: min(360px, 108%); transform: rotateX(63deg) rotateZ(-20deg) rotateY(var(--scene-ry)); }
          .ps3d-source { padding: 10px 12px; font-size: 10px; }
          .ps3d-output { width: 46px; height: 46px; border-radius: 17px; }
          .ps3d-core { border-radius: 23px; }
          .ps3d-core-chip { width: 44px; height: 44px; border-radius: 15px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ps3d-shell *,
          .ps3d-shell *::before,
          .ps3d-shell *::after {
            animation: none !important;
            transition: none !important;
          }
          .ps3d-skeleton { opacity: 0 !important; }
          .ps3d-perspective, .ps3d-aurora { opacity: 1 !important; }
          .ps3d-scene { transform: rotateX(60deg) rotateZ(-18deg) !important; }
        }
      `}</style>
    </div>
  );
}

export default PremiumHeroScene;
