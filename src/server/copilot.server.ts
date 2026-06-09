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

export async function generateReplies(
  originalPost: string,
  goal: string,
  platform: string,
  brandVoice: string,
): Promise<{ replies: string[]; error?: string }> {
  const voiceBlock = brandVoice ? `\n\nMatch this brand voice:\n${brandVoice}` : "";
  const system = `You are a social media strategist. Given a post on ${platform}, write 5 high-quality reply options the user could send.

Goal of the reply: ${goal}

Rules:
- Each reply should sound human and conversational, not corporate.
- Vary the angles (question, agree-and-add, contrarian, story, joke).
- Platform-appropriate length: tweets ≤ 250 chars; LinkedIn ≤ 400 chars; instagram ≤ 200 chars.
- Output as a numbered list 1-5. No preamble. No hashtags unless natural.${voiceBlock}`;

  const r = await callClaude({
    systemPrompt: system,
    userPrompt: `Original post:\n"""${originalPost}"""`,
    maxTokens: 1500,
  });
  if (r.error) return { replies: [], error: r.error };

  const replies = r.text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, 5);
  return { replies };
}
