import type { ReactNode } from "react";
import { Inbox, FileText, Signal, Wifi, BatteryFull } from "lucide-react";

export type ChromeVariant = "phone" | "inbox" | "doc" | "plain";

const PHONE = new Set(["instagram", "tiktok", "thread"]);
const INBOX = new Set(["email"]);
const DOC = new Set(["seo", "podcast", "video", "carousel"]);

export function chromeFor(formatId: string): ChromeVariant {
  if (PHONE.has(formatId)) return "phone";
  if (INBOX.has(formatId)) return "inbox";
  if (DOC.has(formatId)) return "doc";
  return "plain";
}

/**
 * Device / app chrome wrapper around an existing preview. Purely presentational —
 * the preview itself is unchanged.
 */
export function PlatformChrome({
  formatId,
  label,
  accent,
  children,
}: {
  formatId: string;
  label: string;
  accent?: string;
  children: ReactNode;
}) {
  const variant = chromeFor(formatId);
  const style = accent ? ({ ["--rp-accent" as any]: accent } as React.CSSProperties) : undefined;

  if (variant === "phone") {
    return (
      <div className="flex justify-center" style={style}>
        <div className="rp-aura w-full max-w-[400px] rounded-[2.2rem] border-[6px] border-foreground/85 bg-background p-1.5 shadow-2xl">
          <div className="flex items-center justify-between px-3 pb-1 pt-1 text-[10px] font-semibold text-muted-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Signal className="h-3 w-3" aria-hidden="true" />
              <Wifi className="h-3 w-3" aria-hidden="true" />
              <BatteryFull className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
          <div className="max-h-[620px] overflow-auto rounded-[1.6rem] bg-card p-2">{children}</div>
        </div>
      </div>
    );
  }

  if (variant === "inbox") {
    return (
      <div className="rp-aura overflow-hidden rounded-2xl border border-border bg-card shadow-sm" style={style}>
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <Inbox className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground">Inbox</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{label}</span>
        </div>
        <div className="p-3">{children}</div>
      </div>
    );
  }

  if (variant === "doc") {
    return (
      <div className="rp-aura overflow-hidden rounded-2xl border border-border bg-card shadow-sm" style={style}>
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <FileText className="ml-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <div className="p-3">{children}</div>
      </div>
    );
  }

  return (
    <div className="rp-aura rounded-2xl" style={style}>
      {children}
    </div>
  );
}
