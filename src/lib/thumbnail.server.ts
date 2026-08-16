/**
 * Thumbnail & Cover Generator — server-only logic.
 * Claude does the creative direction (headlines + image prompt engineering),
 * the image models render the artwork.
 */
import { callClaudeWithTool } from "@/lib/anthropic.server";
import { scrapeUrl } from "@/lib/import.server";
import { THUMBNAIL_STYLES, type ThumbnailStyleId } from "@/lib/thumbnailStyles";

export interface ThumbnailConcept {
  headlines: string[];
  subheads: string[];
  style: ThumbnailStyleId;
  visualPrompt: string;
  topic: string;
  sourceTitle?: string;
  words?: number;
  notice?: string;
  error?: string;
}

const STYLE_IDS = THUMBNAIL_STYLES.map((s) => s.id);

const SYSTEM = `You are a world-class YouTube thumbnail art director and direct-response copywriter.
You design thumbnails that win the click without being clickbait-dishonest.

Rules for headlines:
- 2 to 5 words each. Under 30 characters. No ending punctuation.
- Curiosity, specificity, or stakes. Numbers and contrast beat adjectives.
- ALL headlines must be renderable as huge text on a small mobile thumbnail.

Rules for the visual prompt:
- Describe ONE clear focal subject, the background, lighting, color palette and mood.
- Never mention text, typography, letters or words in the visual prompt.
- Be concrete and photographic. 60-90 words.`;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string", description: "The core topic in <=10 words" },
    headlines: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 6,
      description: "5 punchy thumbnail headlines, 2-5 words each",
    },
    subheads: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
      description: "3 optional supporting lines, max 6 words each",
    },
    style: { type: "string", enum: STYLE_IDS, description: "Best matching visual style preset" },
    visual_prompt: { type: "string", description: "Image-model prompt for the artwork, no text/typography" },
  },
  required: ["topic", "headlines", "subheads", "style", "visual_prompt"],
};

interface ClaudeConcept {
  topic: string;
  headlines: string[];
  subheads: string[];
  style: string;
  visual_prompt: string;
}

function clean(list: unknown, max: number): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, ""))
    .filter(Boolean)
    .slice(0, max);
}

export async function buildThumbnailConcept(input: {
  mode: "youtube" | "idea";
  url?: string;
  idea?: string;
  preset: string;
}): Promise<ThumbnailConcept> {
  let brief = "";
  let sourceTitle: string | undefined;
  let words: number | undefined;
  let notice: string | undefined;

  if (input.mode === "youtube") {
    if (!input.url) return { ...empty(), error: "Paste a YouTube URL first." };
    const res = await scrapeUrl(input.url);
    if (res.error && !res.text) return { ...empty(), error: res.error };
    sourceTitle = res.title;
    words = res.words ?? (res.text ? res.text.trim().split(/\s+/).length : 0);
    if ((words ?? 0) < 60) {
      notice = "No transcript available — working from the video title only.";
    }
    brief = [
      `Video title: ${res.title || "(unknown)"}`,
      res.text ? `Transcript excerpt:\n${res.text.slice(0, 6000)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  } else {
    if (!input.idea || input.idea.trim().length < 4)
      return { ...empty(), error: "Describe your video or post idea first." };
    brief = `Creator's idea: ${input.idea.trim()}`;
  }

  const { data, error } = await callClaudeWithTool<ClaudeConcept>({
    systemPrompt: SYSTEM,
    userPrompt: `Design thumbnail concepts for a ${input.preset} asset.\n\n${brief}`,
    toolName: "thumbnail_concept",
    toolDescription: "Return thumbnail headlines, a style pick and an image prompt.",
    toolSchema: TOOL_SCHEMA,
    maxTokens: 1500,
  });

  if (error || !data) return { ...empty(), sourceTitle, words, error: error || "Could not build concepts." };

  const style = (STYLE_IDS as string[]).includes(data.style)
    ? (data.style as ThumbnailStyleId)
    : "mrbeast";

  return {
    topic: data.topic || sourceTitle || "",
    headlines: clean(data.headlines, 6),
    subheads: clean(data.subheads, 3),
    style,
    visualPrompt: (data.visual_prompt || "").trim(),
    sourceTitle,
    words,
    notice,
  };
}

function empty(): ThumbnailConcept {
  return { headlines: [], subheads: [], style: "mrbeast", visualPrompt: "", topic: "" };
}
