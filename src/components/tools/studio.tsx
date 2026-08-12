import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Token-driven studio primitives shared by the SEO Blog + Hook Lab studios.
 * Everything here uses semantic tokens so both themes stay legible.
 */

export function StudioCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("pw-surface p-5", glow && "pw-sheen", className)}>{children}</div>
  );
}

export function StudioLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="text-[12px] font-semibold uppercase tracking-[0.06em] pw-muted-text">{children}</div>
      {action}
    </div>
  );
}

export function SubLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{children}</div>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <div className="mt-1 text-[11px] text-muted-foreground/80">{children}</div>;
}

export function ChoicePill({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? "true" : undefined}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition",
        active
          ? "border-primary/70 bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_hsl(var(--primary)/0.75)]"
          : "border-border bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  icon,
  className,
  disabled,
  title,
}: {
  children?: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-2.5 py-1.5 text-[12px] font-medium text-foreground/90 transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function StatChip({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "warn" | "bad" }) {
  const toneCls =
    tone === "good"
      ? "text-emerald-500"
      : tone === "warn"
        ? "text-amber-500"
        : tone === "bad"
          ? "text-red-500"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card/60 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-[15px] font-bold tabular-nums", toneCls)}>{value}</div>
    </div>
  );
}

export function Meter({ value, tone }: { value: number; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="ps-meter" data-tone={tone}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ScoreRing({ score, label }: { score: number; label?: string }) {
  const tone = score >= 80 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid h-14 w-14 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${tone} ${score * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-card text-[13px] font-bold tabular-nums text-foreground">
          {score}
        </div>
      </div>
      {label && <div className="text-[12px] font-medium text-muted-foreground">{label}</div>}
    </div>
  );
}

export function EmptyHint({ icon, title, body }: { icon?: ReactNode; title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      {icon && <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>}
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted-foreground">{body}</p>}
    </div>
  );
}
