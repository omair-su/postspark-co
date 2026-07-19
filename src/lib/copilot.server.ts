import { callClaude } from "./anthropic.server";

export interface HumanizeOpts {
  purpose?: string;
  style?: string;
  preserve?: string[];
}

export async function humanizeText(
  input: string,
  intensity: "light" | "medium" | "strong" = "medium",
  opts: HumanizeOpts = {},
): Promise<{ output: string; error?: string; stats?: { aiPatternsRemoved: number; fillerRemoved: number; humanScore: number } }> {
  const purpose = opts.purpose || "General text";
  const style = opts.style || "Conversational";
  const preserve = (opts.preserve && opts.preserve.length ? opts.preserve : ["Original meaning", "Key facts/data"]).join(", ");

  const strengthRules = {
    light: "LIGHT MODE: Only fix the most obvious AI patterns. 20-30% rewrite. Keep most original phrasing.",
    medium: "MEDIUM MODE: Full rewrite while preserving tone. 50-60% of sentences changed. Vary rhythm aggressively.",
    strong: "STRONG MODE: Aggressive humanization. Rewrite up to 80% of sentences. Push naturalness to max — fragments, asides, conversational connectors.",
  }[intensity];

  const system = `You are an expert editor who specializes in making AI-generated text sound genuinely human. You've studied thousands of examples of AI vs human writing patterns.

PURPOSE: ${purpose}
TARGET STYLE: ${style}
PRESERVE: ${preserve}

${strengthRules}

REMOVE these AI fingerprints:
- "In today's fast-paced world", "In the ever-evolving landscape", "It is important to note", "It's worth mentioning"
- "Utilize" → "use" · "Leverage" → "use/apply" · "Cutting-edge" · "State-of-the-art" · "Robust solution" · "Seamless"
- Passive voice where active is natural
- Sentences that all start the same way
- Mechanical parallel structure
- "Furthermore" → "Also" · "Moreover" → "On top of that"
- Topic-sentence announcements at every paragraph start

ADD these human patterns:
- Sentence-length variation: mix 5-word punchy lines with 20-word detailed ones
- Occasional sentence fragments. Like this.
- Conversational asides (parenthetical thoughts)
- Direct address: "Here's the thing:", "Think about it this way:"
- Specific, concrete details
- Natural connectors: "That's why...", "The thing is..."
- Contractions where appropriate (you're, it's, they're)

NEVER change: meaning, facts, statistics, numbers, names, URLs.
Never use em-dashes (—). Use commas, parentheses, or two short sentences.

OUTPUT: Return ONLY the humanized text. No preamble. No explanation. No quotes.`;

  const r = await callClaude({ systemPrompt: system, userPrompt: input, maxTokens: 3000 });
  if (r.error) return { output: "", error: r.error };

  // Simple stats based on diffing patterns
  const aiPatterns = /\b(utilize|leverage|robust|seamless|cutting-edge|state-of-the-art|furthermore|moreover|in today's|in the ever-evolving|it is important to note|it's worth mentioning)\b/gi;
  const fillerPatterns = /\b(very|really|just|basically|essentially|simply)\b/gi;
  const inputAi = (input.match(aiPatterns) || []).length;
  const outputAi = (r.text.match(aiPatterns) || []).length;
  const inputFill = (input.match(fillerPatterns) || []).length;
  const outputFill = (r.text.match(fillerPatterns) || []).length;
  const score = Math.max(60, Math.min(98, 75 + (inputAi - outputAi) * 3 + (inputFill - outputFill)));

  return {
    output: r.text,
    stats: {
      aiPatternsRemoved: Math.max(0, inputAi - outputAi),
      fillerRemoved: Math.max(0, inputFill - outputFill),
      humanScore: score,
    },
  };
}

export interface ReplyOpts {
  tone?: string;
  length?: "short" | "medium" | "long";
  count?: number;
  addCta?: boolean;
  ctaText?: string;
}

export interface ScoredReply {
  text: string;
  score: number;
  goal: string;
}

