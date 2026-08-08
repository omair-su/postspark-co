import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Phase 5 premium primitives — one shared set for the app interior.
 * Light is the authored baseline; dark inherits via the `--pw-*` tokens.
 */

/** Reveals `.pw-reveal` children inside the container as they scroll into view. */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".pw-reveal"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("pw-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el, i) => {
      el.style.animationDelay = `${Math.min(i, 8) * 60}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return ref;
}

type BaseProps = { className?: string; children?: ReactNode };

/** Plain white hairline surface. */
export function Surface({ className, children }: BaseProps) {
  return <div className={cn("pw-surface", className)}>{children}</div>;
}

/** Interactive card with hover lift. Renders as a link when `as` is provided. */
export function PanelCard({
  as,
  className,
  children,
  ...rest
}: BaseProps & { as?: ElementType } & Record<string, any>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp className={cn("pw-surface p-5", as && "pw-hoverable pw-sheen block", className)} {...rest}>
      {children}
    </Comp>
  );
}

/** Soft section band used to separate blocks without heavy chrome. */
export function SectionBand({ className, children }: BaseProps) {
  return <section className={cn("pw-band p-5 sm:p-6", className)}>{children}</section>;
}

/** Compact metric card. */
export function StatCard({
  label,
  value,
  icon,
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pw-surface pw-hoverable pw-sheen p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] pw-muted-text">{label}</p>
        {icon ? <span className="pw-chip h-9 w-9">{icon}</span> : null}
      </div>
      <p className="pw-stat-value pw-ink mt-3 text-3xl font-bold">{value}</p>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}

export function Pill({ className, children, accent }: BaseProps & { accent?: boolean }) {
  return <span className={cn("pw-pill", accent && "pw-pill-accent", className)}>{children}</span>;
}

export function GradientCTA({
  as,
  className,
  children,
  ...rest
}: BaseProps & { as?: ElementType } & Record<string, any>) {
  const Comp: ElementType = as ?? "button";
  return (
    <Comp className={cn("pw-cta", className)} {...rest}>
      {children}
    </Comp>
  );
}

export function GhostCTA({
  as,
  className,
  children,
  ...rest
}: BaseProps & { as?: ElementType } & Record<string, any>) {
  const Comp: ElementType = as ?? "button";
  return (
    <Comp className={cn("pw-cta-ghost", className)} {...rest}>
      {children}
    </Comp>
  );
}

/** Decorative bright art layer for hero bands. Parent must be relative + overflow-hidden. */
export function ArtLayer({
  src,
  className,
  width = "44%",
  opacity = 0.9,
}: {
  src: string;
  className?: string;
  width?: string;
  opacity?: number;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={cn("pointer-events-none absolute right-0 top-0 hidden h-full object-cover md:block", className)}
      style={{
        width,
        opacity,
        maskImage: "linear-gradient(to left, rgba(0,0,0,1) 30%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 30%, transparent 100%)",
      }}
    />
  );
}

/** Floating platform/tool glyph cluster for hero bands. */
export function FloatingGlyphs({ items }: { items: Array<{ icon: ReactNode; top: string; left: string }> }) {
  return (
    <>
      {items.map((g, i) => (
        <span
          key={i}
          aria-hidden
          className="pw-float pw-surface absolute hidden h-11 w-11 items-center justify-center rounded-2xl lg:flex"
          style={{ top: g.top, left: g.left, animationDelay: `${i * 0.8}s` }}
        >
          {g.icon}
        </span>
      ))}
    </>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("pw-skeleton", className)} />;
}
