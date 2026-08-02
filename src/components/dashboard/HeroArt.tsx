import { PREMIUM_ART, type PremiumArtKey } from "./premiumArt";

/**
 * Decorative brand art layer for any hero card.
 * Parent must be `relative overflow-hidden`. Lazy-loaded, masked, decorative only.
 */
export function HeroArt({ art, className = "" }: { art: PremiumArtKey; className?: string }) {
  return (
    <img
      src={PREMIUM_ART[art]}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      width={1024}
      height={768}
      sizes="(max-width: 640px) 0px, 42vw"
      className={`ps-tool-hero-art hidden sm:block ${className}`}
    />
  );
}
