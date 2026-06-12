import { Link } from "@tanstack/react-router";
import { Sparkles, X, Check, Zap } from "lucide-react";

export function LimitReachedModal({
  open,
  onClose,
  feature = "image generation",
}: {
  open: boolean;
  onClose: () => void;
  feature?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-bold">You've hit your free {feature} limit</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Free accounts include 5 image generations per month. Upgrade to Pro for
          500/month, plus unlimited repurposes and full access to Brand Kit, Voice & Carousel tools.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {[
            "500 AI images per month",
            "GPT Image 2 + Flux 1.1 Pro + Gemini",
            "Carousel & Thumbnail generator (no limit)",
            "Cancel anytime — 30-day money-back",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex-1 rounded-lg gradient-electric px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90 inline-flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> Upgrade to Pro
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
