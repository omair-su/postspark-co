import { useRef, useState, useCallback, useEffect } from "react";

type Asset = {
  platform: string;
  badge: string;
  label: string;
  text: string;
  accent: string;
};

const ASSETS: Asset[] = [
  {
    platform: "x",
    badge: "X · Thread",
    label: "Hook 01",
    text: "Most creators post more. Top creators post smarter. Here's the 4-step engine →",
    accent: "#22d3ee",
  },
  {
    platform: "in",
    badge: "LinkedIn",
    label: "Post",
    text: "I rewrote 12 months of content in one afternoon. The framework, free:",
    accent: "#60a5fa",
  },
  {
    platform: "@",
    badge: "Newsletter",
    label: "Subject",
    text: "Issue 24 — Why your best content is already written.",
    accent: "#fb7185",
  },
  {
    platform: "▶",
    badge: "Reel · Script",
    label: "00:00",
    text: "Stop writing content. Start engineering it. 3 rules →",
    accent: "#facc15",
  },
];

export function HeroCompareSlider() {
  const [pos, setPos] = useState(46);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const [autoplay, setAutoplay] = useState(true);

  const setClampedPos = useCallback((next: number) => {
    setPos(Math.max(6, Math.min(94, next)));
  }, []);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setClampedPos(((clientX - rect.left) / rect.width) * 100);
    },
    [setClampedPos],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = wrapRef.current;
      if (!el) return;
      setAutoplay(false);
      activePointer.current = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch {}
      updateFromClientX(e.clientX);
    },
    [updateFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointer.current !== e.pointerId) return;
      e.preventDefault();
      updateFromClientX(e.clientX);
    },
    [updateFromClientX],
  );

  const releasePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== e.pointerId) return;
    const el = wrapRef.current;
    try { el?.releasePointerCapture(e.pointerId); } catch {}
    activePointer.current = null;
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      setAutoplay(false);
      const big = e.shiftKey ? 12 : 4;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setClampedPos(pos - big); }
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setClampedPos(pos + big); }
      else if (e.key === "Home") { e.preventDefault(); setClampedPos(6); }
      else if (e.key === "End") { e.preventDefault(); setClampedPos(94); }
    },
    [pos, setClampedPos],
  );

  // Autoplay sweep — gives a "wow" first impression
  useEffect(() => {
    if (!autoplay) return;
    let raf = 0;
    let dir = 1;
    let cur = pos;
    const tick = () => {
      cur += dir * 0.25;
      if (cur >= 78) { cur = 78; dir = -1; }
      if (cur <= 22) { cur = 22; dir = 1; }
      setPos(cur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  useEffect(() => {
    const drop = () => { activePointer.current = null; };
    window.addEventListener("blur", drop);
    return () => window.removeEventListener("blur", drop);
  }, []);

  return (
    <section
      data-testid="hero-compare-slider"
      className="hcs-section relative isolate overflow-hidden py-24"
    >
      <div aria-hidden className="hcs-bg" />
      <div aria-hidden className="hcs-grid" />
      <div aria-hidden className="hcs-orb hcs-orb-a" />
      <div aria-hidden className="hcs-orb hcs-orb-b" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="hcs-chip">
            <span className="hcs-chip-dot" />
            Drag · Reveal · Transform
          </span>
          <h2 className="hcs-title mt-6">
            One blog in.{" "}
            <span className="hcs-title-grad">A full campaign out.</span>
          </h2>
          <p className="hcs-sub mx-auto mt-4 max-w-xl">
            A real-time view of the engine. Drag to peel back the source and reveal what gets generated.
          </p>
        </div>

        <div
          ref={wrapRef}
          data-testid="compare-track"
          data-position={Math.round(pos)}
          className="hcs-track relative mx-auto aspect-[16/10] w-full max-w-4xl select-none overflow-hidden rounded-[28px] outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/40"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onLostPointerCapture={releasePointer}
          onMouseEnter={() => setAutoplay(false)}
          role="slider"
          aria-label="Compare input vs AI output"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {/* LEFT — Source code editor look */}
          <div className="hcs-pane hcs-left">
            <div className="hcs-window">
              <div className="hcs-window-bar">
                <span className="hcs-dot" style={{ background: "#ff5f57" }} />
                <span className="hcs-dot" style={{ background: "#febc2e" }} />
                <span className="hcs-dot" style={{ background: "#28c840" }} />
                <span className="hcs-file">repurposing-playbook.md</span>
              </div>
              <div className="hcs-editor">
                <ol className="hcs-lines">
                  {[
                    ["#", "# The Repurposing Playbook"],
                    ["", ""],
                    ["##", "## Why your best content is already written"],
                    ["", "You don't have a content problem. You have a"],
                    ["", "distribution problem. The asset already exists —"],
                    ["", "it just hasn't been translated for the channel."],
                    ["", ""],
                    ["##", "## The 4-step engine"],
                    ["1.", "Extract the spine of the argument"],
                    ["2.", "Recompose for each platform's grammar"],
                    ["3.", "Test 3 hooks per asset"],
                    ["4.", "Ship, measure, iterate"],
                  ].map(([sym, t], i) => (
                    <li key={i}>
                      <span className="hcs-ln">{String(i + 1).padStart(2, "0")}</span>
                      <span className="hcs-tk">{sym}</span>
                      <span className="hcs-tx">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <span className="hcs-badge hcs-badge-left">Source · Markdown</span>
          </div>

          {/* RIGHT — Generated multi-asset workspace */}
          <div
            className="hcs-pane hcs-right"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            <div className="hcs-right-bg" />
            <div className="hcs-flow" aria-hidden>
              <svg viewBox="0 0 600 400" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="flowG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity=".0" />
                    <stop offset="50%" stopColor="#a78bfa" stopOpacity=".7" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity=".0" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 6 }).map((_, i) => (
                  <path
                    key={i}
                    d={`M0 ${60 + i * 50} C 200 ${20 + i * 50}, 400 ${120 + i * 30}, 600 ${80 + i * 40}`}
                    stroke="url(#flowG)"
                    strokeWidth="1"
                    fill="none"
                  />
                ))}
              </svg>
            </div>

            <div className="hcs-stack">
              <div className="hcs-header">
                <div className="hcs-header-l">
                  <span className="hcs-live"><span /> generating</span>
                  <span className="hcs-meta">17 assets · 4 channels</span>
                </div>
                <div className="hcs-progress">
                  <div className="hcs-progress-bar" />
                </div>
              </div>

              <div className="hcs-cards">
                {ASSETS.map((a, i) => (
                  <article
                    key={a.label + i}
                    className="hcs-asset"
                    style={
                      {
                        "--accent": a.accent,
                        animationDelay: `${i * 140}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="hcs-asset-top">
                      <span className="hcs-plat">{a.platform}</span>
                      <div className="hcs-asset-meta">
                        <div className="hcs-asset-badge">{a.badge}</div>
                        <div className="hcs-asset-label">{a.label}</div>
                      </div>
                      <span className="hcs-asset-ok">✓</span>
                    </div>
                    <p className="hcs-asset-text">{a.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <span className="hcs-badge hcs-badge-right">Generated · Live</span>
          </div>

          {/* Divider + glow */}
          <div className="hcs-divider" style={{ left: `${pos}%` }}>
            <div className="hcs-divider-glow" />
          </div>

          {/* Handle */}
          <div
            aria-hidden
            className="hcs-handle"
            style={{ left: `${pos}%` }}
          >
            <div className="hcs-handle-ring" />
            <div className="hcs-handle-core">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6 L3 12 L9 18" />
                <path d="M15 6 L21 12 L15 18" />
              </svg>
            </div>
          </div>

          {/* corner labels */}
          <span className="hcs-corner hcs-corner-tl">Before</span>
          <span className="hcs-corner hcs-corner-tr">After</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/55">
          <span className="hcs-key">←</span>
          <span>Drag · or use arrows</span>
          <span className="hcs-key">→</span>
        </div>
      </div>

      <style>{`
        .hcs-section {
          background:
            radial-gradient(120% 80% at 50% 0%, #0a1126 0%, #060919 55%, #04060f 100%);
          color: #e7ecff;
        }
        .hcs-bg {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(50% 35% at 15% 25%, rgba(34,211,238,0.18), transparent 70%),
            radial-gradient(50% 35% at 85% 70%, rgba(167,139,250,0.18), transparent 70%);
        }
        .hcs-grid {
          position:absolute; inset:0; pointer-events:none; opacity:.45;
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(70% 60% at 50% 40%, #000 40%, transparent 100%);
        }
        .hcs-orb { position:absolute; border-radius:9999px; filter:blur(70px); opacity:.55; pointer-events:none; }
        .hcs-orb-a { width:360px; height:360px; left:-60px; top:0; background: radial-gradient(closest-side, rgba(34,211,238,0.55), transparent 70%); }
        .hcs-orb-b { width:340px; height:340px; right:-60px; bottom:-40px; background: radial-gradient(closest-side, rgba(167,139,250,0.55), transparent 70%); }

        .hcs-chip {
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.4rem .85rem; border-radius:9999px;
          background: rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          font-size:.72rem; letter-spacing:.2em; text-transform:uppercase;
          color: rgba(231,236,255,0.85);
        }
        .hcs-chip-dot { width:6px; height:6px; border-radius:9999px; background:#22d3ee; box-shadow:0 0 12px #22d3ee; }
        .hcs-title {
          font-family: "Instrument Serif", "Times New Roman", serif;
          font-weight: 400;
          font-size: clamp(1.9rem, 4.4vw, 3rem);
          line-height: 1.05; letter-spacing: -0.01em;
        }
        .hcs-title-grad {
          background: linear-gradient(100deg, #22d3ee, #a78bfa 55%, #fb7185);
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hcs-sub { color: rgba(231,236,255,0.65); font-size:1rem; }

        .hcs-track {
          background: #0a0d1f;
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow:
            0 60px 120px -40px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 0 80px rgba(34,211,238,0.06) inset;
        }
        .hcs-pane { position:absolute; inset:0; }

        /* LEFT */
        .hcs-left { background: linear-gradient(180deg, #0e1230, #0a0d24); padding: 18px; }
        .hcs-window {
          height:100%; width:100%; border-radius: 16px; overflow:hidden;
          background: linear-gradient(180deg, #0b0e22, #080b1c);
          border:1px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          display:flex; flex-direction:column;
        }
        .hcs-window-bar {
          display:flex; align-items:center; gap:6px;
          padding: 10px 14px;
          background: linear-gradient(180deg, #11152c, #0b0e22);
          border-bottom:1px solid rgba(255,255,255,0.07);
        }
        .hcs-dot { width:10px; height:10px; border-radius:9999px; display:inline-block; }
        .hcs-file { margin-left: 10px; font-size:.7rem; color: rgba(231,236,255,0.55); font-family: ui-monospace, monospace; }
        .hcs-editor { padding: 14px 12px; overflow:hidden; flex:1; }
        .hcs-lines { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.7; }
        .hcs-lines li { display:grid; grid-template-columns: 30px 28px 1fr; align-items:baseline; color:#cdd6ff; }
        .hcs-ln { color: rgba(231,236,255,0.28); text-align:right; padding-right:10px; }
        .hcs-tk { color: #a78bfa; }
        .hcs-tx { color: #e7ecff; opacity:.9; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }

        /* RIGHT */
        .hcs-right { padding: 0; }
        .hcs-right-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(70% 60% at 30% 20%, rgba(34,211,238,0.20), transparent 70%),
            radial-gradient(70% 60% at 80% 80%, rgba(251,113,133,0.18), transparent 70%),
            linear-gradient(135deg, #0a0d24 0%, #131736 60%, #1b1042 100%);
        }
        .hcs-flow { position:absolute; inset:0; opacity:.55; mix-blend-mode: screen; }
        .hcs-flow svg { width:100%; height:100%; }
        .hcs-stack { position:absolute; inset:0; padding: 18px; display:flex; flex-direction:column; gap:12px; }
        .hcs-header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .hcs-header-l { display:flex; align-items:center; gap:10px; }
        .hcs-live {
          display:inline-flex; align-items:center; gap:.45rem;
          font-size:.62rem; letter-spacing:.22em; text-transform:uppercase;
          padding:.3rem .55rem; border-radius:9999px;
          background: rgba(34,197,94,0.14); color:#86efac;
          border:1px solid rgba(34,197,94,0.28);
        }
        .hcs-live span { width:6px; height:6px; border-radius:9999px; background:#22c55e; box-shadow:0 0 10px #22c55e; animation: hcsBlink 1.2s ease-in-out infinite; }
        .hcs-meta { font-size:.7rem; letter-spacing:.18em; text-transform:uppercase; color: rgba(231,236,255,0.65); }
        .hcs-progress {
          width: 120px; height: 4px; border-radius: 9999px;
          background: rgba(255,255,255,0.08); overflow:hidden;
        }
        .hcs-progress-bar {
          height:100%; width: 60%;
          background: linear-gradient(90deg, #22d3ee, #a78bfa, #fb7185);
          animation: hcsProg 2.4s ease-in-out infinite;
        }

        .hcs-cards { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; flex:1; min-height:0; }
        .hcs-asset {
          position:relative; overflow:hidden;
          border-radius: 14px; padding: 12px;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border:1px solid color-mix(in oklab, var(--accent) 28%, rgba(255,255,255,0.10));
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px -24px color-mix(in oklab, var(--accent) 60%, transparent);
          opacity:0; transform: translateY(10px) scale(.98);
          animation: hcsPop .6s cubic-bezier(.2,.8,.2,1) forwards;
        }
        .hcs-asset-top { display:grid; grid-template-columns: 30px 1fr 18px; align-items:center; gap:8px; }
        .hcs-plat {
          width:30px; height:30px; border-radius:9px;
          display:inline-flex; align-items:center; justify-content:center;
          background: color-mix(in oklab, var(--accent) 22%, transparent);
          color: var(--accent);
          font-family: ui-monospace, monospace; font-weight:700;
          border:1px solid color-mix(in oklab, var(--accent) 40%, transparent);
        }
        .hcs-asset-meta { min-width:0; }
        .hcs-asset-badge { font-size:.62rem; letter-spacing:.2em; text-transform:uppercase; color: rgba(231,236,255,0.7); }
        .hcs-asset-label { font-size:.72rem; color: var(--accent); font-weight:600; }
        .hcs-asset-ok {
          font-size:.7rem; color:#86efac;
          display:inline-flex; align-items:center; justify-content:center;
          width:18px; height:18px; border-radius:9999px;
          background: rgba(34,197,94,0.18); border:1px solid rgba(34,197,94,0.35);
        }
        .hcs-asset-text {
          margin-top: 8px; font-size: .8rem; line-height: 1.35; color:#fff; opacity:.92;
          display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;
        }

        /* Divider */
        .hcs-divider {
          position:absolute; inset-block:0; z-index: 10;
          width: 2px; transform: translateX(-1px);
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.9) 80%, transparent);
        }
        .hcs-divider-glow {
          position:absolute; inset-block:-10%; left:50%; transform:translateX(-50%);
          width: 14px; border-radius: 9999px;
          background: radial-gradient(closest-side, rgba(34,211,238,0.7), transparent 70%);
          filter: blur(6px);
        }
        .hcs-handle {
          position:absolute; top:50%; z-index: 20;
          transform: translate(-50%, -50%);
          width: 56px; height: 56px; border-radius:9999px;
          display:flex; align-items:center; justify-content:center;
          pointer-events: none;
        }
        .hcs-handle-ring {
          position:absolute; inset:-6px; border-radius:9999px;
          border:1px solid rgba(34,211,238,0.45);
          animation: hcsHandleRing 2.4s ease-out infinite;
        }
        .hcs-handle-core {
          width: 48px; height: 48px; border-radius:9999px;
          display:flex; align-items:center; justify-content:center;
          background:
            radial-gradient(closest-side, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 70%),
            conic-gradient(from 0deg, #22d3ee, #a78bfa, #fb7185, #22d3ee);
          box-shadow: 0 18px 40px -10px rgba(0,0,0,0.55), 0 0 30px rgba(167,139,250,0.45), inset 0 0 14px rgba(255,255,255,0.18);
          color: #0a0d24;
        }

        /* Corner labels */
        .hcs-corner {
          position:absolute; top: 16px; z-index: 12;
          font-size:.62rem; letter-spacing:.24em; text-transform:uppercase;
          padding:.35rem .65rem; border-radius:9999px;
          backdrop-filter: blur(8px);
        }
        .hcs-corner-tl { left: 16px; background: rgba(255,255,255,0.9); color:#0a0d24; }
        .hcs-corner-tr { right: 16px; background: rgba(255,255,255,0.12); color:#fff; border:1px solid rgba(255,255,255,0.18); }
        .hcs-badge {
          position:absolute; bottom: 14px;
          font-size:.62rem; letter-spacing:.22em; text-transform:uppercase;
          padding:.3rem .6rem; border-radius:9999px;
          backdrop-filter: blur(8px);
        }
        .hcs-badge-left { left: 32px; background: rgba(167,139,250,0.18); color:#c4b5fd; border:1px solid rgba(167,139,250,0.3); }
        .hcs-badge-right { right: 18px; background: rgba(34,211,238,0.18); color:#7dd3fc; border:1px solid rgba(34,211,238,0.3); }

        .hcs-key {
          display:inline-flex; align-items:center; justify-content:center;
          min-width: 22px; height: 22px; padding: 0 6px;
          border-radius: 6px; background: rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.14); color:#fff;
          font-family: ui-monospace, monospace;
        }

        @keyframes hcsBlink { 0%,100%{ opacity:1 } 50%{ opacity:.35 } }
        @keyframes hcsProg { 0%{ transform: translateX(-100%) } 100%{ transform: translateX(180%) } }
        @keyframes hcsPop { to { opacity:1; transform: translateY(0) scale(1) } }
        @keyframes hcsHandleRing { 0%{ transform: scale(.85); opacity:.9 } 100%{ transform: scale(1.6); opacity:0 } }

        @media (max-width: 640px) {
          .hcs-cards { grid-template-columns: 1fr; }
          .hcs-asset-text { -webkit-line-clamp:2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hcs-handle-ring, .hcs-progress-bar, .hcs-live span { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
