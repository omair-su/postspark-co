export interface HookResult {
  hooks: { framework: string; text: string }[];
  error?: string;
}

export async function generateViralHooks(
  topic: string,
  platform: string,
  brandVoiceSummary = ""
): Promise<HookResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return { hooks: [], error: "AI service not configured" };

  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are a world-class viral copywriter who has studied every viral post on ${platform}. Generate exactly 20 scroll-stopping hooks for the user's topic.

Use a diverse mix of these proven hook frameworks (label each):
1. Contrarian ("Everyone says X. They're wrong.")
2. Curiosity Gap ("The one thing nobody tells you about...")
3. Pain Point ("If you're struggling with X, read this.")
4. Bold Claim ("I made $X doing Y in Z days.")
5. Story ("3 years ago I was broke. Today...")
6. List ("7 lessons I wish I knew at 25")
7. Question ("Why do 90% of X fail?")
8. Stat Shock ("87% of people don't know this...")
9. Mistake ("The biggest mistake I made building X")
10. Secret ("The hidden framework top creators use")

Return ONLY a JSON object via the tool call. Each hook must be under 220 chars, platform-native, and instantly compelling.${voiceBlock}`;

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
          { role: "user", content: `Topic: ${topic}\nPlatform: ${platform}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_hooks",
              description: "Return the 20 generated viral hooks.",
              parameters: {
                type: "object",
                properties: {
                  hooks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        framework: { type: "string" },
                        text: { type: "string" },
                      },
                      required: ["framework", "text"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["hooks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_hooks" } },
      }),
    });

    if (response.status === 429) return { hooks: [], error: "Rate limit reached. Try again shortly." };
    if (response.status === 402) return { hooks: [], error: "AI credits exhausted." };
    if (!response.ok) {
      const text = await response.text();
      console.error("Hook lab AI error:", response.status, text);
      return { hooks: [], error: "Failed to generate hooks." };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return { hooks: [], error: "No hooks returned." };
    const args = JSON.parse(toolCall.function.arguments);
    return { hooks: Array.isArray(args.hooks) ? args.hooks : [] };
  } catch (err) {
    console.error("Hook lab error:", err);
    return { hooks: [], error: "Failed to connect to AI service." };
  }
}
