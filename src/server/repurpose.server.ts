import { callClaude } from "./anthropic.server";

export async function generateRepurposedContent(
  inputText: string,
  selectedTypes: string[],
  tone: string = "professional",
  customInstructions: string = "",
  brandVoiceSummary: string = "",
  language: string = "English"
): Promise<{ output: string; error?: string }> {
  const typeInstructions = selectedTypes
    .map((t) => {
      switch (t) {
        case "tweets":
          return "exactly 10 short punchy tweets (under 280 chars each, numbered 1-10, max 2 hashtags per tweet)";
        case "linkedin":
          return "exactly 5 LinkedIn posts (professional storytelling hooks, 150-300 words each, line breaks for readability, numbered 1-5)";
        case "email":
          return "1 email newsletter (subject line + preview text + body with greeting, 3 sections, and CTA, ~300 words)";
        case "video":
          return "1 video script (Hook 0-30s, Main Content 30s-4min with bullet points, CTA 4-5min, ~400 words)";
        case "instagram":
          return "5 Instagram captions (~150 chars each + 10 hashtags each, numbered 1-5)";
        case "facebook":
          return "3 Facebook posts (conversational, shareable, 100-200 words each, numbered 1-3)";
        case "seo":
          return "1 blog summary (150 words) + 3 SEO meta descriptions (under 160 chars each)";
        case "tiktok":
          return "3 TikTok/Reels scripts (hook in first 3 seconds, 60-90 seconds each, numbered 1-3)";
        case "podcast":
          return "1 set of podcast show notes (title, summary, key takeaways, timestamps outline, ~300 words)";
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

  const systemPrompt = `You are PostSpark's AI content engine. You are an expert content strategist and copywriter who specializes in repurposing content for maximum reach across multiple platforms. Always produce high-quality, platform-native content that sounds human and engaging — never robotic or generic.

For this request, generate: ${typeInstructions}. Format each section with a clear markdown header (e.g. "## Tweets"). Be engaging, value-driven, and platform-appropriate.${toneInstruction}${languageBlock}${customBlock}${voiceBlock}`;

  const result = await callClaude({
    systemPrompt,
    userPrompt: inputText,
    maxTokens: 4000,
  });

  if (result.error) return { output: "", error: result.error };
  return { output: result.text };
}
