export interface SeoBlogResult {
  title: string;
  metaDescription: string;
  slug: string;
  outline: string[];
  markdown: string;
  faq: { q: string; a: string }[];
  error?: string;
}

export async function generateSeoBlog(
  topic: string,
  keyword: string,
  wordTarget: number,
  language: string,
  brandVoiceSummary = "",
): Promise<SeoBlogResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    return {
      title: "",
      metaDescription: "",
      slug: "",
      outline: [],
      markdown: "",
      faq: [],
      error: "AI service not configured",
    };
  }

  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are an elite SEO content writer trained on Google's Helpful Content guidelines and modern E-E-A-T standards. Write a fully optimized long-form blog article in ${language}.

Requirements:
- Target keyword: "${keyword}" — use naturally in title, first 100 words, H2s, and conclusion (avoid stuffing).
- Target length: ~${wordTarget} words.
- Compelling SEO title under 60 characters with the target keyword.
- Meta description under 155 characters that drives clicks.
- URL-friendly slug (lowercase, hyphens, keyword-first).
- Clear outline of H2 sections (5-8 sections).
- Body markdown with H1, H2s, short paragraphs, bullet lists, bold key takeaways.
- Include statistics, examples, and actionable takeaways.
- 4-6 FAQ items optimized for People Also Ask.
- Natural, expert tone. No fluff. No generic AI filler.${voiceBlock}

Return ONLY via the tool call.`;

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
          { role: "user", content: `Topic: ${topic}\nPrimary keyword: ${keyword}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_blog",
              description: "Return the full SEO blog article.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  metaDescription: { type: "string" },
                  slug: { type: "string" },
                  outline: { type: "array", items: { type: "string" } },
                  markdown: { type: "string" },
                  faq: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        q: { type: "string" },
                        a: { type: "string" },
                      },
                      required: ["q", "a"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "metaDescription", "slug", "outline", "markdown", "faq"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_blog" } },
      }),
    });

    if (response.status === 429) {
      return { title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [], error: "Rate limit reached. Try again shortly." };
    }
    if (response.status === 402) {
      return { title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [], error: "AI credits exhausted." };
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("SEO blog AI error:", response.status, text);
      return { title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [], error: "Failed to generate blog." };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return { title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [], error: "No blog returned." };
    }
    const args = JSON.parse(toolCall.function.arguments);
    return {
      title: args.title || "",
      metaDescription: args.metaDescription || "",
      slug: args.slug || "",
      outline: Array.isArray(args.outline) ? args.outline : [],
      markdown: args.markdown || "",
      faq: Array.isArray(args.faq) ? args.faq : [],
    };
  } catch (err) {
    console.error("SEO blog error:", err);
    return { title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [], error: "Failed to connect to AI service." };
  }
}
