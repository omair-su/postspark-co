import heroMesh from "@/assets/premium/hero-mesh.jpg";
import repurposeArt from "@/assets/premium/tool-repurpose.jpg";
import hookArt from "@/assets/premium/tool-hook.jpg";
import imageArt from "@/assets/premium/tool-image.jpg";
import carouselArt from "@/assets/premium/tool-carousel.jpg";
import seoArt from "@/assets/premium/tool-seo.jpg";
import shortsArt from "@/assets/premium/tool-shorts.jpg";
import emptySpark from "@/assets/premium/empty-spark.jpg";
import upgradeArt from "@/assets/premium/upgrade-art.jpg";

/** Shared premium art direction — one cohesive set for the whole app interior. */
export const PREMIUM_ART = {
  hero: heroMesh,
  repurpose: repurposeArt,
  hook: hookArt,
  image: imageArt,
  carousel: carouselArt,
  seo: seoArt,
  shorts: shortsArt,
  empty: emptySpark,
  upgrade: upgradeArt,
} as const;

export type PremiumArtKey = keyof typeof PREMIUM_ART;
