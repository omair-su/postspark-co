import type { ReactNode } from "react";
import { delay } from "./parts";

/**
 * Shared marketing page hero — same light mesh canvas, type scale and motion
 * as the landing hero, so /pricing and /gallery read as one product.
 */
export function Lp4PageHero({
  label,
  title,
  accent,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  accent?: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="lp4-page-hero px-6 pb-12 pt-[104px] sm:pb-16 sm:pt-[132px]">
      <div className="relative mx-auto max-w-[860px] text-center">
        <span className="lp4-chip fade-in-up">{label}</span>
        <h1
          className="fade-in-up mt-6 text-balance"
          style={{
            fontSize: "clamp(38px,6vw,64px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            color: "#0F0F1A",
            ...delay(80),
          }}
        >
          {title}{" "}
          {accent && <span className="lp4-grad-text">{accent}</span>}
        </h1>
        <p
          className="fade-in-up mx-auto mt-5 max-w-[620px]"
          style={{ fontSize: "clamp(16px,1.4vw,19px)", lineHeight: 1.65, color: "#6B7280", ...delay(160) }}
        >
          {subtitle}
        </p>
        {children && (
          <div className="fade-in-up mt-8" style={delay(220)}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

export function Lp4TrustRow({ items }: { items: string[] }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3"
      style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}
    >
      {items.map((t) => (
        <span key={t} className="inline-flex items-center gap-2">
          <span
            className="inline-grid h-[18px] w-[18px] place-items-center rounded-full"
            style={{ background: "#EDE9FE", color: "#7C3AED", fontSize: 11, fontWeight: 800 }}
          >
            ✓
          </span>
          {t}
        </span>
      ))}
    </div>
  );
}
