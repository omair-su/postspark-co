import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PREMIUM_ART, type PremiumArtKey } from "./premiumArt";

/** Illustrated empty state — real brand imagery instead of text-only. */
export function IllustratedEmpty({
  title,
  description,
  cta,
  art = "empty",
}: {
  title: string;
  description?: string;
  cta?: { to: string; label: string };
  art?: PremiumArtKey;
}) {
  return (
    <div className="ps-glass-1 ps-elev-2 relative overflow-hidden p-6 sm:p-8">
      <span className="ps-ambient" aria-hidden />
      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <img
          src={PREMIUM_ART[art]}
          alt=""
          aria-hidden
          loading="lazy"
          width={1024}
          height={768}
          className="h-28 w-40 shrink-0 rounded-xl object-cover opacity-90"
        />
        <div className="min-w-0">
          <p className="text-base font-semibold" style={{ color: "var(--ds-text)" }}>{title}</p>
          {description && (
            <p className="mt-1 max-w-md text-[13px] leading-relaxed" style={{ color: "var(--ds-muted)" }}>
              {description}
            </p>
          )}
          {cta && (
            <Link to={cta.to} className="ds-cta-pill ps-press mt-3 !px-4 !py-2 text-[13px]">
              <Sparkles className="h-3.5 w-3.5" /> {cta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
