export async function generateRepurposedContent(
  inputText: string,
  selectedTypes: string[],
  tone: string = "professional",
  customInstructions: string = "",
  brandVoiceSummary: string = "",
  language: string = "English"
): Promise<{ output: string; error?: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    return { output: "", error: "AI service not configured" };
  }

  const typeInstructions = selectedTypes
    .map((t) => {
      switch (t) {
        case "tweets":
          return "exactly 10 short punchy tweets (under 280 chars each, numbered 1-10)";
        case "linkedin":
          return "exactly 5 LinkedIn posts (professional tone, 150-200 words each, numbered 1-5)";
        case "email":
          return "1 email newsletter (subject line + body, 300 words)";
        case "video":
          return "1 video script (hook + 3 main points + CTA, 400 words)";
        case "instagram":
          return "5 Instagram captions with relevant hashtags (engaging, visual-friendly, numbered 1-5)";
        case "facebook":
          return "3 Facebook posts (conversational, shareable, 100-200 words each, numbered 1-3)";
        case "seo":
          return "1 blog summary (150 words) + 3 SEO meta descriptions (under 160 chars each)";
        case "tiktok":
          return "3 TikTok/Reels scripts (hook in first 3 seconds, 60-90 seconds each, numbered 1-3)";
        case "podcast":
          return "1 set of podcast show notes (title, summary, key takeaways, timestamps outline, 300 words)";
        case "thread":
          return "1 Twitter/X thread (8-12 connected tweets, numbered, with a compelling hook)";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(", ");

  const toneInstruction = tone !== "professional" ? ` Use a ${tone} tone throughout.` : "";
  const customBlock = customInstructions.trim()
    ? ` Additional instructions: ${customInstructions.trim()}`
    : "";

  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nCRITICAL — Match this user's personal brand voice EXACTLY. Mimic their tone, sentence rhythm, vocabulary, punctuation quirks, and formatting habits:\n${brandVoiceSummary.trim()}`
    : "";

  const languageBlock = language && language !== "English"
    ? ` Write ALL output in ${language}. Use native idioms and natural phrasing for that language.`
    : "";

  const systemPrompt = `You are a professional content repurposing assistant. Given the following content, generate: ${typeInstructions}. Format each section with a clear header. Be engaging, value-driven, and platform-appropriate.${toneInstruction}${languageBlock}${customBlock}${voiceBlock}`;

  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: inputText },
          ],
        }),
      }
    );

    if (response.status === 429) {
      return { output: "", error: "Rate limit reached. Please try again in a moment." };
    }
    if (response.status === 402) {
      return { output: "", error: "AI credits exhausted. Please try again later." };
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return { output: "", error: "AI generation failed. Please try again." };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { output: "", error: "No content generated. Please try again." };
    }

    return { output: content };
  } catch (err) {
    console.error("AI request error:", err);
    return { output: "", error: "Failed to connect to AI service." };
  }
}
