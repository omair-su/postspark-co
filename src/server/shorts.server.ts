import { callClaudeWithTool } from "./anthropic.server";

export interface ShortsHook {
  text: string;
  score: number;
  score_reason: string;
}

export interface ShortsShot {
  timestamp: string; // "0:00–0:02"
  voiceover: string;
  on_screen_caption: string;
  b_roll: string;
  broll_search_query: string;
}

export interface ShortsScript {
  hooks: ShortsHook[];
  shots: ShortsShot[];
  cta: string;
  title: string;
  description: string;
  hashtags: string[];
  audio_category: string;
}

interface Opts {
  inputText: string;
  platform: "tiktok" | "shorts" | "reels";
  duration: 30 | 45 | 60;
  angle?: string;
  brandVoiceSummary?: string;
  language?: string;
}

const PLATFORM_RULES: Record<string, string> = {
  tiktok:
    "TikTok native. Hooks lean punchy + slightly chaotic. Casual lowercase captions are fine. Hashtags: 4 broad + 4 niche.",
  shorts:
    "YouTube Shorts. Hooks lean curiosity-gap. Captions feel like a thumbnail. Hashtags include #Shorts.",
  reels:
    "Instagram Reels. Hooks lean aspirational/relatable. Captions are tight, often emoji-led. Hashtags split niche/broad evenly.",
};

const toolSchema = {
  type: "object",
  properties: {
    hooks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          score: { type: "number", minimum: 0, maximum: 100 },
          score_reason: { type: "string" },
        },
        required: ["text", "score", "score_reason"],
      },
      minItems: 3,
      maxItems: 3,
    },
    shots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          timestamp: { type: "string" },
          voiceover: { type: "string" },
          on_screen_caption: { type: "string" },
          b_roll: { type: "string" },
          broll_search_query: { type: "string" },
        },
        required: ["timestamp", "voiceover", "on_screen_caption", "b_roll", "broll_search_query"],
      },
    },
    cta: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    hashtags: { type: "array", items: { type: "string" }, minItems: 8, maxItems: 8 },
    audio_category: { type: "string" },
  },
  required: ["hooks", "shots", "cta", "title", "description", "hashtags", "audio_category"],
};

export async function generateShortsScript(opts: Opts): Promise<{ script: ShortsScript | null; error?: string }> {
  const platformRules = PLATFORM_RULES[opts.platform] || PLATFORM_RULES.tiktok;
  const voiceBlock = opts.brandVoiceSummary?.trim()
    ? `\n\nMatch this brand voice exactly:\n${opts.brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are a viral short-form video director. You have studied 10,000+ top-performing TikToks, Reels, and Shorts.

TASK: Turn the user's source content into a complete, ready-to-record ${opts.duration}s vertical video script for ${opts.platform.toUpperCase()}.

CRITICAL: You MUST respond by calling the return_shorts_script tool with the full structured output. Never reply with plain text.

PLATFORM RULES:
${platformRules}

OUTPUT REQUIREMENTS:
- hooks: EXACTLY 3 hook variants for the first 1.5 seconds. Each under 9 words. Pattern-interrupt openings only ("Stop doing X", "Nobody talks about", a stat, a question that creates tension). NEVER start with "I" or "In this video". Each hook has a virality score 0-100 and a one-sentence reason for the score.
- shots: chronological shot list covering the full ${opts.duration} seconds. Each shot has timestamp ("0:00–0:03"), 1-2 sentence voiceover in natural spoken language, short on-screen caption (≤7 words), concrete b-roll suggestion, AND broll_search_query (3-6 words, stock-footage friendly, e.g. "person typing laptop coffee shop").
- cta: single sentence call-to-action on the last shot. Specific action only.
- title: under 60 chars, search-optimized.
- description: 1-2 sentence caption, conversational.
- hashtags: exactly 8, mixed broad + niche, lowercase, no leading #.
- audio_category: ONE of: "trending upbeat", "trending dramatic", "trending lo-fi", "voiceover only", "original audio".

QUALITY RULES:
- Every shot earns its airtime.
- Voiceover is spoken English, not written copy.
- The angle "${opts.angle || "value-first"}" must run through the whole script.
- Output language: ${opts.language || "English"}.${voiceBlock}`;

  const userPrompt = `Source content to repurpose:\n\n${opts.inputText.slice(0, 8000)}\n\nCall return_shorts_script now with the complete ${opts.duration}s ${opts.platform} script.`;

  let result = await callClaudeWithTool<ShortsScript>({
    systemPrompt,
    userPrompt,
    toolName: "return_shorts_script",
    toolDescription: "Return a complete vertical-video script ready to record.",
    toolSchema,
    maxTokens: 6000,
  });

  if (!result.data && result.error === "No structured response returned.") {
    console.warn("[shorts] retry after empty tool block");
    result = await callClaudeWithTool<ShortsScript>({
      systemPrompt: systemPrompt + "\n\nREMINDER: You MUST call the tool. Plain-text responses are forbidden.",
      userPrompt,
      toolName: "return_shorts_script",
      toolDescription: "Return a complete vertical-video script ready to record.",
      toolSchema,
      maxTokens: 6000,
    });
  }

  if (result.error || !result.data) {
    console.error("[shorts] generation failed:", result.error);
    return { script: null, error: result.error || "Generation failed. Please try again." };
  }
  return { script: result.data };
}

const SERIES_ANGLES = [
  "Episode 1: The hook / contrarian take that grabs attention",
  "Episode 2: The deep-dive / how-it-actually-works breakdown",
  "Episode 3: The mistake / what most people get wrong",
  "Episode 4: The shortcut / framework / playbook",
  "Episode 5: The case study / proof / result with cliffhanger",
];

export async function generateShortsSeriesScripts(opts: Omit<Opts, "angle">): Promise<{ scripts: ShortsScript[]; error?: string }> {
  const results = await Promise.all(
    SERIES_ANGLES.map((angle) => generateShortsScript({ ...opts, angle })),
  );
  const scripts: ShortsScript[] = [];
  for (const r of results) {
    if (r.error || !r.script) {
      return { scripts: [], error: r.error || "Series generation failed" };
    }
    scripts.push(r.script);
  }
  return { scripts };
}
