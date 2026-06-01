import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

/**
 * Standardized premium page header for any dashboard route.
 * Eyebrow chip → gradient display title → subtitle → right-aligned action slot.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  icon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="ds-page-header ds-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="ds-eyebrow mb-2">
              {icon || <Sparkles className="h-3 w-3" />} {eyebrow}
            </p>
          )}
          <h1 className="ds-page-title ds-gradient-text">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/60 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
