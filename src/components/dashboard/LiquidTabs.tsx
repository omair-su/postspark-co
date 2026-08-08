import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type LiquidTab = { id: string; label: string; icon?: ReactNode };

/**
 * Physical segmented switcher: a glass track with a capsule that fluidly
 * slides and stretches to the active tab (CSS transform, spring easing).
 */
export function LiquidTabs({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: LiquidTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [capsule, setCapsule] = useState({ x: 0, w: 0, ready: false });

  const measure = () => {
    const track = trackRef.current;
    if (!track) return;
    const el = track.querySelector<HTMLElement>(`[data-tab-id="${value}"]`);
    if (!el) return;
    setCapsule({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
  };

  useLayoutEffect(measure, [value, tabs.length]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div ref={trackRef} role="tablist" className={`lux-switch ${className}`} onScroll={measure}>
      <span
        aria-hidden
        className="lux-switch-capsule"
        style={{
          transform: `translateX(${capsule.x}px)`,
          width: capsule.w,
          opacity: capsule.ready ? 1 : 0,
        }}
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          data-tab-id={t.id}
          data-active={value === t.id}
          onClick={() => onChange(t.id)}
          className="lux-switch-btn"
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default LiquidTabs;
