import { useRef, useState, useCallback, useEffect } from "react";
import { FileText, MessageCircle, Briefcase, Mail, Video, GripVertical } from "lucide-react";

/**
 * Interactive drag-to-compare slider:
 * Left side = single input (blog post). Right side = AI-generated output bundle.
 * Reveals more of the right pane as the user drags the handle.
 */
export function HeroCompareSlider() {
  const [pos, setPos] = useState(50); // percent, single source of truth
  const wrapRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const setClampedPos = useCallback((next: number) => {
    setPos(Math.max(6, Math.min(94, next)));
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setClampedPos(((clientX - rect.left) / rect.width) * 100);
  }, [setClampedPos]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Capture on the wrapper so move/up always fire even if the finger
      // leaves the element on touch devices.
      const el = wrapRef.current;
      if (!el) return;
      activePointer.current = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch {}
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointer.current !== e.pointerId) return;
      // Stop the page from scrolling while the user drags on touch.
      e.preventDefault();
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );

  const releasePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== e.pointerId) return;
    const el = wrapRef.current;
    try { el?.releasePointerCapture(e.pointerId); } catch {}
    activePointer.current = null;
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = e.shiftKey ? 12 : 4;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setClampedPos(pos - big);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setClampedPos(pos + big);
    } else if (e.key === "Home") {
      e.preventDefault();
      setClampedPos(6);
    } else if (e.key === "End") {
      e.preventDefault();
      setClampedPos(94);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      setClampedPos(pos - 20);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      setClampedPos(pos + 20);
    }
  }, [pos, setClampedPos]);

  // Safety net: ensure we drop the active pointer on unmount or window blur.
  useEffect(() => {
    const drop = () => { activePointer.current = null; };
    window.addEventListener("blur", drop);
    return () => window.removeEventListener("blur", drop);
  }, []);

  return (
    <section
      data-testid="hero-compare-slider"
      className="relative isolate overflow-hidden cream-surface-alt py-20"
    >
      <div className="cream-grain" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            Drag to see the magic
          </span>
          <h2
            className="mt-5 luxury-heading"
            style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", lineHeight: 1.05 }}
          >
            One blog in. <span className="luxury-gradient-text">A week of content out.</span>
          </h2>
        </div>

        <div
          ref={wrapRef}
          data-testid="compare-track"
          data-position={Math.round(pos)}
          className="luxury-card relative mx-auto aspect-[16/10] w-full max-w-3xl select-none overflow-hidden rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-[#7c3aed]/40"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onLostPointerCapture={releasePointer}
          role="slider"
          aria-label="Compare input vs AI output"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`Showing ${Math.round(pos)}% input, ${100 - Math.round(pos)}% output`}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {/* LEFT pane: input */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#f5ede2] p-6">
            <div className="w-full max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
                <FileText className="h-7 w-7 text-[#4c1d95]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a1a2e]/55">
                Input
              </p>
              <p className="mt-2 text-lg font-semibold luxury-heading">Your blog post</p>
              <p className="mt-1 text-xs text-[#1a1a2e]/60">1,200 words · 8 min read</p>
              <div className="mt-5 space-y-2 text-left">
                <div className="h-2 w-full rounded-full bg-[#1a1a2e]/10" />
                <div className="h-2 w-[92%] rounded-full bg-[#1a1a2e]/10" />
                <div className="h-2 w-[78%] rounded-full bg-[#1a1a2e]/10" />
                <div className="h-2 w-[88%] rounded-full bg-[#1a1a2e]/10" />
              </div>
            </div>
          </div>

          {/* RIGHT pane: outputs (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            <div
              className="absolute inset-0 p-6"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a2e 0%, #2d1b5e 60%, #4c1d95 100%)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Output · 30+ pieces
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { icon: MessageCircle, label: "10 Tweets", tint: "#a78bfa" },
                  { icon: Briefcase, label: "5 LinkedIn posts", tint: "#c4b5fd" },
                  { icon: Mail, label: "1 Newsletter", tint: "#fbbf24" },
                  { icon: Video, label: "1 Video script", tint: "#fb7185" },
                ].map((o) => (
                  <div
                    key={o.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md"
                  >
                    <o.icon className="h-5 w-5" style={{ color: o.tint }} />
                    <p className="mt-2 text-xs font-semibold text-white">{o.label}</p>
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-white/15" />
                      <div className="h-1.5 w-[80%] rounded-full bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Generated in 8s
              </div>
            </div>
          </div>

          {/* Divider line */}
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/80 shadow-[0_0_24px_rgba(124,58,237,0.5)]"
            style={{ left: `${pos}%` }}
          />

          {/* Handle */}
          <button
            type="button"
            aria-label="Drag to compare"
            className="absolute top-1/2 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white shadow-[0_12px_30px_-6px_rgba(26,26,46,0.4)] transition-transform hover:scale-110 active:scale-95"
            style={{ left: `${pos}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              dragging.current = true;
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
          >
            <GripVertical className="h-5 w-5 text-[#1a1a2e]" />
          </button>

          {/* Labels */}
          <span className="absolute left-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1a2e] backdrop-blur-md">
            Before
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
            After
          </span>
        </div>

        <p className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-[#1a1a2e]/55">
          ← Drag the handle →
        </p>
      </div>
    </section>
  );
}
