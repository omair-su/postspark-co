import { useEffect, useRef, useState } from "react";
import type { PublishPlatform } from "@/lib/brandIcons";

/** Real logo tile — uses the uploaded brand PNG, falls back to an inline SVG mark. */
export function PlatformLogo({ p, size = 34 }: { p: PublishPlatform; size?: number }) {
  if (p.icon) {
    return (
      <img
        src={p.icon}
        alt={`${p.name} logo`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    );
  }
  const svg = p.svg!;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: svg.bg }}
      aria-label={`${p.name} logo`}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d={svg.path} />
      </svg>
    </span>
  );
}

/** Counts up to `value` the first time it scrolls into view. */
export function CountUpOnView({
  value,
  duration = 1400,
  prefix = "",
  suffix = "",
  decimals = 0,
  style,
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setN(value * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString()}
      {suffix}
    </span>
  );
}

/** Cycles through a list of words on an interval. */
export function useWordCycle(words: string[], ms = 2500) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % words.length), ms);
    return () => clearInterval(id);
  }, [words.length, ms]);
  return words[i] ?? words[0]!;
}
