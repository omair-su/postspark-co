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
    <div className="ds-page-header pw-hero p-5 sm:p-7">
      {art && <ArtLayer src={PREMIUM_ART[art]} width="34%" opacity={0.9} />}
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <Pill accent className="mb-3">
              {icon || <Sparkles className="h-3 w-3" />} {eyebrow}
            </Pill>
          )}
          <h1 className="pw-grad-text text-[24px] font-bold leading-tight tracking-tight sm:text-[30px]">{title}</h1>
          {subtitle && <p className="pw-muted-text mt-2 max-w-2xl text-sm leading-relaxed">{subtitle}</p>}
          {steps && steps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {steps.map((s, i) => (
                <Pill key={s}>
                  <b className="pw-grad-text">{i + 1}</b> {s}
                </Pill>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
