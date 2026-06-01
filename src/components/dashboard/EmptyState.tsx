import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="ds-empty">
      <div className="ds-icon-disc h-12 w-12">{icon || <Sparkles className="h-5 w-5" />}</div>
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="text-xs ds-muted-text max-w-sm">{description}</p>}
      {cta && (
        <Link to={cta.to} className="ds-cta-pill !py-2 !px-4 mt-1 text-[13px]">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
