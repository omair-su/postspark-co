import { Link } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { type ReactNode } from "react";

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  accentFrom: string;
  accentTo: string;
  steps?: { label: string; done: boolean; active: boolean }[];
  children: ReactNode;
  backTo?: string;
}

export function GuidedStudioShell({ emoji, title, subtitle, accentFrom, accentTo, steps, children, backTo = "/dashboard" }: Props) {
  return (
    <div className="guided-studio-page min-h-screen bg-background">
      <header
        className="guided-studio-header sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div
            className="studio-icon-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ background: `linear-gradient(135deg, ${accentFrom}22, ${accentTo}22)` }}
          >
            <span>{emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{subtitle}</p>
          </div>
          <Link
            to={backTo}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>
        <div
          className="h-[3px] w-full"
          style={{ background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})` }}
        />
        {steps && steps.length > 0 && (
          <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 py-3 text-[11px] sm:px-6 sm:text-xs">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    s.done ? "bg-emerald-500 text-white" : s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                <span className={s.active || s.done ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <span className="text-muted-foreground/40">→</span>}
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6 sm:pb-12">
        {children}
      </main>
    </div>
  );
}
