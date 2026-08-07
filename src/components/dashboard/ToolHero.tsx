import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { PREMIUM_ART, type PremiumArtKey } from "./premiumArt";

/**
 * Premium hero strip for any tool page: eyebrow, gradient title, subtitle,
 * decorative brand art on the right and an optional 3-step micro-row.
 */
export function ToolHero({
  eyebrow,
  title,
  subtitle,
  art,
  steps,
  actions,
  accent = "#7C3AED",
  icon,
  dataPage,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  art?: PremiumArtKey;
  steps?: string[];
  actions?: ReactNode;
  accent?: string;
  icon?: ReactNode;
  dataPage?: string;
}) {
  return (
    <section
      className="psx-hero ps-elev-2 ds-fade-up p-6 sm:p-7"
      data-page={dataPage}
      style={{ ["--cat" as any]: accent }}
    >
      <span className="ps-ambient" aria-hidden />
      {art && (
        <img
          src={PREMIUM_ART[art]}
          alt=""
          aria-hidden
          loading="lazy"
          className="ps-tool-hero-art hidden sm:block"
        />
      )}
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <p className="psx-hero-eyebrow mb-2">
              {icon || <Sparkles className="h-3 w-3" />} {eyebrow}
            </p>
          )}
          <h1 className="psx-hero-title ps-title-sweep mt-1 sm:text-[30px]">
            {title}
          </h1>
          {subtitle && (
            <p className="psx-hero-desc mt-2">
              {subtitle}
            </p>
          )}
          {steps && steps.length > 0 && (
            <div className="ps-steps mt-4">
              {steps.map((s, i) => (
                <span key={s} className="ps-step">
                  <b>{i + 1}</b> {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="relative flex items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
