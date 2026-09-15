/**
 * Single source of truth for the AI model ids used by the Image Studio.
 *
 * Model catalogs move fast — every stale id here turns into a silent 400 from
 * the gateway that surfaces as a generic "generation failed" toast. Keep every
 * image/text model id for the studio in this file so it can only drift once.
 *
 * Safe to import from client and server — identifiers only, no secrets.
 */

/** Gateway image models, in fallback order (highest quality first). */
export const IMAGE_GATEWAY_MODELS = [
  "google/gemini-3-pro-image",
  "google/gemini-3.1-flash-image",
] as const;

/** Streaming studio route: quality tier → gateway image model. */
export const STREAM_IMAGE_MODEL_HD = "google/gemini-3-pro-image";
export const STREAM_IMAGE_MODEL_FAST = "google/gemini-3.1-flash-image";

/** Text model for prompt enhancement, carousel copy planning. */
export const STUDIO_TEXT_MODEL = "google/gemini-3.7-flash";

/** Cheap/high-volume text model for safety checks, captions, health pings. */
export const STUDIO_TEXT_MODEL_LITE = "google/gemini-3.1-flash-lite";

/** OpenAI image models, in fallback order. */
export const OPENAI_IMAGE_MODELS = ["gpt-image-2", "gpt-image-1"] as const;

export const IMAGE_MODEL_IDS = [
  "auto", "flux", "gpt", "gemini", "ideogram", "flux-ultra", "imagen",
] as const;

export type ImageModelId = (typeof IMAGE_MODEL_IDS)[number];

export const IMAGE_MODEL_CREDIT_WEIGHTS: Record<ImageModelId, number> = {
  auto: 1,
  flux: 1,
  gpt: 1,
  gemini: 1,
  ideogram: 1,
  "flux-ultra": 2,
  imagen: 2,
};

export const REPLICATE_IMAGE_MODELS = {
  ideogram: "ideogram-ai/ideogram-v3-turbo",
  "flux-ultra": "black-forest-labs/flux-1.1-pro-ultra",
  imagen: "google/imagen-4",
} as const;
