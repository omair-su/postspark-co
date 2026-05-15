import { callClaude, callClaudeWithTool } from "./anthropic.server";

export interface CarouselSlide {
  title: string;
  body: string;
  kind: "cover" | "content" | "cta";
}

export interface CarouselResult {
  slides: CarouselSlide[];
  hashtags: string[];
  caption: string;
  error?: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    caption: { type: "string", description: "1-2 sentence post caption to publish alongside the carousel." },
    hashtags: {
      type: "array",
      items: { type: "string" },
      description: "5-8 lowercase hashtags without the # symbol.",
    },
    slides: {
      type: "array",
      minItems: 6,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short bold headline, max ~60 chars." },
          body: { type: "string", description: "Plain-text body, 1-3 sentences. No markdown." },
          kind: { type: "string", enum: ["cover", "content", "cta"] },
        },
        required: ["title", "body", "kind"],
      },
    },
  },
  required: ["slides", "hashtags", "caption"],
};

export async function generateCarousel({
  topic,
  audience,
  tone,
  slideCount,
  brandName,
}: {
  topic: string;
  audience?: string;
  tone?: string;
  slideCount: number;
  brandName?: string | null;
}): Promise<CarouselResult> {
  const system = `You are a top-tier social-media carousel writer (LinkedIn / Instagram).
Write a viral-quality ${slideCount}-slide carousel.

Rules:
- Slide 1 (kind=cover): Hook headline that stops scroll. Body = 1 short sentence subtitle.
- Middle slides (kind=content): One clear idea per slide. Title is a punchy mini-headline. Body is 1-3 short sentences, plain text, no markdown, no emojis in body.
- Last slide (kind=cta): Clear call to action (follow, save, comment).
- Keep titles ≤ 60 chars, bodies ≤ 220 chars.
- No hashtags inside slides — put hashtags in the hashtags field.
${brandName ? `- The brand is "${brandName}".` : ""}
${tone ? `- Tone: ${tone}.` : ""}
${audience ? `- Audience: ${audience}.` : ""}`;

  const result = await callClaudeWithTool<{
    slides: CarouselSlide[];
    hashtags: string[];
    caption: string;
  }>({
    systemPrompt: system,
    userPrompt: `Topic: ${topic}\n\nGenerate the carousel now.`,
    toolName: "emit_carousel",
    toolDescription: "Emit the structured carousel.",
    toolSchema: SCHEMA,
    maxTokens: 3000,
  });

  if (result.error || !result.data) {
    return { slides: [], hashtags: [], caption: "", error: result.error || "No carousel returned." };
  }
  return {
    slides: result.data.slides || [],
    hashtags: (result.data.hashtags || []).map((h) => h.replace(/^#/, "").trim()).filter(Boolean),
    caption: result.data.caption || "",
  };
}
