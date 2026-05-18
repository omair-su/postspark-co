import { useEffect, useRef, useState } from "react";
import { Twitter, Linkedin, Mail, Play, Sparkles } from "lucide-react";

type Output = {
  label: string;
  count: string;
  Icon: typeof Twitter;
  accent: string;
  preview: string;
  metric: string;
};

const outputs: Output[] = [
  {
    label: "Twitter / X Thread",
    count: "10",
    Icon: Twitter,
    accent: "#7c3aed",
    preview: "The 3 mistakes killing your content reach in 2026 →",
    metric: "+312% reach",
  },
  {
    label: "LinkedIn Posts",
    count: "05",
    Icon: Linkedin,
    accent: "#4c1d95",
    preview: "I analyzed 1,200 viral posts. Here's the pattern nobody talks about.",
    metric: "+184% engagement",
  },
  {
    label: "Email Newsletter",
    count: "01",
    Icon: Mail,
    accent: "#e85d3a",
    preview: "Issue 24 — The Repurposing Playbook",
    metric: "47% open rate",
  },
  {
    label: "Short-form Script",
    count: "01",
    Icon: Play,
    accent: "#b45309",
    preview: 'Hook: "Stop writing content. Start engineering it."',
    metric: "Avg. 38s watch",
  },
];

