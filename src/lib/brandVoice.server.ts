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

  const totalChars = samples.reduce((s, x) => s + x.trim().length, 0);
  const avgLen = totalChars / Math.max(samples.length, 1);
  const allWords = samples.join(" ").toLowerCase().split(/\W+/).filter(Boolean);
  const uniqueRatio = new Set(allWords).size / Math.max(allWords.length, 1);

  let score = 0;
  score += Math.min(samples.length * 12, 60);
  score += Math.min((avgLen / 400) * 20, 20);
  score += Math.min(uniqueRatio * 50, 20);
  score = Math.max(20, Math.min(100, Math.round(score)));

  return { summary: result.text, score };
}

/** Fetch a public URL and extract visible text (best effort, server-side). */
export async function scrapeUrlSamples(url: string): Promise<{ samples: string[]; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PostSparkBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return { samples: [], error: `Could not fetch URL (${res.status}).` };
    const html = await res.text();
    // Strip scripts/styles/nav
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');

    // Split into paragraph-like blocks
    const blocks = cleaned
      .split(/\n{2,}|\r\n/)
      .map((b) => b.replace(/\s+/g, " ").trim())
      .filter((b) => b.length >= 80 && b.length <= 3000);

    // Take top 5 longest as samples
    const samples = blocks
      .sort((a, b) => b.length - a.length)
      .slice(0, 5);

    if (samples.length < 1) return { samples: [], error: "No readable text found at that URL." };
    return { samples };
  } catch (e) {
    return { samples: [], error: `Fetch failed: ${(e as Error).message}` };
  }
}

/** Generate 3 short previews (tweet, LinkedIn opener, video hook) in the trained voice. */
export async function generateVoicePreviews(styleSummary: string): Promise<{ previews: { tweet: string; linkedin: string; hook: string } | null; error?: string }> {
  const systemPrompt = `You mimic writing voices precisely. Write three SHORT samples using this voice profile:

${styleSummary}

Return ONLY a JSON object with keys: tweet (max 280 chars), linkedin (2-sentence LinkedIn post opening), hook (single short video hook, 12 words or less). No preamble.`;

  const result = await callClaude({
    systemPrompt,
    userPrompt: "Topic: a founder shipping a new AI feature this week.",
    maxTokens: 500,
  });
  if (result.error) return { previews: null, error: result.error };

  try {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match) return { previews: null, error: "Could not parse previews." };
    const parsed = JSON.parse(match[0]);
    return {
      previews: {
        tweet: String(parsed.tweet || "").slice(0, 280),
        linkedin: String(parsed.linkedin || ""),
        hook: String(parsed.hook || ""),
      },
    };
  } catch {
    return { previews: null, error: "Could not parse previews." };
  }
}

/** Score how well a piece of content matches a voice profile (0-100). */
export async function scoreVoiceMatch(styleSummary: string, content: string): Promise<{ score: number; error?: string }> {
  const systemPrompt = `You are a strict brand-voice auditor. Compare the CONTENT to the VOICE PROFILE.

VOICE PROFILE:
${styleSummary}

Return ONLY a JSON object like {"score": 87} where score is 0-100 (100 = perfect match). No preamble.`;

  const result = await callClaude({
    systemPrompt,
    userPrompt: `CONTENT:\n${content.slice(0, 3000)}`,
    maxTokens: 100,
  });
  if (result.error) return { score: 0, error: result.error };
  try {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match) return { score: 0, error: "Could not parse score." };
    const parsed = JSON.parse(match[0]);
    const n = Number(parsed.score);
    return { score: Math.max(0, Math.min(100, Math.round(n))) };
  } catch {
    return { score: 0, error: "Could not parse score." };
  }
}
