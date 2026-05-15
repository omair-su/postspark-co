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

export async function rewriteSlideClaude(opts: {
  title: string;
  body: string;
  kind: "cover" | "content" | "cta";
  instruction?: string;
  tone?: string;
}): Promise<{ title: string; body: string; error?: string }> {
  const sys = `You rewrite a single carousel slide. Return strict JSON only: {"title":"...","body":"..."}.
Rules:
- Keep slide kind: ${opts.kind}.
- Title ≤ 60 chars, punchy, no markdown.
- Body ≤ 220 chars, plain text, 1–3 short sentences.
${opts.tone ? `- Tone: ${opts.tone}.` : ""}
${opts.instruction ? `- Follow this user instruction: ${opts.instruction}.` : "- Make it sharper, more scroll-stopping, and clearer."}`;
  const user = `Current title: ${opts.title}\nCurrent body: ${opts.body}\n\nRewrite now.`;
  const res = await callClaude({ systemPrompt: sys, userPrompt: user, maxTokens: 500 });
  if (res.error) return { title: opts.title, body: opts.body, error: res.error };
  const m = res.text.match(/\{[\s\S]*\}/);
  if (!m) return { title: opts.title, body: opts.body, error: "Could not parse rewrite" };
  try {
    const j = JSON.parse(m[0]);
    return { title: String(j.title || opts.title).slice(0, 200), body: String(j.body || opts.body).slice(0, 800) };
  } catch {
    return { title: opts.title, body: opts.body, error: "Invalid rewrite JSON" };
  }
}
