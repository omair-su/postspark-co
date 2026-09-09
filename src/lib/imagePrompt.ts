/**
 * Single source of truth for how a user's prompt becomes an engine prompt.
 *
 * Both the non-streaming RPC path (`image.server.ts`) and the streaming route
 * (`api/studio-stream.ts`) import this, so the same click can no longer produce
 * two different prompts — and every style preset offered in the UI has a real
 * hint here (a missing entry used to silently do nothing).
 *
 * Safe to import from client and server — plain strings only.
 */

export const STYLE_HINTS: Record<string, string> = {
  photorealistic: "ultra-realistic photography, natural lighting, depth of field, 8k",
  "3d-render": "modern 3D render, octane, soft lighting, vibrant colors",
  illustration: "clean vector illustration, flat design, bold colors",
  minimal: "minimalist design, lots of negative space, single focal subject",
  cinematic: "cinematic composition, dramatic lighting, film grain, moody",
  cyberpunk: "cyberpunk aesthetic, neon, holographic, futuristic",
  "oil-painting":
    "traditional oil painting, visible impasto brush strokes, rich pigment, canvas texture, painterly light",
  anime:
    "anime illustration, crisp cel shading, expressive linework, vivid saturated palette, studio-quality key art",
  architectural:
    "architectural visualization, precise perspective lines, clean materials, soft global illumination, editorial interior/exterior photography",
};

export const ASPECT_HINTS: Record<string, string> = {
  square: "square 1:1 composition, perfectly centered",
  portrait: "vertical 9:16 composition for stories/reels",
  landscape: "horizontal 16:9 composition for blog/twitter cards",
};

export const TEMPLATE_HINTS: Record<string, string> = {
  "quote-card":
    "Beautiful quote card design with elegant typography, the quote text rendered clearly and centered, decorative background, social-share ready",
  thumbnail:
    "YouTube thumbnail style, bold large text overlay, high-contrast subject, dramatic lighting, eye-catching colors, click-worthy composition",
  carousel:
    "Instagram carousel slide, bold heading at top, clean modern layout, brand-friendly, designed as slide 1 of a multi-slide post",
  "blog-cover":
    "Blog cover image, clean editorial style, subtle title space at top, professional and modern",
  "product-mockup":
    "Premium product mockup, studio lighting, clean background, marketing-grade",
};

export function buildImagePrompt(
  prompt: string,
  opts: {
    style?: string;
    aspect?: string;
    template?: string;
    negativePrompt?: string;
  } = {},
): string {
  const { style, aspect, template, negativePrompt } = opts;
  const parts = [prompt];
  if (template && TEMPLATE_HINTS[template]) parts.push(TEMPLATE_HINTS[template]);
  if (style && STYLE_HINTS[style]) parts.push(STYLE_HINTS[style]);
  if (aspect && ASPECT_HINTS[aspect]) parts.push(ASPECT_HINTS[aspect]);
  parts.push("High quality, professional, share-worthy social media visual.");
  if (negativePrompt && negativePrompt.trim()) parts.push(`Avoid: ${negativePrompt.trim()}`);
  return parts.join(". ");
}
