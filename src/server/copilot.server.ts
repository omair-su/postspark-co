import { callClaude } from "./anthropic.server";

export async function humanizeText(input: string, intensity: "light" | "medium" | "strong" = "medium"): Promise<{ output: string; error?: string }> {
  const intensityNotes = {
    light: "Make minor edits — vary sentence length slightly, swap a few stiff phrases for natural ones.",
    medium: "Rewrite for natural human cadence: vary sentence length aggressively (mix 3-word and 25-word sentences), use contractions, drop filler words, add one small personal-feeling aside.",
    strong: "Aggressively rewrite as if a real person texted it. Big variation in rhythm. Include occasional sentence fragments. Cut all corporate words (leverage, utilize, robust, seamless, in order to). Use specific concrete nouns over abstractions.",
  }[intensity];

  const system = `You are an expert editor who rewrites AI-generated text so it reads as if written by a real human. ${intensityNotes}

Rules:
- Keep the original meaning and key facts intact.
- Output ONLY the rewritten text. No preamble, no explanation, no quotes.
- Match the original's approximate length (±15%).
- Never use em-dashes (—). Use commas, parentheses, or two short sentences instead.
- Never start sentences with "Moreover", "Furthermore", "In conclusion", "Additionally".`;

  const r = await callClaude({ systemPrompt: system, userPrompt: input, maxTokens: 2500 });
  if (r.error) return { output: "", error: r.error };
  return { output: r.text };
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
