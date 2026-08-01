import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { PREMIUM_ART, type PremiumArtKey } from "./premiumArt";

/**
 * Standardized premium page header for any dashboard route.
 * Eyebrow chip → gradient display title → subtitle → right-aligned action slot.
 * Optional brand art + step row for a hero-grade feel.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  icon,
  art,
  steps,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  art?: PremiumArtKey;
  steps?: string[];
}) {
  return (
    <div className="ds-page-header ps-tool-hero ps-elev-2 ds-fade-up">
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
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="ds-eyebrow mb-2">
              {icon || <Sparkles className="h-3 w-3" />} {eyebrow}
            </p>
          )}
          <h1 className="ds-page-title ds-gradient-text ps-title-sweep">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm" style={{ color: "var(--ds-muted)" }}>{subtitle}</p>}
          {steps && steps.length > 0 && (
            <div className="ps-steps mt-4">
              {steps.map((s, i) => (
                <span key={s} className="ps-step"><b>{i + 1}</b> {s}</span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
