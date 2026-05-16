import { useEffect, useRef, useState } from "react";

type Output = {
  label: string;
  count: string;
  platform: string;
  accent: string;
  glow: string;
  preview: string;
  metric: string;
};

const outputs: Output[] = [
  {
    label: "Twitter / X Thread",
    count: "10",
    platform: "x",
    accent: "#22d3ee",
    glow: "rgba(34,211,238,0.35)",
    preview: "The 3 mistakes killing your content reach in 2026 →",
    metric: "+312% reach",
  },
  {
    label: "LinkedIn Posts",
    count: "05",
    platform: "in",
    accent: "#60a5fa",
    glow: "rgba(96,165,250,0.35)",
    preview: "I analyzed 1,200 viral posts. Here's the pattern nobody talks about.",
    metric: "+184% engagement",
  },
  {
    label: "Email Newsletter",
    count: "01",
    platform: "@",
    accent: "#fb7185",
    glow: "rgba(251,113,133,0.35)",
    preview: "Issue 24 — The Repurposing Playbook",
    metric: "47% open rate",
  },
  {
    label: "Short-form Script",
    count: "01",
    platform: "▶",
    accent: "#facc15",
    glow: "rgba(250,204,21,0.40)",
    preview: "Hook: \"Stop writing content. Start engineering it.\"",
    metric: "Avg. 38s watch",
  },
];

