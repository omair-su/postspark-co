/**
 * Native brand DNA colours used for the ambient card auras across the app.
 * Keys match FormatId / BrandKey so tool tiles and format cards stay in sync.
 */
export const BRAND_COLORS: Record<string, string> = {
  tweets: "#1D9BF0",
  twitter: "#1D9BF0",
  x: "#1D9BF0",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#25F4EE",
  thread: "#A855F7",
  threads: "#A855F7",
  youtube: "#FF0033",
  email: "#F59E0B",
  video: "#EF4444",
  podcast: "#8B5CF6",
  seo: "#10B981",
  carousel: "#EC4899",
  pinterest: "#E60023",
};

export function brandColor(key?: string, fallback = "#8B5CF6") {
  if (!key) return fallback;
  return BRAND_COLORS[key] ?? fallback;
}
