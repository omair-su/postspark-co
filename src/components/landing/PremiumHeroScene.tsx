import { useEffect, useRef } from "react";
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

/**
 * Native premium 3D PostSpark hero visual.
 * No iframe, no external runtime, no screenshot fallback — just React + CSS 3D,
 * so it renders instantly in the preview and published app.
 */
export function PremiumHeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    let raf = 0;
    let rx = 0;
    let ry = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      tx = x * 7;
      ty = y * -6;
    };

    const loop = () => {
      rx += (ty - rx) * 0.07;
      ry += (tx - ry) * 0.07;
      sceneRef.current?.style.setProperty("--scene-rx", `${rx.toFixed(2)}deg`);
      sceneRef.current?.style.setProperty("--scene-ry", `${ry.toFixed(2)}deg`);
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ps3d-shell" aria-hidden="true">
      <div className="ps3d-aurora ps3d-aurora-one" />
      <div className="ps3d-aurora ps3d-aurora-two" />
      <div className="ps3d-perspective">
        <div ref={sceneRef} className="ps3d-scene">
          <div className="ps3d-orbit ps3d-orbit-outer" />
          <div className="ps3d-orbit ps3d-orbit-inner" />

          <div className="ps3d-core-wrap">
            <div className="ps3d-core-shadow" />
            <div className="ps3d-core">
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
          opacity: 0;
          animation: ps3d-fade 900ms ease-out 120ms forwards;
        }

        .ps3d-aurora {
          position: absolute;
          border-radius: 999px;
          filter: blur(28px);
          pointer-events: none;
        }

        .ps3d-aurora-one {
          width: 46%;
          aspect-ratio: 1;
          right: 19%;
          top: 18%;
          background: color-mix(in oklab, var(--electric) 42%, transparent);
          animation: ps3d-glow 5s ease-in-out infinite;
        }

        .ps3d-aurora-two {
          width: 34%;
          aspect-ratio: 1;
          right: 7%;
          bottom: 16%;
          background: color-mix(in oklab, oklch(0.82 0.16 190) 48%, transparent);
          animation: ps3d-glow 6s ease-in-out -1.5s infinite;
        }

        .ps3d-perspective {
          position: absolute;
          inset: 0;
          perspective: 1100px;
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

        .ps3d-orbit {
          position: absolute;
          inset: 11%;
          border: 1px solid color-mix(in oklab, var(--navy) 22%, transparent);
          border-radius: 42% 58% 48% 52%;
          transform: translateZ(-30px);
          box-shadow: inset 0 0 38px color-mix(in oklab, var(--electric) 17%, transparent);
        }

        .ps3d-orbit-inner {
          inset: 24%;
          border-color: color-mix(in oklab, var(--electric) 38%, transparent);
          animation: ps3d-spin 18s linear infinite reverse;
        }

        .ps3d-orbit-outer {
          animation: ps3d-spin 24s linear infinite;
        }

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
          background: color-mix(in oklab, var(--navy) 30%, transparent);
          filter: blur(24px);
        }

        .ps3d-core {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-rows: 34% 42% 24%;
          border-radius: 28px;
          overflow: hidden;
          transform-style: preserve-3d;
          transform: translateZ(84px);
          background: linear-gradient(145deg, color-mix(in oklab, var(--navy) 96%, white 4%), color-mix(in oklab, var(--electric) 45%, var(--navy)));
          border: 1px solid color-mix(in oklab, white 38%, transparent);
          box-shadow: 0 34px 80px color-mix(in oklab, var(--navy) 34%, transparent), inset 0 1px 0 color-mix(in oklab, white 45%, transparent);
        }

        .ps3d-core::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 12%, color-mix(in oklab, white 26%, transparent) 28%, transparent 44%);
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
          box-shadow: inset 0 0 0 1px color-mix(in oklab, white 24%, transparent), 0 0 24px color-mix(in oklab, var(--electric) 64%, transparent);
        }

        .ps3d-core-screen {
          margin: 0 15%;
          border-radius: 18px;
          background: color-mix(in oklab, white 88%, var(--surface));
          transform: translateZ(14px);
          box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--navy) 10%, transparent);
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
          background: color-mix(in oklab, var(--navy) 74%, transparent);
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

        .ps3d-core-base {
          gap: 10px;
          background: color-mix(in oklab, white 8%, transparent);
        }

        .ps3d-core-bars {
          display: flex;
          gap: 5px;
          align-items: end;
        }

        .ps3d-core-bars span {
          width: 5px;
          background: color-mix(in oklab, white 76%, var(--electric));
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
          background: color-mix(in oklab, white 70%, var(--surface));
          border: 1px solid color-mix(in oklab, var(--navy) 12%, white 38%);
          box-shadow: 0 18px 42px color-mix(in oklab, var(--navy) 18%, transparent), inset 0 1px 0 color-mix(in oklab, white 74%, transparent);
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
          background: linear-gradient(145deg, var(--electric), color-mix(in oklab, var(--navy) 72%, var(--electric)));
          border: 1px solid color-mix(in oklab, white 34%, transparent);
          box-shadow: 0 18px 38px color-mix(in oklab, var(--electric) 35%, transparent), inset 0 1px 0 color-mix(in oklab, white 38%, transparent);
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
          background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--electric) 70%, white), transparent);
          box-shadow: 0 0 18px color-mix(in oklab, var(--electric) 44%, transparent);
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

        .ps3d-cursor-card span {
          width: 36px;
          background: color-mix(in oklab, white 68%, transparent);
        }

        @keyframes ps3d-fade { to { opacity: 1; } }
        @keyframes ps3d-spin { to { transform: translateZ(-30px) rotate(360deg); } }
        @keyframes ps3d-glow { 0%, 100% { opacity: .65; transform: scale(.95); } 50% { opacity: 1; transform: scale(1.08); } }
        @keyframes ps3d-breathe { 0%, 100% { margin-top: 0; } 50% { margin-top: -18px; } }
        @keyframes ps3d-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -18px; } }
        @keyframes ps3d-sheen { 0%, 45% { transform: translateX(-90%); } 75%, 100% { transform: translateX(110%); } }
        @keyframes ps3d-pulse { 0%, 100% { opacity: .72; width: 36%; } 50% { opacity: 1; width: 56%; } }
        @keyframes ps3d-bars { 0%, 100% { scale: 1 .68; opacity: .7; } 50% { scale: 1 1.18; opacity: 1; } }
        @keyframes ps3d-cardfloat { 0%, 100% { margin-top: 0; } 50% { margin-top: -16px; } }
        @keyframes ps3d-pop { 0%, 100% { margin-top: 0; filter: saturate(1); } 50% { margin-top: -12px; filter: saturate(1.28); } }
        @keyframes ps3d-beam { 0%, 100% { opacity: .2; scale: .82 1; } 50% { opacity: .88; scale: 1.04 1; } }
        @keyframes ps3d-cursor { 0%, 100% { margin: 0; } 42% { margin: -20px 0 0 -18px; } 68% { margin: -2px 0 0 10px; } }

        @media (max-width: 640px) {
          .ps3d-shell { min-height: 560px; }
          .ps3d-perspective { place-items: end center; padding-bottom: 14px; }
          .ps3d-scene { width: 118%; transform: rotateX(63deg) rotateZ(-20deg) rotateY(var(--scene-ry)); }
          .ps3d-source { padding: 10px 12px; font-size: 10px; }
          .ps3d-output { width: 46px; height: 46px; border-radius: 17px; }
          .ps3d-core { border-radius: 23px; }
          .ps3d-core-chip { width: 44px; height: 44px; border-radius: 15px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ps3d-shell,
          .ps3d-aurora,
          .ps3d-scene,
          .ps3d-orbit,
          .ps3d-core-wrap,
          .ps3d-core::after,
          .ps3d-core-screen i,
          .ps3d-core-bars span,
          .ps3d-source,
          .ps3d-output,
          .ps3d-beam,
          .ps3d-cursor-card {
            animation: none !important;
          }

          .ps3d-shell { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default PremiumHeroScene;