export async function generateReplies(
  originalPost: string,
  goal: string,
  platform: string,
  brandVoice: string,
  opts: ReplyOpts = {},
): Promise<{ replies: ScoredReply[]; error?: string }> {
  const tone = opts.tone || "Conversational";
  const length = opts.length || "short";
  const count = Math.min(Math.max(opts.count || 5, 3), 10);
  const voiceBlock = brandVoice ? `\nBRAND VOICE TO MATCH:\n${brandVoice}\n` : "";
  const ctaBlock = opts.addCta
    ? `\nADD A CTA: In exactly ONE of the replies, work in a subtle mention/link: "${opts.ctaText || "user's own related work"}". Keep it natural — never spammy.\n`
    : "";

  const lengthRule = {
    short: "1-2 lines, punchy",
    medium: "3-4 lines, balanced",
    long: "5+ lines, detailed",
  }[length];

  const platformRule = {
    twitter: "Twitter/X: short and punchy. Start with substance not greeting. Hard limit 280 chars.",
    linkedin: "LinkedIn: thoughtful, professional but personal. Can reference experience. Limit ~500 chars.",
    instagram: "Instagram: warm and engaging. 1-2 relevant emojis ok. Limit ~150 chars.",
    facebook: "Facebook: conversational, community-feel. Limit ~400 chars.",
    tiktok: "TikTok: casual, relatable, match creator energy. Limit ~150 chars.",
    threads: "Threads: casual, witty, like Twitter but warmer. Limit ~500 chars.",
  }[platform.toLowerCase()] || "Match the platform culture.";

  const system = `You are an expert social media strategist who writes replies that build genuine relationships, establish authority, and get noticed — without being spammy.

PLATFORM: ${platform}
GOAL: ${goal}
TONE: ${tone}
LENGTH: ${lengthRule}
${voiceBlock}${ctaBlock}
QUALITY RULES:
1. Sound completely human — NEVER start with "Great post!", "Interesting point!", "Love this!", "Thanks for sharing!".
2. Reference something SPECIFIC from the original post.
3. Add new info, a question, or a fresh perspective — not just agreement.
4. ${platformRule}
5. Honor the goal: "ask question" → end with real curiosity; "add value" → bring data/insight; "disagree" → respectfully challenge with reasoning.

OUTPUT FORMAT (strict, repeat for each of the ${count} replies):
REPLY: <the reply text on a single line, no quotes>
SCORE: <a number 1.0-10.0 estimating engagement potential>
GOAL: <which goal/angle this serves in 2-4 words>
---

Generate exactly ${count} replies. No preamble. No closing notes.`;

  const r = await callClaude({
    systemPrompt: system,
    userPrompt: `Original post to reply to:\n"""${originalPost}"""`,
    maxTokens: 2400,
  });
  if (r.error) return { replies: [], error: r.error };

  const blocks = r.text.split(/\n?-{3,}\n?/).map((b) => b.trim()).filter(Boolean);
  const parsed: ScoredReply[] = [];
  for (const b of blocks) {
    const textM = b.match(/REPLY:\s*([\s\S]*?)(?:\n\s*SCORE:|$)/i);
    const scoreM = b.match(/SCORE:\s*([\d.]+)/i);
    const goalM = b.match(/GOAL:\s*(.+)/i);
    if (textM && textM[1].trim().length > 4) {
      parsed.push({
        text: textM[1].trim().replace(/^"|"$/g, ""),
        score: scoreM ? Math.min(10, Math.max(1, parseFloat(scoreM[1]))) : 8.0,
        goal: goalM ? goalM[1].trim().slice(0, 40) : goal,
      });
    }
  }

  // Fallback: numbered-list parse
  if (parsed.length === 0) {
    r.text
      .split(/\n+/)
      .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter((l) => l.length > 5)
      .slice(0, count)
      .forEach((t, i) => parsed.push({ text: t, score: 8.5 - i * 0.2, goal }));
  }

  return { replies: parsed.slice(0, count) };
}
