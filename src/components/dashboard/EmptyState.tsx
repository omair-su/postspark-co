import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  cta,
  variant = "default",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: { to: string; label: string };
  variant?: "default" | "shimmer";
}) {
  if (variant === "shimmer") {
    return (
      <div className="ds-empty-shimmer">
        <div className="ds-ghost-row" aria-hidden />
        <div className="ds-ghost-row" aria-hidden style={{ opacity: 0.8 }} />
        <div className="ds-ghost-row" aria-hidden style={{ opacity: 0.55 }} />
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          {description && (
            <p className="text-[13px] ds-muted-text max-w-sm">{description}</p>
          )}
          {cta && (
            <Link to={cta.to} className="ds-cta-pill !py-2 !px-4 mt-2 text-[13px]">
              <Sparkles className="h-3.5 w-3.5" /> {cta.label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ds-empty">
      <div className="ds-icon-disc h-12 w-12">{icon || <Sparkles className="h-5 w-5" />}</div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="text-xs ds-muted-text max-w-sm">{description}</p>}
      {cta && (
        <Link to={cta.to} className="ds-cta-pill !py-2 !px-4 mt-1 text-[13px]">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
