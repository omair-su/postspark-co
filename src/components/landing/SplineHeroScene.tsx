import { Suspense, lazy, useEffect, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

const SCENE_URL = "https://prod.spline.design/Pis4Bei0FGUH9TSIvAVWxpLe/scene.splinecode";
const IFRAME_URL = "https://my.spline.design/boxeshover-Pis4Bei0FGUH9TSIvAVWxpLe/";

/**
 * Spline 3D scene for the hero centerpiece.
 * - Desktop/tablet: live Spline runtime with Suspense + fade-in
 * - Mobile (<768px): static iframe-free CSS placeholder fallback
 * - Transparent background so the cream hero shows through
 * - Falls back to <iframe> if the runtime fails to load the .splinecode
 */
export function SplineHeroScene() {
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [runtimeFailed, setRuntimeFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isMobile) {
    return (
      <div
        aria-hidden
        className="h-full w-full"
        style={{
          background:
            "radial-gradient(circle at 60% 45%, rgba(167,139,250,0.45) 0%, rgba(124,58,237,0.18) 40%, transparent 70%)",
        }}
      />
    );
  }

  if (runtimeFailed) {
    return (
      <iframe
        src={IFRAME_URL}
        title="PostSpark 3D scene"
        loading="lazy"
        className="h-full w-full"
        style={{ border: 0, background: "transparent" }}
        allow="autoplay; fullscreen"
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <Suspense fallback={null}>
        <div
          className="h-full w-full transition-opacity duration-700 ease-out"
          style={{ opacity: loaded ? 1 : 0 }}
        >
          <Spline
            scene={SCENE_URL}
            onLoad={() => setLoaded(true)}
            onError={() => setRuntimeFailed(true)}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />
        </div>
      </Suspense>
    </div>
  );
}

export default SplineHeroScene;
