// Real brand icon URLs (CDN-hosted). Single source of truth for platform + AI model logos.
import linkedin from "@/assets/icons/linkedin-app-icon.png.asset.json";
import x from "@/assets/icons/x-social-media-logo-icon.png.asset.json";
import xBlack from "@/assets/icons/x-social-media-black-icon.png.asset.json";
import instagram from "@/assets/icons/ig-instagram-icon.png.asset.json";
import tiktok from "@/assets/icons/tiktok-rounded-square-icon.png.asset.json";
import facebook from "@/assets/icons/facebook-round-color-icon.png.asset.json";
import threads from "@/assets/icons/threads-app-icon.png.asset.json";
import whatsapp from "@/assets/icons/whatsapp-color-icon.png.asset.json";
import claude from "@/assets/icons/claude-ai-icon.png.asset.json";
import openai from "@/assets/icons/openai-icon.png.asset.json";
import gemini from "@/assets/icons/google-gemini-icon.png.asset.json";
import elevenlabs from "@/assets/icons/elevenlabs-ai-icon.png.asset.json";
import replicate from "@/assets/icons/replicate-api-icon.png.asset.json";
import shotstack from "@/assets/icons/shotstack.png.asset.json";
import googleDrive from "@/assets/icons/google-drive-color-icon.png.asset.json";
import googleDocs from "@/assets/icons/google-docs-icon.png.asset.json";
import notion from "@/assets/icons/notion-icon.png.asset.json";
import slack from "@/assets/icons/slack-icon.png.asset.json";

/** Real logo files for every platform / model PostSpark integrates with. */
export const BRAND_ICON = {
  linkedin: linkedin.url,
  x: x.url,
  xBlack: xBlack.url,
  instagram: instagram.url,
  tiktok: tiktok.url,
  facebook: facebook.url,
  threads: threads.url,
  whatsapp: whatsapp.url,
  claude: claude.url,
  openai: openai.url,
  gemini: gemini.url,
  elevenlabs: elevenlabs.url,
  replicate: replicate.url,
  shotstack: shotstack.url,
  googleDrive: googleDrive.url,
  googleDocs: googleDocs.url,
  notion: notion.url,
  slack: slack.url,
} as const;

export type BrandIconKey = keyof typeof BRAND_ICON;

export type PublishPlatform = {
  key: string;
  name: string;
  icon?: string;
  /** inline SVG path fallback for platforms without a supplied logo file */
  svg?: { path: string; bg: string };
  status: "live" | "soon";
};

/** The 9 publishing destinations shown on the marketing site. */
export const PUBLISH_PLATFORMS: PublishPlatform[] = [
  { key: "x", name: "X / Twitter", icon: BRAND_ICON.xBlack, status: "live" },
  { key: "instagram", name: "Instagram", icon: BRAND_ICON.instagram, status: "live" },
  { key: "tiktok", name: "TikTok", icon: BRAND_ICON.tiktok, status: "live" },
  {
    key: "youtube",
    name: "YouTube",
    svg: {
      bg: "#FF0000",
      path: "M21.2 8.1a2.6 2.6 0 0 0-1.8-1.8C17.8 5.9 12 5.9 12 5.9s-5.8 0-7.4.4A2.6 2.6 0 0 0 2.8 8.1 27 27 0 0 0 2.4 12a27 27 0 0 0 .4 3.9 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.4.4 7.4.4s5.8 0 7.4-.4a2.6 2.6 0 0 0 1.8-1.8 27 27 0 0 0 .4-3.9 27 27 0 0 0-.4-3.9ZM10.2 14.7V9.3l4.7 2.7-4.7 2.7Z",
    },
    status: "live",
  },
  { key: "facebook", name: "Facebook", icon: BRAND_ICON.facebook, status: "live" },
  { key: "linkedin", name: "LinkedIn", icon: BRAND_ICON.linkedin, status: "live" },
  { key: "threads", name: "Threads", icon: BRAND_ICON.threads, status: "live" },
  { key: "whatsapp", name: "WhatsApp", icon: BRAND_ICON.whatsapp, status: "live" },
  {
    key: "pinterest",
    name: "Pinterest",
    svg: {
      bg: "#E60023",
      path: "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9.2-.8 1.3-5.5 1.3-5.5s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-1 3.9-.3 1.1.6 2 1.7 2 2 0 3.5-2.1 3.5-5.2 0-2.7-1.9-4.6-4.7-4.6-3.2 0-5.1 2.4-5.1 4.9 0 1 .4 2 .9 2.6.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.2 6.5-5.4 6.5-1.1 0-2-.6-2.4-1.2l-.7 2.5c-.2.9-.8 2.1-1.2 2.8A10 10 0 1 0 12 2Z",
    },
    status: "soon",
  },
];

/** AI + service integrations for the "powered by" marquee. */
export const AI_MODELS = [
  { name: "Claude Sonnet", by: "Anthropic", icon: BRAND_ICON.claude, use: "Writing every post in your brand voice" },
  { name: "GPT Image 2", by: "OpenAI", icon: BRAND_ICON.openai, use: "Graphics with perfect text rendering" },
  { name: "Gemini Flash 2.5", by: "Google", icon: BRAND_ICON.gemini, use: "Fast multimodal image tasks" },
  { name: "Flux Pro 1.1", by: "Replicate", icon: BRAND_ICON.replicate, use: "Photorealistic brand imagery" },
  { name: "ElevenLabs", by: "Voice AI", icon: BRAND_ICON.elevenlabs, use: "AI voiceover for Shorts Studio" },
  { name: "Shotstack", by: "Video API", icon: BRAND_ICON.shotstack, use: "Cloud rendering for short-form video" },
  { name: "Google Drive", by: "Import", icon: BRAND_ICON.googleDrive, use: "Importing source documents" },
  { name: "Google Docs", by: "Export", icon: BRAND_ICON.googleDocs, use: "Exporting finished articles" },
  { name: "Notion", by: "Workspace", icon: BRAND_ICON.notion, use: "Pulling notes into the Repurpose Studio" },
  { name: "Slack", by: "Notify", icon: BRAND_ICON.slack, use: "Team approvals and publish alerts" },
] as const;
