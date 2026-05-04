import { callClaude } from "./anthropic.server";

export async function summarizeBrandVoice(samples: string[]): Promise<{ summary: string; error?: string }> {
  const joined = samples
    .map((s, i) => `--- SAMPLE ${i + 1} ---\n${s.trim()}`)
    .join("\n\n");

  const systemPrompt = `You are a brand voice analyst and copywriting expert. You can identify unique writing patterns, tone characteristics, and style fingerprints from writing samples.

Read the user's writing samples and produce a concise, actionable style guide (180-260 words) that another AI can use to mimic their voice. Cover:
- Tone & personality (e.g. witty, blunt, warm, contrarian)
- Sentence rhythm & length
- Vocabulary & favorite phrases or words
- Punctuation quirks (em dashes, ellipses, ALL CAPS, emojis)
- Formatting habits (line breaks, lists, hooks)
- Common opening hooks and closing CTAs
- Topics/POV they care about

Return ONLY the style guide as plain prose. No preamble. Start directly with "Voice profile:".`;

  const result = await callClaude({
    systemPrompt,
    userPrompt: joined,
    maxTokens: 1000,
  });

  if (result.error) return { summary: "", error: result.error };
  return { summary: result.text };
}