export function BeforeAfterSection() {
  const [active, setActive] = useState(0);
  const [transformed, setTransformed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Cycle through outputs to feel "alive"
  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % outputs.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  // Trigger transformation on scroll-in
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTransformed(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="ba-section relative isolate overflow-hidden py-28"
    >
      {/* Layered background */}
      <div aria-hidden className="ba-bg" />
      <div aria-hidden className="ba-grid" />
      <div aria-hidden className="ba-orb ba-orb-a" />
      <div aria-hidden className="ba-orb ba-orb-b" />
      <div aria-hidden className="ba-orb ba-orb-c" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="ba-chip">
            <span className="ba-chip-dot" />
            Live Transformation
          </span>
          <h2 className="ba-title mt-6">
            One input.{" "}
            <span className="ba-title-grad">An entire content engine.</span>
          </h2>
          <p className="ba-sub mx-auto mt-4 max-w-xl">
            Watch a single blog post unfold into a multi-channel campaign in real time.
          </p>
        </div>

        {/* Stage */}
        <div className="ba-stage mt-16 grid items-stretch gap-10 lg:grid-cols-[1fr_auto_1.35fr]">
          {/* INPUT */}
          <div className={`ba-panel ba-input ${transformed ? "is-on" : ""}`}>
            <div className="ba-panel-label">
              <span className="ba-pulse" />
              Source · Markdown
            </div>
            <div className="ba-doc">
              <div className="ba-doc-title">The Repurposing Playbook</div>
              <div className="ba-doc-meta">1,248 words · 8 min read</div>
              <div className="ba-doc-lines">
                <div className="ba-line w-[94%]" />
                <div className="ba-line w-[88%]" />
                <div className="ba-line w-[72%]" />
                <div className="ba-line w-[90%]" />
                <div className="ba-line w-[64%]" />
                <div className="ba-line w-[82%]" />
                <div className="ba-line w-[58%]" />
              </div>
              <div className="ba-doc-foot">
                <span className="ba-tag">/blog</span>
                <span className="ba-tag ba-tag-alt">draft</span>
              </div>
            </div>
          </div>

          {/* CORE / connector */}
          <div className="ba-core">
            <div className="ba-rings">
              <div className="ba-ring" />
              <div className="ba-ring ba-ring-2" />
              <div className="ba-ring ba-ring-3" />
            </div>
            <div className="ba-core-disc">
              <svg viewBox="0 0 24 24" className="ba-spark" fill="none">
                <path
                  d="M12 2 14.6 9.4 22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"
                  fill="url(#sparkG)"
                />
                <defs>
                  <linearGradient id="sparkG" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="55%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="ba-core-cap">Neural Repurpose v4</div>

            {/* connector beams */}
            <svg className="ba-beams" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="beamL" x1="0" y1="50" x2="100" y2="50">
                  <stop offset="0%" stopColor="rgba(167,139,250,0)" />
                  <stop offset="100%" stopColor="rgba(167,139,250,0.9)" />
                </linearGradient>
                <linearGradient id="beamR" x1="0" y1="50" x2="100" y2="50">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.9)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
              </defs>
              <line x1="0" y1="50" x2="50" y2="50" stroke="url(#beamL)" strokeWidth="0.6" />
              <line x1="50" y1="50" x2="100" y2="50" stroke="url(#beamR)" strokeWidth="0.6" />
            </svg>
          </div>

          {/* OUTPUTS */}
          <div className="ba-outputs">
            <div className="ba-outputs-head">
              <span className="ba-outputs-label">Generated · 17 assets</span>
              <span className="ba-outputs-live">
                <span className="ba-live-dot" /> streaming
              </span>
            </div>

            <div className="ba-grid-cards">
              {outputs.map((o, i) => (
                <article
                  key={o.label}
                  className={`ba-card ${active === i ? "is-active" : ""} ${
                    transformed ? "is-on" : ""
                  }`}
                  style={
                    {
                      "--accent": o.accent,
                      "--glow": o.glow,
                      animationDelay: `${i * 120 + 120}ms`,
                    } as React.CSSProperties
                  }
                >
                  <div className="ba-card-top">
                    <span className="ba-platform" aria-hidden>
                      {o.platform}
                    </span>
                    <span className="ba-count">{o.count}</span>
                  </div>
                  <div className="ba-card-label">{o.label}</div>
                  <p className="ba-card-preview">{o.preview}</p>
                  <div className="ba-card-foot">
                    <div className="ba-bars">
                      <span /><span /><span /><span /><span />
                    </div>
                    <span className="ba-metric">{o.metric}</span>
                  </div>
                  <div className="ba-card-sheen" aria-hidden />
                </article>
              ))}
            </div>

            <div className="ba-foot-row">
              <div className="ba-stat">
                <div className="ba-stat-n">8.2s</div>
                <div className="ba-stat-l">avg generation</div>
              </div>
              <div className="ba-stat">
                <div className="ba-stat-n">17×</div>
                <div className="ba-stat-l">content multiplier</div>
              </div>
              <div className="ba-stat">
                <div className="ba-stat-n">100%</div>
                <div className="ba-stat-l">on-brand voice</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ba-section {
          background:
            radial-gradient(120% 80% at 50% 0%, #0b1024 0%, #070a1a 55%, #05060f 100%);
          color: #e7ecff;
        }
        .ba-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(60% 40% at 20% 20%, rgba(99,102,241,0.18), transparent 70%),
            radial-gradient(50% 35% at 85% 75%, rgba(34,211,238,0.16), transparent 70%),
            radial-gradient(40% 30% at 50% 100%, rgba(251,113,133,0.14), transparent 70%);
          pointer-events: none;
        }
        .ba-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(80% 60% at 50% 40%, #000 40%, transparent 100%);
          opacity: .55;
          pointer-events: none;
        }
        .ba-orb { position:absolute; border-radius:9999px; filter: blur(60px); opacity:.55; pointer-events:none; }
        .ba-orb-a { width:380px; height:380px; left:-80px; top:-60px; background: radial-gradient(closest-side, rgba(99,102,241,0.55), transparent 70%); animation: baFloat 14s ease-in-out infinite; }
        .ba-orb-b { width:320px; height:320px; right:-60px; bottom:-40px; background: radial-gradient(closest-side, rgba(34,211,238,0.55), transparent 70%); animation: baFloat 17s ease-in-out infinite reverse; }
        .ba-orb-c { width:260px; height:260px; left:50%; top:60%; transform: translate(-50%, -50%); background: radial-gradient(closest-side, rgba(251,113,133,0.45), transparent 70%); animation: baFloat 19s ease-in-out infinite; }

        .ba-chip {
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.4rem .85rem; border-radius:9999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          font-size:.72rem; letter-spacing:.2em; text-transform:uppercase;
          color: rgba(231,236,255,0.85);
        }
        .ba-chip-dot { width:6px; height:6px; border-radius:9999px; background:#22d3ee; box-shadow:0 0 12px #22d3ee; }
        .ba-title {
          font-family: "Instrument Serif", "Times New Roman", serif;
          font-weight: 400;
          font-size: clamp(2rem, 4.8vw, 3.4rem);
          line-height: 1.05;
          letter-spacing: -0.01em;
        }
        .ba-title-grad {
          background: linear-gradient(100deg, #a78bfa 0%, #22d3ee 45%, #fb7185 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .ba-sub { color: rgba(231,236,255,0.65); font-size: 1rem; }

        /* INPUT */
        .ba-panel {
          position:relative;
          border-radius: 22px;
          padding: 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 30px 80px -40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(14px);
          min-height: 360px;
          opacity: 0; transform: translateY(14px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .ba-panel.is-on { opacity:1; transform: translateY(0); }
        .ba-panel-label {
          display:flex; align-items:center; gap:.5rem;
          font-size:.7rem; letter-spacing:.22em; text-transform:uppercase;
          color: rgba(231,236,255,0.65);
        }
        .ba-pulse { width:8px; height:8px; border-radius:9999px; background:#a78bfa; box-shadow:0 0 10px #a78bfa; animation: baBlink 1.4s ease-in-out infinite; }
        .ba-doc { margin-top:14px; }
        .ba-doc-title { font-weight:600; font-size:1.05rem; color:#fff; }
        .ba-doc-meta { font-size:.75rem; color: rgba(231,236,255,0.55); margin-top:2px; }
        .ba-doc-lines { margin-top:18px; display:flex; flex-direction:column; gap:9px; }
        .ba-line {
          height:8px; border-radius:6px;
          background: linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
          position:relative; overflow:hidden;
        }
        .ba-line::after {
          content:""; position:absolute; inset:0;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.45), transparent);
          transform: translateX(-100%);
          animation: baSweep 3.4s ease-in-out infinite;
        }
        .ba-doc-lines .ba-line:nth-child(2)::after { animation-delay:.4s }
        .ba-doc-lines .ba-line:nth-child(3)::after { animation-delay:.8s }
        .ba-doc-lines .ba-line:nth-child(4)::after { animation-delay:1.2s }
        .ba-doc-lines .ba-line:nth-child(5)::after { animation-delay:1.6s }
        .ba-doc-lines .ba-line:nth-child(6)::after { animation-delay:2.0s }
        .ba-doc-lines .ba-line:nth-child(7)::after { animation-delay:2.4s }
        .ba-doc-foot { margin-top:18px; display:flex; gap:8px; }
        .ba-tag {
          font-size:.65rem; letter-spacing:.18em; text-transform:uppercase;
          padding:.3rem .6rem; border-radius:6px;
          background: rgba(167,139,250,0.15); color:#c4b5fd;
          border:1px solid rgba(167,139,250,0.25);
        }
        .ba-tag-alt { background: rgba(34,211,238,0.12); color:#7dd3fc; border-color: rgba(34,211,238,0.25); }

        /* CORE */
        .ba-core {
          position:relative;
          width: 140px; height: 100%;
          display:flex; align-items:center; justify-content:center;
          margin: 0 auto;
        }
        .ba-rings { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
        .ba-ring {
          position:absolute; width:110px; height:110px; border-radius:9999px;
          border:1px solid rgba(167,139,250,0.35);
          animation: baRing 3.2s ease-out infinite;
        }
        .ba-ring-2 { animation-delay: 1.0s; border-color: rgba(34,211,238,0.35); }
        .ba-ring-3 { animation-delay: 2.0s; border-color: rgba(251,113,133,0.35); }
        .ba-core-disc {
          position:relative; width:84px; height:84px; border-radius:9999px;
          display:flex; align-items:center; justify-content:center;
          background:
            radial-gradient(closest-side, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 70%),
            conic-gradient(from 0deg, #22d3ee, #a78bfa, #fb7185, #facc15, #22d3ee);
          box-shadow: 0 0 40px rgba(167,139,250,0.45), inset 0 0 20px rgba(255,255,255,0.15);
          animation: baSpin 14s linear infinite;
        }
        .ba-spark { width: 38px; height: 38px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45)); }
        .ba-core-cap {
          position:absolute; bottom: 8%; left:50%; transform:translateX(-50%);
          font-size:.6rem; letter-spacing:.22em; text-transform:uppercase;
          color: rgba(231,236,255,0.7); white-space: nowrap;
        }
        .ba-beams {
          position:absolute; inset:0; width:100%; height:100%; z-index:-1;
        }
        @media (max-width: 1023px) {
          .ba-core { width:100%; height: 90px; }
          .ba-beams { display:none; }
        }

        /* OUTPUTS */
        .ba-outputs { display:flex; flex-direction:column; gap:14px; }
        .ba-outputs-head { display:flex; align-items:center; justify-content:space-between; }
        .ba-outputs-label { font-size:.7rem; letter-spacing:.22em; text-transform:uppercase; color: rgba(231,236,255,0.7); }
        .ba-outputs-live {
          display:inline-flex; align-items:center; gap:.45rem;
          font-size:.65rem; letter-spacing:.2em; text-transform:uppercase;
          padding:.3rem .6rem; border-radius:9999px;
          background: rgba(34,197,94,0.12); color:#86efac;
          border:1px solid rgba(34,197,94,0.25);
        }
        .ba-live-dot { width:6px; height:6px; border-radius:9999px; background:#22c55e; box-shadow:0 0 10px #22c55e; animation: baBlink 1.2s ease-in-out infinite; }

        .ba-grid-cards { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px; }
        .ba-card {
          position:relative; overflow:hidden;
          border-radius:18px; padding:16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border:1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(14px);
          opacity:0; transform: translateY(16px);
          animation: baRise .7s ease-out both;
          transition: transform .4s ease, border-color .4s ease, box-shadow .4s ease;
        }
        .ba-card.is-on { opacity:1; }
        .ba-card:hover { transform: translateY(-4px); border-color: color-mix(in oklab, var(--accent) 60%, transparent); box-shadow: 0 24px 50px -28px var(--glow); }
        .ba-card.is-active {
          border-color: color-mix(in oklab, var(--accent) 70%, transparent);
          box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 35%, transparent), 0 30px 60px -30px var(--glow);
        }
        .ba-card-top { display:flex; align-items:center; justify-content:space-between; }
        .ba-platform {
          display:inline-flex; align-items:center; justify-content:center;
          width:32px; height:32px; border-radius:10px;
          background: color-mix(in oklab, var(--accent) 18%, transparent);
          color: var(--accent);
          font-weight:700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          border: 1px solid color-mix(in oklab, var(--accent) 35%, transparent);
        }
        .ba-count { font-family: "Instrument Serif", serif; font-size:1.6rem; color:#fff; opacity:.9; }
        .ba-card-label { margin-top:10px; font-size:.78rem; letter-spacing:.16em; text-transform:uppercase; color: rgba(231,236,255,0.75); }
        .ba-card-preview { margin-top:6px; font-size:.85rem; line-height:1.35; color:#fff; opacity:.92; min-height:38px; }
        .ba-card-foot { margin-top:12px; display:flex; align-items:center; justify-content:space-between; }
        .ba-bars { display:flex; gap:3px; align-items:end; height:18px; }
        .ba-bars span {
          width:4px; border-radius:2px;
          background: color-mix(in oklab, var(--accent) 80%, white 0%);
          animation: baBar 1.6s ease-in-out infinite;
        }
        .ba-bars span:nth-child(1){ height:40%; animation-delay:.0s }
        .ba-bars span:nth-child(2){ height:70%; animation-delay:.15s }
        .ba-bars span:nth-child(3){ height:55%; animation-delay:.30s }
        .ba-bars span:nth-child(4){ height:90%; animation-delay:.45s }
        .ba-bars span:nth-child(5){ height:60%; animation-delay:.60s }
        .ba-metric { font-size:.7rem; color: var(--accent); font-weight:600; }
        .ba-card-sheen {
          position:absolute; inset:0; pointer-events:none;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform .9s ease;
        }
        .ba-card:hover .ba-card-sheen, .ba-card.is-active .ba-card-sheen { transform: translateX(100%); }

        .ba-foot-row {
          margin-top: 6px;
          display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .ba-stat { text-align:center; }
        .ba-stat-n {
          font-family: "Instrument Serif", serif; font-size: 1.4rem;
          background: linear-gradient(100deg, #a78bfa, #22d3ee);
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .ba-stat-l { font-size:.65rem; letter-spacing:.18em; text-transform:uppercase; color: rgba(231,236,255,0.6); }

        @keyframes baFloat { 0%,100%{ transform: translate3d(0,0,0) } 50%{ transform: translate3d(0,-22px,0) } }
        @keyframes baBlink { 0%,100%{ opacity:1 } 50%{ opacity:.35 } }
        @keyframes baSweep { 0%{ transform: translateX(-100%) } 60%,100%{ transform: translateX(100%) } }
        @keyframes baSpin { to { transform: rotate(360deg) } }
        @keyframes baRing { 0%{ transform: scale(.6); opacity:.9 } 100%{ transform: scale(1.5); opacity:0 } }
        @keyframes baRise { from { opacity:0; transform: translateY(16px) } to { opacity:1; transform: translateY(0) } }
        @keyframes baBar { 0%,100%{ transform: scaleY(.6) } 50%{ transform: scaleY(1) } }

        @media (prefers-reduced-motion: reduce) {
          .ba-orb, .ba-ring, .ba-core-disc, .ba-line::after, .ba-bars span, .ba-pulse, .ba-live-dot { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
