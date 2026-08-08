import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BoltMark } from "@/components/BoltMark";

/**
 * MobileSplash — premium branded launch screen for the mobile / installed app.
 * Light theme, aurora wash, gradient bolt mark. Shows once per session on
 * small screens (or whenever the app is launched standalone).
 */
export function MobileSplash() {
  const [state, setState] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const isMobile = window.innerWidth < 768;
    if (!isMobile && !standalone) return;
    if (sessionStorage.getItem("ps_splash_shown") === "1") return;
    sessionStorage.setItem("ps_splash_shown", "1");
    setState("in");
    const t1 = window.setTimeout(() => setState("out"), 1250);
    const t2 = window.setTimeout(() => setState("hidden"), 1900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (state === "hidden") return null;

  const node = (
    <div className={`ps-splash ${state === "out" ? "ps-splash-out" : ""}`} role="presentation">
      <div className="ps-splash-glow" aria-hidden />
      <div className="ps-splash-inner">
        <span className="ps-splash-badge">
          <BoltMark size={54} />
        </span>
        <p className="ps-splash-word">
          Post<span>Spark</span>
        </p>
        <p className="ps-splash-tag">One piece of content. Endless reach.</p>
        <span className="ps-splash-bar" aria-hidden>
          <i />
        </span>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(node, document.body) : null;
}

export default MobileSplash;
