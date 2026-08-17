import { callClaude, callClaudeWithTool } from "./anthropic.server";

export type SlideKind =
  | "cover" | "hook" | "insight" | "example" | "list" | "quote" | "stat" | "cta";

export interface CarouselSlide {
  title: string;
  body: string;
  kind: SlideKind;
  label?: string;
  bullets?: string[];
  imagePrompt?: string;
}

export interface CarouselResult {
  slides: CarouselSlide[];
  hashtags: string[];
  caption: string;
  error?: string;
}

const KINDS = ["cover", "hook", "insight", "example", "list", "quote", "stat", "cta"];

const SCHEMA = {
  type: "object",
  properties: {
    caption: {
      type: "string",
      description:
        "Publish-ready caption for the post the carousel is attached to. 3-5 sentences, opens with a hook line, ends with a question or CTA. No hashtags.",
    },
    hashtags: {
      type: "array",
      items: { type: "string" },
      description: "8-12 lowercase hashtags without the # symbol, mixing broad and niche.",
    },
    slides: {
      type: "array",
      minItems: 5,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: KINDS },
          label: { type: "string", description: "Short eyebrow label, 1-3 words (e.g. 'Step 2', 'Myth', 'The data')." },
          title: { type: "string", description: "Headline for the slide, 20-80 characters. Specific, not generic." },
          body: {
            type: "string",
            description:
              "Substance of the slide: 180-420 characters of plain text, 2-4 short sentences. Must contain a concrete detail, number, example or mechanism. No markdown, no emojis, no hashtags.",
          },
          bullets: {
            type: "array",
            items: { type: "string" },
            description: "Optional 2-4 very short supporting lines (max 60 chars each). Use for list/steps slides.",
          },
          imagePrompt: {
            type: "string",
            description:
              "Abstract, textural background art prompt for this slide (no text, no people's faces, no logos). One sentence.",
          },
        },
        required: ["kind", "title", "body"],
      },
    },
  },
  required: ["slides", "hashtags", "caption"],
};

const FRAMEWORK_RULES: Record<string, string> = {
  listicle:
    "Structure: cover states the number and payoff. Each middle slide is ONE numbered lesson with a concrete example. Label each with 'No. 1', 'No. 2', etc.",
  myth:
    "Structure: each middle slide names a widely believed MYTH in the title, then the body explains what is actually true and why. Label alternates 'Myth' / 'Truth'.",
  before_after:
    "Structure: each middle slide contrasts the old way with the new way. Body must show the specific mechanism that changes the outcome. Labels like 'Before' / 'After'.",
  steps:
    "Structure: a repeatable process. Middle slides are sequential steps with the exact action to take and the signal that the step worked. Labels 'Step 1'…",
  case_study:
    "Structure: situation → constraint → action → result → takeaway. Use real-sounding specifics (timeframes, percentages, tools). Never invent named brands or fake quotes.",
  contrarian:
    "Structure: one strong opinion stated on the cover, then each middle slide defends it with an argument and evidence, and one slide steelmans the objection.",
  data_story:
    "Structure: each middle slide leads with a number or benchmark (kind='stat') and explains what it means for the reader. Cite the kind of source, never a fabricated URL.",
};

