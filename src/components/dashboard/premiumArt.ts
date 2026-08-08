import lightHero from "@/assets/premium/light-hero.jpg";
import lightA from "@/assets/premium/light-art-a.jpg";
import lightB from "@/assets/premium/light-art-b.jpg";
import lightC from "@/assets/premium/light-art-c.jpg";
import darkHero from "@/assets/premium/dark-hero.jpg";

/**
 * Shared premium art direction.
 * Light set is the authored baseline; the obsidian set is used in dark mode.
 */
export const PREMIUM_ART = {
  hero: lightHero,
  repurpose: lightA,
  hook: lightC,
  image: lightB,
  carousel: lightB,
  seo: lightA,
  shorts: lightC,
  empty: lightB,
  upgrade: lightC,
} as const;

export type PremiumArtKey = keyof typeof PREMIUM_ART;

/** Obsidian Luxe counterpart — one cohesive metallic-glass artwork for dark mode. */
export const PREMIUM_ART_DARK: Record<PremiumArtKey, string> = {
  hero: darkHero,
  repurpose: darkHero,
  hook: darkHero,
  image: darkHero,
  carousel: darkHero,
  seo: darkHero,
  shorts: darkHero,
  empty: darkHero,
  upgrade: darkHero,
};
