import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  icon,
  trend,
  footer,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { label: string; positive?: boolean };
  footer?: ReactNode;
}) {
  return (
    <div className="ds-card ds-card-hover p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] ds-muted-text">{label}</p>
          <p className="ds-stat-num mt-1.5 text-[28px] leading-none">{value}</p>
          {trend && (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-[11px] font-medium ${
                trend.positive === false ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {trend.label}
            </p>
          )}
        </div>
        {icon && <div className="ds-icon-disc h-9 w-9 shrink-0">{icon}</div>}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
