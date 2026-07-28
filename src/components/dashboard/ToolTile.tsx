import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export type ToolTileItem = {
  to: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
  /** Category accent color — used for left border, icon disc tint, hover. */
  category?: string;
  /** Show a "Most Popular" amber pill in the corner. */
  popular?: boolean;
  /** Show a "New" green pill in the corner. */
  isNew?: boolean;
};

export function ToolTile({ item }: { item: ToolTileItem }) {
  const Icon = item.icon;
  const cat = item.category || "#7C3AED";
  return (
    <Link
      to={item.to}
      className="ds-tool-tile group"
      style={{ ["--cat" as any]: cat }}
    >
      <div className="relative flex items-start justify-between gap-2">
        <div className="ds-icon-disc h-10 w-10">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.popular && <span className="ds-pill-popular">★ Popular</span>}
          {item.isNew && <span className="ds-pill-new">New</span>}
          {item.badge && !item.popular && !item.isNew && (
            <span className="ds-chip ds-chip-accent !py-0.5 !text-[9px]">{item.badge}</span>
          )}
        </div>
      </div>
      <div className="relative">
        <p className="flex items-center justify-between gap-2 text-sm font-semibold text-[color:var(--ds-text)]">
          {item.label}
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-[color:var(--cat)]" />
        </p>
        {item.description && (
          <p className="mt-1 text-[11px] ds-muted-text leading-relaxed">{item.description}</p>
        )}
      </div>
    </Link>
  );
}
