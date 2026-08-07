/**
 * Client-safe Canva integration constants (the exact values to paste into the
 * Canva Developer dashboard for the PostSpark integration).
 */
export const CANVA_SITE = "https://postspark.co";

export const CANVA_OAUTH_REDIRECT_URL = `${CANVA_SITE}/auth/canva/callback`;
export const CANVA_RETURN_URL = `${CANVA_SITE}/dashboard/canva-designs`;

export type CanvaSetupUrl = { label: string; field: string; url: string; hint?: string };

export const CANVA_SETUP_URLS: CanvaSetupUrl[] = [
  {
    label: "Authorized redirect URL",
    field: "Canva Developers → Your integration → Authentication → URL 1",
    url: CANVA_OAUTH_REDIRECT_URL,
  },
  {
    label: "Return URL",
    field: "Canva Developers → Your integration → Return navigation → Return URL",
    url: CANVA_RETURN_URL,
    hint: "Where Canva sends users back to PostSpark after they finish designing.",
  },
];

export interface CanvaFormat {
  key: string;
  label: string;
  width: number;
  height: number;
  platform: string;
}

export const CANVA_FORMATS: CanvaFormat[] = [
  { key: "youtube_thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720, platform: "youtube" },
  { key: "linkedin_banner", label: "LinkedIn Banner", width: 1584, height: 396, platform: "linkedin" },
  { key: "instagram_post", label: "Instagram Post", width: 1080, height: 1080, platform: "instagram" },
  { key: "instagram_story", label: "Instagram Story", width: 1080, height: 1920, platform: "instagram" },
  { key: "x_header", label: "X / Twitter Header", width: 1500, height: 500, platform: "twitter" },
  { key: "podcast_cover", label: "Podcast Cover", width: 3000, height: 3000, platform: "podcast" },
];

export const CANVA_CAROUSEL_FORMATS: CanvaFormat[] = [
  { key: "linkedin_carousel", label: "LinkedIn (4:5)", width: 1080, height: 1350, platform: "linkedin" },
  { key: "instagram_post", label: "Instagram (1:1)", width: 1080, height: 1080, platform: "instagram" },
  { key: "x_carousel", label: "X (16:9)", width: 1600, height: 900, platform: "twitter" },
];

export interface CanvaTemplateCategory {
  key: string;
  label: string;
  description: string;
  query: string;
  accent: string;
}

/** Curated Canva template searches — each opens canva.com/templates in a new tab. */
export const CANVA_TEMPLATE_CATEGORIES: CanvaTemplateCategory[] = [
  {
    key: "youtube_thumbnails",
    label: "YouTube thumbnails",
    description: "High-contrast, click-worthy 16:9 covers.",
    query: "youtube thumbnail",
    accent: "#FF4D4D",
  },
  {
    key: "linkedin_carousels",
    label: "LinkedIn carousels",
    description: "Swipeable 4:5 document decks.",
    query: "linkedin carousel",
    accent: "#0A66C2",
  },
  {
    key: "instagram_posts",
    label: "Instagram posts",
    description: "Square posts built for the feed.",
    query: "instagram post",
    accent: "#E1306C",
  },
  {
    key: "instagram_stories",
    label: "Reels & Stories",
    description: "Full-bleed 9:16 vertical frames.",
    query: "instagram story",
    accent: "#8B5CF6",
  },
  {
    key: "quote_graphics",
    label: "Quote graphics",
    description: "Typographic quote cards for any platform.",
    query: "quote",
    accent: "#F59E0B",
  },
  {
    key: "podcast_covers",
    label: "Podcast covers",
    description: "3000×3000 artwork for episodes and shows.",
    query: "podcast cover",
    accent: "#10B981",
  },
  {
    key: "x_headers",
    label: "X headers",
    description: "Profile banners with room for your hook.",
    query: "twitter header",
    accent: "#111827",
  },
  {
    key: "infographics",
    label: "Infographics",
    description: "Data-led explainers that get saved.",
    query: "infographic",
    accent: "#06B6D4",
  },
];

export function canvaTemplateSearchUrl(query: string): string {
  return `https://www.canva.com/templates/?query=${encodeURIComponent(query)}`;
}
