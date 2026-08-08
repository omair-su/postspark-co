import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { PREMIUM_ART, type PremiumArtKey } from "./premiumArt";
import { ArtLayer, Pill } from "./premium";

/**
 * Premium hero band for any tool page: eyebrow, gradient title, subtitle,
 * bright brand art on the right and an optional 3-step micro-row.
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
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  art?: PremiumArtKey;
  steps?: string[];
  actions?: ReactNode;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <section className="pw-hero p-5 sm:p-7" style={{ ["--cat" as any]: accent }}>
      {art && <ArtLayer src={PREMIUM_ART[art]} width="38%" opacity={0.9} />}
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <Pill accent className="mb-3">
              {icon || <Sparkles className="h-3 w-3" />} {eyebrow}
            </Pill>
          )}
          <h1 className="pw-grad-text text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
            {title}
          </h1>
          {subtitle && <p className="pw-muted-text mt-2 max-w-xl text-[13.5px] leading-relaxed">{subtitle}</p>}
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
        {actions && <div className="relative flex items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
