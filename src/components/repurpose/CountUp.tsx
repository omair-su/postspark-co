import { useEffect, useRef, useState } from "react";

/** Count-up number for pack totals. Respects reduced-motion. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const startValue = from.current;
    const delta = value - startValue;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 520);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(startValue + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{shown.toLocaleString()}</span>;
}