function buildSystemPrompt(opts: {
  slideCount: number;
  framework: string;
  tone?: string;
  audience?: string;
  brandName?: string | null;
  brandVoice?: string | null;
  depth: "standard" | "deep";
}) {
  const rule = FRAMEWORK_RULES[opts.framework] || FRAMEWORK_RULES.listicle;
  const bodyRange = opts.depth === "deep" ? "260-420" : "180-340";

  return `You are one of the best-paid social carousel writers alive. You write LinkedIn and Instagram carousels that get saved, shared and quoted.

Write exactly ${opts.slideCount} slides.

${rule}

Non-negotiable quality rules:
- Slide 1 has kind="cover": a hook headline that makes scrolling feel expensive. Body = one sharp promise sentence.
- Slide 2 may be kind="hook" — sharpen the stakes or name the real problem.
- Final slide has kind="cta": one clear ask (follow, save, comment a keyword). Nothing vague.
- EVERY body is ${bodyRange} characters. This is a hard floor, not a target. Thin, generic slides are a failure.
- Every body must contain at least one of: a number, a timeframe, a named mechanism, a concrete example, or a counter-intuitive detail.
- NEVER pad with filler like "in today's fast-paced world", "the key is consistency", "at the end of the day". Cut every sentence that could appear in any other carousel.
- Titles are specific and 20-80 characters. No clickbait that the body does not pay off.
- Plain text only: no markdown, no asterisks, no emojis, no hashtags inside slides.
- Use bullets ONLY when the slide is genuinely a list; keep each bullet under 60 characters.
- Vary slide kinds across insight / example / list / quote / stat so the deck has rhythm.
- Each imagePrompt describes abstract texture, light, material or gradient art only — never text, faces, or logos.
${opts.brandName ? `- The author's brand is "${opts.brandName}". Write as that brand.` : ""}
${opts.tone ? `- Tone: ${opts.tone}. Commit to it fully.` : ""}
${opts.audience ? `- Audience: ${opts.audience}. Assume they already know the basics — give them the level above.` : ""}
${opts.brandVoice ? `- Match this brand voice profile:\n${opts.brandVoice.slice(0, 1200)}` : ""}`;
}

export async function generateCarousel({
  topic,
  audience,
  tone,
  slideCount,
  framework = "listicle",
  depth = "deep",
  brandName,
  brandVoice,
}: {
  topic: string;
  audience?: string;
  tone?: string;
  slideCount: number;
  framework?: string;
  depth?: "standard" | "deep";
  brandName?: string | null;
  brandVoice?: string | null;
}): Promise<CarouselResult> {
  const system = buildSystemPrompt({ slideCount, framework, tone, audience, brandName, brandVoice, depth });

  // Scale the budget with deck size so Claude is never forced to compress.
  const maxTokens = Math.min(8000, 1400 + slideCount * 520);

  const result = await callClaudeWithTool<{
    slides: CarouselSlide[];
    hashtags: string[];
    caption: string;
  }>({
    systemPrompt: system,
    userPrompt: `Topic / angle: ${topic}

Write the full ${slideCount}-slide carousel now. Go deep on every slide — no summaries, no repetition between slides.`,
    toolName: "emit_carousel",
    toolDescription: "Emit the structured carousel deck.",
    toolSchema: SCHEMA,
    maxTokens,
  });

  if (result.error || !result.data) {
    return { slides: [], hashtags: [], caption: "", error: result.error || "No carousel returned." };
  }

  const slides = (result.data.slides || []).map((s, i, arr) => ({
    kind: (KINDS.includes(s.kind) ? s.kind : i === 0 ? "cover" : i === arr.length - 1 ? "cta" : "insight") as SlideKind,
    title: String(s.title || "").trim().slice(0, 160),
    body: String(s.body || "").trim().slice(0, 900),
    label: s.label ? String(s.label).trim().slice(0, 40) : undefined,
    bullets: Array.isArray(s.bullets)
      ? s.bullets.map((b) => String(b).trim().slice(0, 90)).filter(Boolean).slice(0, 4)
      : undefined,
    imagePrompt: s.imagePrompt ? String(s.imagePrompt).trim().slice(0, 400) : undefined,
  }));

  return {
    slides,
    hashtags: (result.data.hashtags || [])
      .map((h) => h.replace(/^#/, "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 30),
    caption: String(result.data.caption || "").trim(),
  };
}

export type SlideAction = "rewrite" | "shorten" | "expand" | "punchier" | "concrete";

const ACTION_RULES: Record<SlideAction, string> = {
  rewrite: "Rewrite it sharper and clearer while keeping the same point.",
  shorten: "Tighten it. Same point, 40% fewer words, nothing vague added.",
  expand: "Go deeper: add a concrete mechanism, number or example. Target 320-420 characters of body.",
  punchier: "Make the title stop the scroll and the body land harder. Short sentences, strong verbs.",
  concrete: "Replace every abstraction with a specific: a number, a timeframe, a tool, or a real scenario.",
};

export async function rewriteSlideClaude(opts: {
  title: string;
  body: string;
  kind: string;
  bullets?: string[];
  action?: SlideAction;
  instruction?: string;
  tone?: string;
  topic?: string;
}): Promise<{ title: string; body: string; bullets?: string[]; error?: string }> {
  const action = opts.action || "rewrite";
  const sys = `You rewrite a single carousel slide. Return STRICT JSON only, no prose:
{"title":"...","body":"...","bullets":["..."]}

Rules:
- Keep the slide's role: ${opts.kind}.
- ${ACTION_RULES[action]}
- Title 20-80 characters, plain text, no markdown or emojis.
- Body 180-420 characters unless shortening was requested, then 120-240.
- bullets is optional; include only if the slide is genuinely a list (max 4, each under 60 chars).
${opts.tone ? `- Tone: ${opts.tone}.` : ""}
${opts.topic ? `- Deck topic: ${opts.topic}.` : ""}
${opts.instruction ? `- Follow this user instruction above all: ${opts.instruction}` : ""}`;

  const user = `Current title: ${opts.title}
Current body: ${opts.body}
${opts.bullets?.length ? `Current bullets: ${opts.bullets.join(" | ")}` : ""}

Rewrite now.`;

  const res = await callClaude({ systemPrompt: sys, userPrompt: user, maxTokens: 900 });
  if (res.error) return { title: opts.title, body: opts.body, error: res.error };
  const m = res.text.match(/\{[\s\S]*\}/);
  if (!m) return { title: opts.title, body: opts.body, error: "Could not parse rewrite" };
  try {
    const j = JSON.parse(m[0]);
    return {
      title: String(j.title || opts.title).slice(0, 160),
      body: String(j.body || opts.body).slice(0, 900),
      bullets: Array.isArray(j.bullets)
        ? j.bullets.map((b: unknown) => String(b).slice(0, 90)).filter(Boolean).slice(0, 4)
        : undefined,
    };
  } catch {
    return { title: opts.title, body: opts.body, error: "Invalid rewrite JSON" };
  }
}

/** Fresh caption + hashtags for an edited deck. */
export async function regenerateCaption(opts: {
  topic: string;
  slides: { title: string; body: string }[];
  tone?: string;
}): Promise<{ caption: string; hashtags: string[]; error?: string }> {
  const sys = `You write the caption that ships alongside a carousel. Return STRICT JSON only:
{"caption":"...","hashtags":["..."]}
Rules:
- Caption: 3-5 sentences. First line is a standalone hook. Ends with a question or a clear CTA. No hashtags inside the caption.
- hashtags: 8-12 lowercase tags without '#', mixing broad and niche.
${opts.tone ? `- Tone: ${opts.tone}.` : ""}`;
  const outline = opts.slides.map((s, i) => `${i + 1}. ${s.title} — ${s.body.slice(0, 140)}`).join("\n");
  const res = await callClaude({
    systemPrompt: sys,
    userPrompt: `Topic: ${opts.topic}\n\nDeck outline:\n${outline}\n\nWrite the caption now.`,
    maxTokens: 900,
  });
  if (res.error) return { caption: "", hashtags: [], error: res.error };
  const m = res.text.match(/\{[\s\S]*\}/);
  if (!m) return { caption: "", hashtags: [], error: "Could not parse caption" };
  try {
    const j = JSON.parse(m[0]);
    return {
      caption: String(j.caption || "").slice(0, 3000),
      hashtags: Array.isArray(j.hashtags)
        ? j.hashtags.map((h: unknown) => String(h).replace(/^#/, "").toLowerCase()).filter(Boolean).slice(0, 30)
        : [],
    };
  } catch {
    return { caption: "", hashtags: [], error: "Invalid caption JSON" };
  }
}
