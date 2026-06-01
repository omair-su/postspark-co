import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export type ToolTileItem = {
  to: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
};

export function ToolTile({ item }: { item: ToolTileItem }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} className="ds-tool-tile group">
      <div className="flex items-start justify-between gap-2">
        <div className="ds-icon-disc h-10 w-10">
          <Icon className="h-4 w-4" />
        </div>
        {item.badge && (
          <span className="ds-chip ds-chip-accent !py-0.5 !text-[9px]">{item.badge}</span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-white flex items-center justify-between gap-2">
          {item.label}
          <ArrowUpRight className="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-[#c4b5fd]" />
        </p>
        {item.description && (
          <p className="mt-1 text-[11px] ds-muted-text leading-relaxed">{item.description}</p>
        )}
      </div>
    </Link>
  );
}
