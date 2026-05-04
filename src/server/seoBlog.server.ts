import { callClaudeWithTool } from "./anthropic.server";

export interface SeoBlogResult {
  title: string;
  metaDescription: string;
  slug: string;
  outline: string[];
  markdown: string;
  faq: { q: string; a: string }[];
  error?: string;
}

interface ClaudeBlogResponse {
  title: string;
  metaDescription: string;
  slug: string;
  outline: string[];
  markdown: string;
  faq: { q: string; a: string }[];
}

export async function generateSeoBlog(
  topic: string,
  keyword: string,
  wordTarget: number,
  language: string,
  brandVoiceSummary = "",
): Promise<SeoBlogResult> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are an expert SEO content writer with 10 years experience writing ranking blog posts. You understand search intent, keyword placement, and how to write content that both ranks on Google and genuinely helps readers. Write in ${language}.

Requirements:
- Target keyword: "${keyword}" — use naturally in title, first 100 words, H2s, and conclusion (avoid stuffing).
- Target length: ~${wordTarget} words.
- Compelling SEO title under 60 characters with the target keyword.
- Meta description under 155 characters that drives clicks.
- URL-friendly slug (lowercase, hyphens, keyword-first).
- Outline of 5-8 H2 sections.
- Body markdown with H1, H2s, short paragraphs, bullet lists, bold key takeaways.
- Include statistics, examples, and actionable takeaways.
- 4-6 FAQ items optimized for People Also Ask.
- Natural, expert tone. No fluff. No generic AI filler.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeBlogResponse>({
    systemPrompt,
    userPrompt: `Topic: ${topic}\nPrimary keyword: ${keyword}\n\nReturn the full article via the return_blog tool.`,
    toolName: "return_blog",
    toolDescription: "Return the full SEO blog article.",
    toolSchema: {
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
          },
        },
      },
      required: ["title", "metaDescription", "slug", "outline", "markdown", "faq"],
    },
    maxTokens: 4000,
  });

  if (result.error || !result.data) {
    return {
      title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [],
      error: result.error || "No blog returned.",
    };
  }
  const d = result.data;
  return {
    title: d.title || "",
    metaDescription: d.metaDescription || "",
    slug: d.slug || "",
    outline: Array.isArray(d.outline) ? d.outline : [],
    markdown: d.markdown || "",
    faq: Array.isArray(d.faq) ? d.faq : [],
  };
}
