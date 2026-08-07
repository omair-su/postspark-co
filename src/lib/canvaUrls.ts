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
