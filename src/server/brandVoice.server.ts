export async function summarizeBrandVoice(samples: string[]): Promise<{ summary: string; error?: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    return { summary: "", error: "AI service not configured" };
  }

  const joined = samples
    .map((s, i) => `--- SAMPLE ${i + 1} ---\n${s.trim()}`)
    .join("\n\n");

  const systemPrompt = `You are a writing-style analyst. Read the user's writing samples and produce a concise, actionable style guide (180-260 words) that another AI can use to mimic their voice. Cover:
- Tone & personality (e.g. witty, blunt, warm, contrarian)
- Sentence rhythm & length (short staccato? long flowing?)
- Vocabulary & favorite phrases or words
- Punctuation quirks (em dashes, ellipses, ALL CAPS, emojis)
- Formatting habits (line breaks, lists, hooks)
- Common opening hooks and closing CTAs
- Topics/POV they care about

Return ONLY the style guide as plain prose. No preamble. Start directly with "Voice profile:".`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: joined },
        ],
      }),
    });

    if (response.status === 429) return { summary: "", error: "Rate limit reached. Try again shortly." };
    if (response.status === 402) return { summary: "", error: "AI credits exhausted." };
    if (!response.ok) {
      const text = await response.text();
      console.error("Brand voice AI error:", response.status, text);
      return { summary: "", error: "Failed to analyze samples." };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { summary: "", error: "No analysis returned." };
    return { summary: content.trim() };
  } catch (err) {
    console.error("Brand voice request error:", err);
    return { summary: "", error: "Failed to connect to AI service." };
  }
}
