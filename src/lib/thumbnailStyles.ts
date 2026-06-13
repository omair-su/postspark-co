export type ThumbnailStyleId =
  | "mrbeast"
  | "cinematic"
  | "editorial"
  | "tech"
  | "faceless"
  | "podcast"
  | "luxury"
  | "playful";

export interface ThumbnailStyle {
  id: ThumbnailStyleId;
  label: string;
  emoji: string;
  // High-octane descriptor injected into the mega-prompt
  visualDirective: string;
  defaultHeadlineColor: string;
  defaultAccentColor: string;
  recommendedFor: ("youtube" | "twitter-header" | "linkedin-banner" | "blog-cover" | "podcast")[];
}

export const THUMBNAIL_STYLES: ThumbnailStyle[] = [
  {
    id: "mrbeast",
    label: "MrBeast Bold",
    emoji: "🔥",
    visualDirective:
      "MrBeast-style YouTube thumbnail: extremely bold giant uppercase headline in white with thick black outline and yellow highlight color, surprised/shocked human subject pushed to one side, hyper-saturated colors, red arrow or circle drawing attention to subject, dramatic blue/red contrast, glow lighting, 'I gave away $10,000' visual energy",
    defaultHeadlineColor: "#ffffff",
    defaultAccentColor: "#facc15",
    recommendedFor: ["youtube"],
  },
  {
    id: "cinematic",
    label: "Cinematic",
    emoji: "🎬",
    visualDirective:
      "Cinematic teal-and-orange color grade, dramatic chiaroscuro lighting, anamorphic lens flares, shallow depth of field, mood like a movie poster, premium editorial text treatment using a clean condensed sans-serif",
    defaultHeadlineColor: "#ffffff",
    defaultAccentColor: "#fb923c",
    recommendedFor: ["youtube", "blog-cover", "twitter-header"],
  },
  {
    id: "editorial",
    label: "Editorial",
    emoji: "📰",
    visualDirective:
      "New York Times / Stripe Press editorial style, elegant serif headline, generous negative space, sophisticated muted color palette, refined typography hierarchy, magazine-quality composition",
    defaultHeadlineColor: "#1a1a2e",
    defaultAccentColor: "#7c3aed",
    recommendedFor: ["blog-cover", "linkedin-banner"],
  },
  {
    id: "tech",
    label: "Tech / SaaS",
    emoji: "💻",
    visualDirective:
      "Modern SaaS marketing aesthetic, dark mode UI vibes, electric purple and cyan gradient, geometric grid background, glass-morphism cards, clean Inter font headline, Linear / Vercel design quality",
    defaultHeadlineColor: "#ffffff",
    defaultAccentColor: "#7c3aed",
    recommendedFor: ["youtube", "blog-cover", "linkedin-banner", "twitter-header"],
  },
  {
    id: "faceless",
    label: "Faceless",
    emoji: "👤",
    visualDirective:
      "Faceless YouTube thumbnail (no people, no faces), bold abstract visual metaphor for the topic, dark background with one hero icon or object, oversized text occupies 60% of the frame, high contrast minimalism",
    defaultHeadlineColor: "#ffffff",
    defaultAccentColor: "#22d3ee",
    recommendedFor: ["youtube", "blog-cover"],
  },
  {
    id: "podcast",
    label: "Podcast Cover",
    emoji: "🎙️",
    visualDirective:
      "Premium podcast cover art, centered headshot with studio lighting, podcast name in elegant typography, microphone or audio waveform decorative element, broadcast-quality polish",
    defaultHeadlineColor: "#ffffff",
    defaultAccentColor: "#facc15",
    recommendedFor: ["podcast"],
  },
  {
    id: "luxury",
    label: "Luxury",
    emoji: "✨",
    visualDirective:
      "Black-and-gold luxury aesthetic, premium dark background, gold foil accents on typography, marble or velvet texture, high-end fashion magazine feel",
    defaultHeadlineColor: "#fde68a",
    defaultAccentColor: "#d4af37",
    recommendedFor: ["youtube", "blog-cover", "linkedin-banner"],
  },
  {
    id: "playful",
    label: "Playful",
    emoji: "🎨",
    visualDirective:
      "Bright pastel colors, hand-drawn doodle elements, rounded sans-serif headline, fun confetti or sparkle decoration, friendly approachable feel like Duolingo or Notion marketing",
    defaultHeadlineColor: "#1a1a2e",
    defaultAccentColor: "#f97316",
    recommendedFor: ["youtube", "blog-cover", "twitter-header"],
  },
];

// One-click starter templates: click → fills headline + subhead + style + bg prompt.
export interface ThumbnailStarter {
  id: string;
  preset: "youtube" | "twitter-header" | "linkedin-banner" | "blog-cover" | "podcast";
  style: ThumbnailStyleId;
  headline: string;
  subhead: string;
  bgPrompt: string;
  emoji: string;
  label: string;
}

