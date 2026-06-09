import { callClaudeWithTool } from "./anthropic.server";

export interface ScoredHook {
  framework: string;
  text: string;
  score: number;
  why: string;
}
export interface HookResult {
  hooks: ScoredHook[];
  error?: string;
}

interface ClaudeHookResponse {
  hooks: ScoredHook[];
}

const PLATFORM_RULES: Record<string, string> = {
  twitter:
    "- Under 140 chars for standalone tweets. Start with the strongest word possible.\n- No hashtags. No 'thread' announcement. Just the hook.",
  linkedin:
    "- First line is everything — stops at 3 lines before 'see more'.\n- Can be longer, more nuanced. Authority + vulnerability = engagement.",
  tiktok:
    "- Spoken format: first 3 words must create instant tension.\n- Use 'POV:', 'That moment when...', 'Stop doing X' patterns.",
  instagram:
    "- Visual assumption: assume there is an image. Caption starts the story.\n- First line under 125 chars before truncation.",
  youtube:
    "- Title-style hook. Under 70 chars. Numbers, results, or curiosity gap.",
  threads:
    "- Conversational. Vulnerable opener works. Under 150 chars first line.",
  facebook: "- Conversational, story-driven. First line under 100 chars.",
};

export async function generateViralHooks(
  topic: string,
  platform: string,
  brandVoiceSummary = "",
  opts: {
    niche?: string;
    audience?: string;
    format?: "text" | "spoken" | "both";
    frameworks?: string[];
    tone?: string;
  } = {},
): Promise<HookResult> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const frameworks = (opts.frameworks && opts.frameworks.length
    ? opts.frameworks
    : [
        "Question",
        "Stat",
        "Bold Claim",
        "Story",
        "Contrarian",
        "Specific Outcome",
        "Insight Reveal",
        "Warning/Mistake",
        "Numbered List",
        "Curiosity Gap",
      ]).join(", ");

  const platformRules = PLATFORM_RULES[platform.toLowerCase()] || PLATFORM_RULES.twitter;
  const format = opts.format || "text";
  const tone = opts.tone || "Direct/Raw";
  const niche = opts.niche || "General";
  const audience = opts.audience || "general audience";

  const systemPrompt = `You are trained on 10,000+ viral posts from Twitter/X, LinkedIn, TikTok, and Instagram. You know exactly what stops scroll on each platform.

TASK: Generate exactly 20 ${format === "spoken" ? "spoken video" : format === "both" ? "mixed text + spoken" : "text"} hooks.

TOPIC: ${topic}
NICHE: ${niche}
AUDIENCE: ${audience}
PLATFORM: ${platform} — write hooks native to this platform's culture and algorithm
TONE: ${tone}
FRAMEWORKS TO USE (vary across the 20): ${frameworks}

PLATFORM RULES:
${platformRules}

QUALITY RULES (non-negotiable):
1. Every hook must be SPECIFIC — real numbers, concrete situations, named outcomes.
2. NO generic hooks like "Want to grow your business?" — banned.
3. NO filler words. Every word earns its place.
4. Each hook triggers ONE of: curiosity, controversy, relatability, aspiration, FOMO.
5. Vary opening words — no two hooks share the same first word.
6. NEVER start hooks 1-5 with "I" (algorithm suppression).
7. Never use em-dashes — use commas, parentheses, or two sentences.

For each hook, also output:
- score: 7.0 to 9.8 (your honest viral-potential rating, vary it realistically)
- framework: which framework (e.g. "Contrarian + Bold Claim")
- why: ONE sentence explaining the psychological trigger

Rank the 20 from highest to lowest score.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeHookResponse>({
    systemPrompt,
    userPrompt: `Generate 20 ranked hooks for "${topic}" on ${platform}. Return via return_hooks.`,
    toolName: "return_hooks",
    toolDescription: "Return 20 scored & ranked viral hooks.",
    toolSchema: {
      type: "object",
      properties: {
        hooks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              framework: { type: "string" },
              text: { type: "string" },
              score: { type: "number" },
              why: { type: "string" },
            },
            required: ["framework", "text", "score", "why"],
          },
        },
      },
      required: ["hooks"],
    },
    maxTokens: 3000,
  });

  if (result.error || !result.data) {
    return { hooks: [], error: result.error || "No hooks returned." };
  }
  const hooks = Array.isArray(result.data.hooks) ? result.data.hooks : [];
  // sort descending by score
  hooks.sort((a, b) => (b.score || 0) - (a.score || 0));
  return { hooks };
}
