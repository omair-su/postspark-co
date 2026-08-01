import { useEffect, useRef, useState } from "react";

/** Animated number that counts up on mount (respects reduced motion). */
export function CountUp({
  value,
  duration = 900,
  className,
  suffix,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