export function BeforeAfterSection() {
  const [active, setActive] = useState(0);
  const [transformed, setTransformed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % outputs.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

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
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="ba-section relative isolate overflow-hidden cream-surface-alt py-28"
    >
      <div className="cream-grain" aria-hidden />
      <div aria-hidden className="ba-orb ba-orb-a" />
      <div aria-hidden className="ba-orb ba-orb-b" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="luxury-chip">
            <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" />
            Live Transformation
          </span>
          <h2
            className="mt-6 font-extrabold tracking-[-0.04em] text-[#1a1a2e]"
            style={{
              fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              lineHeight: 1.02,
            }}
          >
            One input.{" "}
            <span className="luxury-gradient-text">An entire content engine.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#1a1a2e]/65">
            Watch a single blog post unfold into a multi-channel campaign in real time.
          </p>
        </div>

        {/* Stage */}
        <div className="ba-stage mt-16 grid items-stretch gap-8 lg:grid-cols-[1.05fr_auto_1.35fr]">
          {/* INPUT */}
          <div className={`luxury-card ba-panel ${transformed ? "is-on" : ""}`}>
            <div className="ba-panel-head">
              <div className="ba-panel-label">
                <span className="ba-pulse" />
                Source · Markdown
              </div>
              <div className="ba-traffic" aria-hidden>
                <span /><span /><span />
              </div>
            </div>
            <div className="ba-doc">
              <div className="ba-doc-title">The Repurposing Playbook</div>
              <div className="ba-doc-meta">1,248 words · 8 min read</div>
              <pre className="ba-doc-md">
                <code>
                  <span className="ba-md-h"># The Repurposing Playbook</span>{"\n"}
                  <span className="ba-md-mute">_Last updated · May 18, 2026_</span>{"\n\n"}
                  <span className="ba-md-h2">## Why most creators burn out</span>{"\n"}
                  Writing one great post a week is hard. Writing thirty is{" "}
                  <span className="ba-md-em">impossible</span> — unless you{"\n"}
                  stop creating from scratch every time.{"\n\n"}
                  <span className="ba-md-h2">## The 3-step engine</span>{"\n"}
                  <span className="ba-md-li">1. Capture one deep idea (blog, talk, podcast).</span>{"\n"}
                  <span className="ba-md-li">2. Atomize it into hooks, threads, carousels.</span>{"\n"}
                  <span className="ba-md-li">3. Distribute on autopilot in your voice.</span>{"\n\n"}
                  <span className="ba-md-quote">&gt; "Your best ideas deserve more than one tweet."</span>
                </code>
              </pre>
              <div className="ba-doc-foot">
                <span className="ba-tag">/blog</span>
                <span className="ba-tag ba-tag-alt">draft</span>
                <span className="ba-tag ba-tag-mute">5 min ago</span>
              </div>
            </div>
          </div>

          {/* CORE */}
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
                    <stop offset="0%" stopColor="#f5d7b6" />
                    <stop offset="55%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="ba-core-cap">Neural Repurpose v4</div>

            <svg className="ba-beams" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="beamL" x1="0" y1="50" x2="100" y2="50">
                  <stop offset="0%" stopColor="rgba(124,58,237,0)" />
                  <stop offset="100%" stopColor="rgba(124,58,237,0.7)" />
                </linearGradient>
                <linearGradient id="beamR" x1="0" y1="50" x2="100" y2="50">
                  <stop offset="0%" stopColor="rgba(232,93,58,0.7)" />
                  <stop offset="100%" stopColor="rgba(232,93,58,0)" />
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
                  className={`luxury-card ba-card ${active === i ? "is-active" : ""} ${
                    transformed ? "is-on" : ""
                  }`}
                  style={
                    {
                      "--accent": o.accent,
                      animationDelay: `${i * 120 + 120}ms`,
                    } as React.CSSProperties
                  }
                >
                  <div className="ba-card-top">
                    <span className="ba-platform" aria-hidden>
                      <o.Icon className="h-4 w-4" />
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
        .ba-orb { position:absolute; border-radius:9999px; filter: blur(70px); opacity:.55; pointer-events:none; }
        .ba-orb-a { width:380px; height:380px; left:-80px; top:-60px; background: radial-gradient(closest-side, rgba(124,58,237,0.30), transparent 70%); animation: baFloat 14s ease-in-out infinite; }
        .ba-orb-b { width:320px; height:320px; right:-60px; bottom:-40px; background: radial-gradient(closest-side, rgba(232,93,58,0.25), transparent 70%); animation: baFloat 17s ease-in-out infinite reverse; }

        /* INPUT */
        .ba-panel {
          padding: 22px;
          min-height: 420px;
          display:flex; flex-direction:column;
          opacity: 0; transform: translateY(14px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .ba-panel.is-on { opacity:1; transform: translateY(0); }
        .ba-panel-head { display:flex; align-items:center; justify-content:space-between; }
        .ba-panel-label {
          display:flex; align-items:center; gap:.5rem;
          font-size:.7rem; letter-spacing:.22em; text-transform:uppercase;
          color: rgba(26,26,46,0.6);
        }
        .ba-traffic { display:inline-flex; gap:6px; }
        .ba-traffic span { width:10px; height:10px; border-radius:9999px; background: rgba(26,26,46,0.12); }
        .ba-traffic span:nth-child(1) { background:#f87171; }
        .ba-traffic span:nth-child(2) { background:#fbbf24; }
        .ba-traffic span:nth-child(3) { background:#34d399; }
        .ba-pulse { width:8px; height:8px; border-radius:9999px; background:#7c3aed; box-shadow:0 0 10px rgba(124,58,237,0.6); animation: baBlink 1.4s ease-in-out infinite; }
        .ba-doc { margin-top:14px; display:flex; flex-direction:column; flex:1; }
        .ba-doc-title {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; color:#1a1a2e;
        }
        .ba-doc-meta { font-size:.72rem; color: rgba(26,26,46,0.55); margin-top:2px; letter-spacing:.04em; }
        .ba-doc-md {
          margin-top:16px; flex:1;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12.5px; line-height: 1.7;
          color: rgba(26,26,46,0.82);
          background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25));
          border: 1px solid rgba(26,26,46,0.08);
          border-radius: 12px;
          padding: 14px 16px;
          white-space: pre-wrap; overflow:hidden;
          position:relative;
          animation: baTypeReveal 2.2s ease-out both;
        }
        .ba-doc-md::after {
          content:""; position:absolute; left:16px; bottom:14px;
          width:8px; height:14px; background:#7c3aed;
          animation: baCaret 1s steps(2) infinite;
        }
        .ba-md-h { color:#4c1d95; font-weight:700; }
        .ba-md-h2 { color:#7c3aed; font-weight:700; }
        .ba-md-mute { color: rgba(26,26,46,0.45); font-style: italic; }
        .ba-md-em { color:#b45309; font-style: italic; }
        .ba-md-li { color: rgba(26,26,46,0.85); }
        .ba-md-quote { color: rgba(26,26,46,0.7); font-style: italic; border-left: 2px solid #c4b5fd; padding-left: 8px; display:inline-block; }
        @keyframes baTypeReveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }
        @keyframes baCaret { 50% { opacity: 0; } }
        .ba-doc-foot { margin-top:16px; display:flex; gap:8px; flex-wrap:wrap; }
        .ba-tag {
          font-size:.62rem; letter-spacing:.18em; text-transform:uppercase;
          padding:.3rem .6rem; border-radius:6px;
          background: rgba(124,58,237,0.10); color:#4c1d95;
          border:1px solid rgba(124,58,237,0.20);
        }
        .ba-tag-alt { background: rgba(232,93,58,0.10); color:#b45309; border-color: rgba(232,93,58,0.25); }
        .ba-tag-mute { background: rgba(26,26,46,0.05); color: rgba(26,26,46,0.55); border-color: rgba(26,26,46,0.12); }

        /* CORE */
        .ba-core {
          position:relative;
          width: 140px; min-height: 360px;
          display:flex; align-items:center; justify-content:center;
          margin: 0 auto;
        }
        .ba-rings { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
        .ba-ring {
          position:absolute; width:110px; height:110px; border-radius:9999px;
          border:1px solid rgba(124,58,237,0.30);
          animation: baRing 3.2s ease-out infinite;
        }
        .ba-ring-2 { animation-delay: 1.0s; border-color: rgba(232,93,58,0.30); }
        .ba-ring-3 { animation-delay: 2.0s; border-color: rgba(245,215,182,0.55); }
        .ba-core-disc {
          position:relative; width:84px; height:84px; border-radius:9999px;
          display:flex; align-items:center; justify-content:center;
          background:
            radial-gradient(closest-side, rgba(255,255,255,0.4), rgba(255,255,255,0.05) 70%),
            conic-gradient(from 0deg, #7c3aed, #c4b5fd, #f5d7b6, #e85d3a, #7c3aed);
          box-shadow: 0 0 40px rgba(124,58,237,0.35), inset 0 0 20px rgba(255,255,255,0.4);
          animation: baSpin 14s linear infinite;
        }
        .ba-spark { width: 38px; height: 38px; filter: drop-shadow(0 2px 6px rgba(26,26,46,0.25)); }
        .ba-core-cap {
          position:absolute; bottom: 0; left:50%; transform:translateX(-50%);
          font-size:.6rem; letter-spacing:.22em; text-transform:uppercase;
          color: rgba(26,26,46,0.6); white-space: nowrap;
        }
        .ba-beams { position:absolute; inset:0; width:100%; height:100%; z-index:-1; }
        @media (max-width: 1023px) {
          .ba-core { width:100%; min-height: 90px; }
          .ba-beams { display:none; }
        }

        /* OUTPUTS */
        .ba-outputs { display:flex; flex-direction:column; gap:14px; }
        .ba-outputs-head { display:flex; align-items:center; justify-content:space-between; }
        .ba-outputs-label { font-size:.7rem; letter-spacing:.22em; text-transform:uppercase; color: rgba(26,26,46,0.65); }
        .ba-outputs-live {
          display:inline-flex; align-items:center; gap:.45rem;
          font-size:.65rem; letter-spacing:.2em; text-transform:uppercase;
          padding:.3rem .6rem; border-radius:9999px;
          background: rgba(34,197,94,0.10); color:#15803d;
          border:1px solid rgba(34,197,94,0.25);
        }
        .ba-live-dot { width:6px; height:6px; border-radius:9999px; background:#22c55e; box-shadow:0 0 10px #22c55e; animation: baBlink 1.2s ease-in-out infinite; }

        .ba-grid-cards { display:grid; grid-template-columns: 1fr; gap:12px; }
        @media (min-width: 520px) { .ba-grid-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .ba-card {
          padding:16px;
          opacity:0; transform: translateY(16px);
          animation: baRise .7s ease-out both;
          transition: transform .4s ease, border-color .4s ease, box-shadow .4s ease;
        }
        .ba-card.is-on { opacity:1; }
        .ba-card.is-active {
          border-color: color-mix(in oklab, var(--accent) 60%, rgba(26,26,46,0.08));
          box-shadow:
            0 1px 0 rgba(255,255,255,0.85) inset,
            0 28px 50px -24px color-mix(in oklab, var(--accent) 45%, transparent);
        }
        .ba-card-top { display:flex; align-items:center; justify-content:space-between; }
        .ba-platform {
          display:inline-flex; align-items:center; justify-content:center;
          width:32px; height:32px; border-radius:10px;
          background: color-mix(in oklab, var(--accent) 14%, white);
          color: var(--accent);
          border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
        }
        .ba-count { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-weight:800; font-size: 1.35rem; letter-spacing:-0.03em; color:#1a1a2e; opacity:.9; }
        .ba-card-label { margin-top:10px; font-size:.7rem; letter-spacing:.18em; text-transform:uppercase; color: rgba(26,26,46,0.55); }
        .ba-card-preview { margin-top:6px; font-size:.85rem; line-height:1.45; color:#1a1a2e; }
        .ba-card-foot { margin-top:14px; display:flex; align-items:center; justify-content:space-between; }
        .ba-bars { display:inline-flex; align-items:flex-end; gap:3px; height:14px; }
        .ba-bars span { width:3px; background: color-mix(in oklab, var(--accent) 70%, transparent); border-radius:2px; }
        .ba-bars span:nth-child(1) { height:30%; }
        .ba-bars span:nth-child(2) { height:55%; }
        .ba-bars span:nth-child(3) { height:75%; }
        .ba-bars span:nth-child(4) { height:45%; }
        .ba-bars span:nth-child(5) { height:90%; }
        .ba-metric { font-size:.7rem; color: var(--accent); font-weight:600; }

        .ba-foot-row { margin-top:8px; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
        .ba-stat { text-align:center; padding:10px; border-radius:14px; background: rgba(255,255,255,0.55); border:1px solid rgba(26,26,46,0.08); backdrop-filter: blur(8px); }
        .ba-stat-n { font-family: "Instrument Serif", serif; font-size: 1.4rem; color:#1a1a2e; }
        .ba-stat-l { font-size:.62rem; letter-spacing:.2em; text-transform:uppercase; color: rgba(26,26,46,0.55); margin-top:2px; }

        @keyframes baFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes baBlink { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes baSweep { 0%{transform:translateX(-100%)} 60%,100%{transform:translateX(100%)} }
        @keyframes baRing {
          0% { transform: scale(.6); opacity:.9; }
          100% { transform: scale(1.5); opacity:0; }
        }
        @keyframes baSpin { to { transform: rotate(360deg); } }
        @keyframes baRise { 0%{opacity:0; transform:translateY(16px)} 100%{opacity:1; transform:translateY(0)} }

        @media (prefers-reduced-motion: reduce) {
          .ba-orb, .ba-ring, .ba-core-disc, .ba-line::after, .ba-pulse, .ba-live-dot { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
