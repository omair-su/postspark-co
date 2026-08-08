import lightHero from "@/assets/premium/light-hero.jpg";
import lightA from "@/assets/premium/light-art-a.jpg";
import lightB from "@/assets/premium/light-art-b.jpg";
import lightC from "@/assets/premium/light-art-c.jpg";

/**
 * Shared premium art direction — Phase 5 bright set.
 * One cohesive, light-led family used across every hero and empty state.
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
