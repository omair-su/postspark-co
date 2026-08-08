import { PREMIUM_ART, PREMIUM_ART_DARK, type PremiumArtKey } from "./premiumArt";

/**
 * Decorative brand art layer for any hero card.
 * Parent must be `relative overflow-hidden`. Lazy-loaded, masked, decorative only.
 */
export function HeroArt({ art, className = "" }: { art: PremiumArtKey; className?: string }) {
  const common = {
    alt: "",
    "aria-hidden": true,
    loading: "lazy",
    decoding: "async",
    width: 1024,
    height: 768,
    sizes: "(max-width: 640px) 0px, 42vw",
  } as const;
  return (
    <>
      <img {...common} src={PREMIUM_ART[art]} className={`ps-tool-hero-art hidden sm:block dark:sm:hidden ${className}`} />
      <img {...common} src={PREMIUM_ART_DARK[art]} className={`ps-tool-hero-art hidden dark:sm:block ${className}`} />
    </>
  );
}
