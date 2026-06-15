import { callClaudeWithTool } from "./anthropic.server";

export interface ShortsShot {
  timestamp: string; // "0:00–0:02"
  voiceover: string;
  on_screen_caption: string;
  b_roll: string;
}

export interface ShortsScript {
  hooks: string[];
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

export async function generateShortsScript(opts: Opts): Promise<{ script: ShortsScript | null; error?: string }> {
  const platformRules = PLATFORM_RULES[opts.platform] || PLATFORM_RULES.tiktok;
  const voiceBlock = opts.brandVoiceSummary?.trim()
    ? `\n\nMatch this brand voice exactly:\n${opts.brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are a viral short-form video director. You have studied 10,000+ top-performing TikToks, Reels, and Shorts. You know exactly how to script a ${opts.duration}-second vertical video that gets watched all the way through.

TASK: Turn the user's source content into a complete, ready-to-record ${opts.duration}s vertical video script for ${opts.platform.toUpperCase()}.

PLATFORM RULES:
${platformRules}

OUTPUT REQUIREMENTS:
- hooks: EXACTLY 3 hook variants for the first 1.5 seconds. Each under 9 words. Pattern-interrupt openings only ("Stop doing X", "Nobody talks about", "I was wrong about", a stat, a question that creates tension). NEVER start with "I" or "In this video".
- shots: chronological shot list covering the full ${opts.duration} seconds. Each shot has a timestamp window ("0:00–0:03"), a 1-2 sentence voiceover line in natural spoken language, a short on-screen caption (≤7 words, ALL CAPS or sentence case based on platform norm), and a concrete b-roll suggestion (screen recording, talking head, text card, stock clip).
- cta: a single sentence call-to-action on the last shot. Specific action only — "comment X", "follow for the rest", "save this", "try the free version at <site>". Never "link in bio" without context.
- title: under 60 chars, search-optimized for the platform.
- description: 1-2 sentence caption, conversational, with the strongest hook variant restated.
- hashtags: exactly 8, mixed broad + niche, no spaces, lowercase, no leading #.
- audio_category: ONE of: "trending upbeat", "trending dramatic", "trending lo-fi", "voiceover only", "original audio". Do not name licensed tracks.

QUALITY RULES:
- Every shot earns its airtime — no filler shots.
- Voiceover is what an actual person would say out loud, not written copy.
- On-screen captions reinforce, don't repeat, the voiceover.
- The angle "${opts.angle || "value-first"}" must run through the whole script.
- Output language: ${opts.language || "English"}.${voiceBlock}`;

  const result = await callClaudeWithTool<ShortsScript>({
    systemPrompt,
    userPrompt: `Source content to repurpose:\n\n${opts.inputText.slice(0, 12000)}\n\nReturn a complete ${opts.duration}s ${opts.platform} script via return_shorts_script.`,
    toolName: "return_shorts_script",
    toolDescription: "Return a complete vertical-video script ready to record.",
    toolSchema: {
      type: "object",
      properties: {
        hooks: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        shots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              timestamp: { type: "string" },
              voiceover: { type: "string" },
              on_screen_caption: { type: "string" },
              b_roll: { type: "string" },
            },
            required: ["timestamp", "voiceover", "on_screen_caption", "b_roll"],
          },
        },
        cta: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        hashtags: { type: "array", items: { type: "string" }, minItems: 8, maxItems: 8 },
        audio_category: { type: "string" },
      },
      required: ["hooks", "shots", "cta", "title", "description", "hashtags", "audio_category"],
    },
    maxTokens: 3500,
  });

  if (result.error || !result.data) {
    return { script: null, error: result.error || "Generation failed" };
  }
  return { script: result.data };
}
