import type { ReactNode } from "react";
import { X } from "lucide-react";

/** Lightweight right-hand slide-over used by the swipe file + history drawers. */
export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-[2px]"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-[color:var(--ds-card,hsl(var(--card)))] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
