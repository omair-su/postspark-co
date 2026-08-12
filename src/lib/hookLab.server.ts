import { callClaudeWithTool } from "./anthropic.server";

export interface HookSubScores {
  pattern: number;
  specificity: number;
  platformFit: number;
}

export interface ScoredHook {
  framework: string;
  text: string;
  score: number;
  why: string;
  /** One of: curiosity | controversy | relatability | aspiration | fomo */
  trigger?: string;
  subscores?: HookSubScores;
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

const HOOK_ITEM_SCHEMA = {
  type: "object",
  properties: {
    framework: { type: "string" },
    text: { type: "string" },
    score: { type: "number" },
    why: { type: "string" },
    trigger: {
      type: "string",
      description: "One of: curiosity, controversy, relatability, aspiration, fomo",
    },
    subscores: {
      type: "object",
      properties: {
        pattern: { type: "number", description: "0-10 pattern strength" },
        specificity: { type: "number", description: "0-10 concreteness" },
        platformFit: { type: "number", description: "0-10 native fit for the platform" },
      },
      required: ["pattern", "specificity", "platformFit"],
    },
  },
  required: ["framework", "text", "score", "why", "trigger", "subscores"],
} as const;

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
4. Each hook triggers ONE of: curiosity, controversy, relatability, aspiration, fomo.
5. Vary opening words — no two hooks share the same first word.
6. NEVER start hooks 1-5 with "I" (algorithm suppression).
7. Never use em-dashes — use commas, parentheses, or two sentences.

For each hook, also output:
- score: 7.0 to 9.8 (your honest viral-potential rating, vary it realistically)
- framework: which framework (e.g. "Contrarian + Bold Claim")
- why: ONE sentence explaining the psychological trigger
- trigger: exactly one of curiosity | controversy | relatability | aspiration | fomo
- subscores: pattern, specificity, platformFit each 0-10 (be honest, vary them)

Rank the 20 from highest to lowest score.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeHookResponse>({
    systemPrompt,
    userPrompt: `Generate 20 ranked hooks for "${topic}" on ${platform}. Return via return_hooks.`,
    toolName: "return_hooks",
    toolDescription: "Return 20 scored & ranked viral hooks.",
    toolSchema: {
      type: "object",
      properties: {
        hooks: { type: "array", items: HOOK_ITEM_SCHEMA },
      },
      required: ["hooks"],
    },
    maxTokens: 4000,
  });

  if (result.error || !result.data) {
    return { hooks: [], error: result.error || "No hooks returned." };
  }
  const hooks = Array.isArray(result.data.hooks) ? result.data.hooks : [];
  hooks.sort((a, b) => (b.score || 0) - (a.score || 0));
  return { hooks };
}

/** Remix one winning hook into 5 fresh variants of the same idea. */
export async function remixSingleHook(
  hook: string,
  platform: string,
  mode: "remix" | "shorten" | "tone",
  tone: string,
  brandVoiceSummary = "",
): Promise<HookResult> {
  const platformRules = PLATFORM_RULES[platform.toLowerCase()] || PLATFORM_RULES.twitter;
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const intent =
    mode === "shorten"
      ? "Rewrite it 5 different ways, each SHORTER and punchier than the original while keeping the exact same promise."
      : mode === "tone"
        ? `Rewrite it 5 different ways, all shifted into a "${tone}" tone while keeping the same promise.`
        : "Write 5 new hooks that keep the same underlying idea but use completely different angles and frameworks.";

  const systemPrompt = `You are an elite short-form copywriter for ${platform}.

ORIGINAL HOOK:
"""${hook}"""

TASK: ${intent}

PLATFORM RULES:
${platformRules}

RULES:
- Each variant must be specific and concrete. No generic filler.
- No two variants share the same first word.
- Never use em-dashes.
- Score each 7.0-9.8 honestly, include trigger and subscores.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeHookResponse>({
    systemPrompt,
    userPrompt: "Return the 5 variants via return_hooks.",
    toolName: "return_hooks",
    toolDescription: "Return 5 scored hook variants.",
    toolSchema: {
      type: "object",
      properties: { hooks: { type: "array", items: HOOK_ITEM_SCHEMA } },
      required: ["hooks"],
    },
    maxTokens: 1600,
  });

  if (result.error || !result.data) {
    return { hooks: [], error: result.error || "No variants returned." };
  }
  const hooks = (Array.isArray(result.data.hooks) ? result.data.hooks : []).slice(0, 5);
  hooks.sort((a, b) => (b.score || 0) - (a.score || 0));
  return { hooks };
}

export interface HookSeriesPost {
  order: number;
  hook: string;
  body: string;
  cliffhanger: string;
}

/** Turn a winning hook into a connected 5-part content arc. */
export async function generateHookSeriesArc(
  hook: string,
  platform: string,
  topic: string,
  brandVoiceSummary = "",
): Promise<{ posts: HookSeriesPost[]; error?: string }> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";
  const platformRules = PLATFORM_RULES[platform.toLowerCase()] || PLATFORM_RULES.twitter;

  const result = await callClaudeWithTool<{ posts: HookSeriesPost[] }>({
    systemPrompt: `You build binge-worthy content arcs for ${platform}.

WINNING HOOK (part 1 must build on this): "${hook}"
TOPIC CONTEXT: ${topic}

TASK: Design a 5-part series. Each part has:
- hook: the scroll-stopping opener for that part
- body: 3-5 short lines of the actual post content
- cliffhanger: the last line that forces the audience to come back for the next part

PLATFORM RULES:
${platformRules}

RULES:
- Parts must escalate: setup, tension, proof, contrarian turn, payoff.
- Every part stands alone but rewards the whole arc.
- Concrete and specific. No filler. Never use em-dashes.${voiceBlock}`,
    userPrompt: "Return the 5-part arc via return_series.",
    toolName: "return_series",
    toolDescription: "Return the 5-part content series.",
    toolSchema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order: { type: "number" },
              hook: { type: "string" },
              body: { type: "string" },
              cliffhanger: { type: "string" },
            },
            required: ["order", "hook", "body", "cliffhanger"],
          },
        },
      },
      required: ["posts"],
    },
    maxTokens: 2500,
  });

  if (result.error || !result.data) {
    return { posts: [], error: result.error || "No series returned." };
  }
  const posts = Array.isArray(result.data.posts) ? result.data.posts.slice(0, 5) : [];
  posts.sort((a, b) => (a.order || 0) - (b.order || 0));
  return { posts };
}
