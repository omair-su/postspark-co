import { useEffect, useRef, useState } from "react";

const IFRAME_URL = "https://my.spline.design/boxeshover-Pis4Bei0FGUH9TSIvAVWxpLe/";

/**
 * Spline 3D hero visual.
 * - Uses the official Spline <iframe> embed (works under default CSP, no runtime
 *   bundle, no react-spline dependency at runtime).
 * - Lazy-loaded with IntersectionObserver — only mounts when the hero is in view.
 * - Themed skeleton shimmer while loading, then fades in over 700ms.
 * - Mobile (<768px) and `prefers-reduced-motion: reduce` users get a static
 *   radial-gradient placeholder instead of the live scene (saves bandwidth + CPU).
 */
export function SplineHeroScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [useStatic, setUseStatic] = useState(true);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Decide once whether to render the live scene at all.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setUseStatic(isMobile || reduced);
  }, []);

  // Lazy mount the iframe when the hero scrolls into view.
  useEffect(() => {
    if (useStatic) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useStatic]);

  const StaticPlaceholder = (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 60% 45%, rgba(167,139,250,0.55) 0%, rgba(124,58,237,0.22) 40%, transparent 72%)",
      }}
    />
  );

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {/* Skeleton / static fallback layer */}
      {(!loaded || useStatic) && StaticPlaceholder}

      {!useStatic && inView && (
        <iframe
          src={IFRAME_URL}
          title="PostSpark 3D hero scene"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full transition-opacity duration-700 ease-out"
          style={{
            border: 0,
            background: "transparent",
            opacity: loaded ? 1 : 0,
          }}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      )}
    </div>
  );
}

export default SplineHeroScene;
