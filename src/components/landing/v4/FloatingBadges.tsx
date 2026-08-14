import { useEffect, useRef, useState } from "react";
import { PUBLISH_PLATFORMS } from "@/lib/brandIcons";
import { PlatformLogo } from "./primitives";

/**
 * Animated floating publishing badges for the hero visual.
 * - continuous drift (3 offset keyframe tracks so no two badges sync)
 * - scroll-triggered staggered entrance
 * - hover: lift, brand-tinted glow, and a platform label tooltip
 */
type Badge = {
  key: string;
  /** brand tint used for the hover glow */
  glow: string;
  top: string;
  left?: string;
  right?: string;
  track: "a" | "b" | "c";
  /** entrance + drift offset in ms */
  delay: number;
};

export const HERO_BADGES: Badge[] = [
  { key: "linkedin", glow: "10,102,194", top: "4%", left: "-4%", track: "a", delay: 0 },
  { key: "instagram", glow: "214,41,118", top: "-3%", right: "16%", track: "c", delay: 90 },
  { key: "x", glow: "15,15,26", top: "26%", right: "-5%", track: "b", delay: 180 },
  { key: "facebook", glow: "24,119,242", top: "48%", right: "-8%", track: "c", delay: 270 },
  { key: "tiktok", glow: "0,0,0", top: "62%", left: "-7%", track: "b", delay: 360 },
  { key: "youtube", glow: "255,0,0", top: "78%", right: "2%", track: "a", delay: 450 },
  { key: "threads", glow: "15,15,26", top: "88%", left: "22%", track: "a", delay: 540 },
];

export function FloatingBadges({ size = 56 }: { size?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden={false} className="pointer-events-none absolute inset-0 z-20">
      {HERO_BADGES.map((b) => {
        const p = PUBLISH_PLATFORMS.find((x) => x.key === b.key);
        if (!p) return null;
        return (
          <span
            key={b.key}
            className={`lp4-fb ${shown ? "is-in" : ""} lp4-fb-${b.track} pointer-events-auto absolute`}
            style={{
              top: b.top,
              left: b.left,
              right: b.right,
              width: size,
              height: size,
              // @ts-expect-error custom property
              "--fb-glow": b.glow,
              "--fb-delay": `${b.delay}ms`,
            }}
          >
            <span className="lp4-fb-tile grid h-full w-full place-items-center">
              <PlatformLogo p={p} size={Math.round(size * 0.54)} />
            </span>
            <span className="lp4-fb-tip" role="tooltip">
              {p.name}
            </span>
          </span>
        );
      })}
    </div>
  );
}
