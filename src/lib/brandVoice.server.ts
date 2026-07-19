import { callClaude } from "./anthropic.server";

export async function summarizeBrandVoice(samples: string[]): Promise<{ summary: string; score: number; error?: string }> {
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

  if (result.error) return { summary: "", score: 0, error: result.error };

  // Heuristic quality score: based on sample count, total length, lexical diversity
  const totalChars = samples.reduce((s, x) => s + x.trim().length, 0);
  const avgLen = totalChars / Math.max(samples.length, 1);
  const allWords = samples.join(" ").toLowerCase().split(/\W+/).filter(Boolean);
  const uniqueRatio = new Set(allWords).size / Math.max(allWords.length, 1);

  let score = 0;
  score += Math.min(samples.length * 12, 60); // up to 60 for 5 samples
  score += Math.min((avgLen / 400) * 20, 20); // up to 20 for ~400+ chars/sample
  score += Math.min(uniqueRatio * 50, 20);    // up to 20 for vocabulary diversity
  score = Math.max(20, Math.min(100, Math.round(score)));

  return { summary: result.text, score };
}