export const THUMBNAIL_STARTERS: ThumbnailStarter[] = [
  {
    id: "10k-month",
    preset: "youtube",
    style: "mrbeast",
    headline: "I MADE $10K IN 30 DAYS",
    subhead: "Here's exactly how",
    bgPrompt: "Shocked young entrepreneur surrounded by floating dollar bills, dramatic studio lighting",
    emoji: "💰",
    label: "Money milestone",
  },
  {
    id: "i-tried-30",
    preset: "youtube",
    style: "mrbeast",
    headline: "I TRIED THIS FOR 30 DAYS",
    subhead: "The result shocked me",
    bgPrompt: "Surprised face with hands on cheeks, before/after split, bright colorful background",
    emoji: "🔥",
    label: "30-day challenge",
  },
  {
    id: "stop-doing",
    preset: "youtube",
    style: "tech",
    headline: "STOP DOING THIS IN 2026",
    subhead: "Do this instead →",
    bgPrompt: "Red X over old method, green check over new method, modern split layout",
    emoji: "⛔",
    label: "Stop-doing-this",
  },
  {
    id: "hidden-truth",
    preset: "youtube",
    style: "cinematic",
    headline: "The Hidden Truth About AI",
    subhead: "Nobody is telling you",
    bgPrompt: "Mysterious silhouette with glowing AI brain, dark moody cinematic atmosphere",
    emoji: "🤖",
    label: "Hidden truth",
  },
  {
    id: "x-in-y",
    preset: "youtube",
    style: "faceless",
    headline: "$0 → $1M IN 90 DAYS",
    subhead: "Full breakdown inside",
    bgPrompt: "Massive arrow going up and to the right, glowing chart, dark navy background",
    emoji: "📈",
    label: "Zero to milestone",
  },
  {
    id: "blog-launch",
    preset: "blog-cover",
    style: "editorial",
    headline: "How We Launched in 7 Days",
    subhead: "A founder's playbook",
    bgPrompt: "Clean editorial workspace, MacBook with code, soft natural window light",
    emoji: "📝",
    label: "Founder playbook (blog)",
  },
  {
    id: "linkedin-hire",
    preset: "linkedin-banner",
    style: "tech",
    headline: "We're hiring 5 engineers",
    subhead: "Remote · Senior · Equity",
    bgPrompt: "Modern team collaborating around laptops, soft brand-gradient background",
    emoji: "💼",
    label: "Hiring banner",
  },
  {
    id: "podcast-episode",
    preset: "podcast",
    style: "podcast",
    headline: "Ep. 12 — Scaling to $1M ARR",
    subhead: "with [Guest Name]",
    bgPrompt: "Confident podcast guest portrait under spotlight, premium microphone in foreground",
    emoji: "🎙️",
    label: "Podcast episode cover",
  },
];

// Build the finished-thumbnail mega-prompt for gpt-image-2.
export function buildFinishedThumbnailPrompt(opts: {
  headline: string;
  subhead?: string;
  styleId: ThumbnailStyleId;
  preset: "youtube" | "twitter-header" | "linkedin-banner" | "blog-cover" | "podcast";
  userPrompt?: string;
  headlineColor?: string;
  accentColor?: string;
  position?: "center" | "top" | "bottom" | "bottom-left";
}): string {
  const style = THUMBNAIL_STYLES.find((s) => s.id === opts.styleId) || THUMBNAIL_STYLES[0];
  const dimsLine =
    opts.preset === "youtube"
      ? "16:9 YouTube thumbnail (1280x720 final export)"
      : opts.preset === "twitter-header"
        ? "wide 3:1 banner for Twitter / X header (1500x500)"
        : opts.preset === "linkedin-banner"
          ? "ultra-wide LinkedIn banner (1584x396)"
          : opts.preset === "blog-cover"
            ? "16:9 blog hero cover (1920x1080)"
            : "square 1:1 podcast cover (1400x1400)";

  const positionHint =
    opts.position === "center"
      ? "Center-align the headline horizontally and vertically."
      : opts.position === "top"
        ? "Place the headline at the top of the frame."
        : opts.position === "bottom"
          ? "Place the headline at the bottom of the frame."
          : "Place the headline in the bottom-left of the frame, leaving the right side for the subject.";

  return [
    `Design a FINISHED, ready-to-publish ${dimsLine}.`,
    `The image MUST clearly render this exact text as the main headline (no typos, large and legible): "${opts.headline.trim()}".`,
    opts.subhead?.trim()
      ? `Add this smaller subhead exactly as written: "${opts.subhead.trim()}".`
      : "",
    positionHint,
    `Headline color: ${opts.headlineColor || style.defaultHeadlineColor}. Accent / subhead color: ${opts.accentColor || style.defaultAccentColor}.`,
    `Visual style: ${style.visualDirective}.`,
    opts.userPrompt?.trim()
      ? `Additional creative direction from the user: ${opts.userPrompt.trim()}.`
      : "",
    "The composition must be self-contained and complete — DO NOT leave empty placeholder space for text overlays. The text is part of the image.",
    "Negative constraints: no watermarks, no logos, no captions outside the headline/subhead, no borders, no progress bars, no UI chrome, no website URLs, no extra paragraphs of body text.",
    "Final output should look like it was designed by a top YouTube channel art director — polished, click-worthy, share-ready.",
  ]
    .filter(Boolean)
    .join(" ");
}
