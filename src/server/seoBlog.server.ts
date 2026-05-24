import { callClaudeWithTool } from "./anthropic.server";
import { isBlockedHost } from "./import.server";

export interface OutlineSection {
  h2: string;
  h3?: string[];
}

export interface SeoOutlineResult {
  title: string;
  outline: OutlineSection[];
  competitorHeadings: { url: string; headings: string[] }[];
  suggestedInternalLinks: { title: string; slug: string; anchor: string }[];
  error?: string;
}

interface ClaudeOutlineResponse {
  title: string;
  outline: OutlineSection[];
  suggestedInternalLinks: { title: string; slug: string; anchor: string }[];
}

/** Lightweight HTML heading extractor — no DOM, regex only (Worker-safe). */
function extractHeadings(html: string): string[] {
  const out: string[] = [];
  const re = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text && text.length < 200) out.push(text);
    if (out.length >= 25) break;
  }
  return out;
}

async function fetchCompetitor(url: string): Promise<{ url: string; headings: string[] }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 PostSparkBot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { url, headings: [] };
    const html = await res.text();
    return { url, headings: extractHeadings(html) };
  } catch {
    return { url, headings: [] };
  }
}

export async function generateSeoOutline(
  keyword: string,
  topic: string,
  language: string,
  competitorUrls: string[],
  internalLinkCandidates: { title: string; slug: string }[],
): Promise<SeoOutlineResult> {
  // Fetch competitors in parallel (max 3)
  const limited = competitorUrls.slice(0, 3).filter((u) => /^https?:\/\//i.test(u));
  const competitorHeadings = await Promise.all(limited.map(fetchCompetitor));

  const competitorBlock = competitorHeadings.length
    ? "\n\nCompetitor headings (analyze structure, gaps, and topics they cover — then beat them):\n" +
      competitorHeadings
        .map((c) => `URL: ${c.url}\n${c.headings.map((h) => `  - ${h}`).join("\n") || "  (no headings extracted)"}`)
        .join("\n\n")
    : "";

  const internalBlock = internalLinkCandidates.length
    ? "\n\nExisting internal posts (suggest relevant ones to link to with natural anchors):\n" +
      internalLinkCandidates.slice(0, 30).map((p) => `- ${p.title} (/blog/${p.slug})`).join("\n")
    : "";

  const systemPrompt = `You are an elite SEO strategist. Build an outline that beats the competition for the keyword "${keyword}".

Rules:
- Write in ${language}.
- Title under 60 chars, includes keyword.
- 6-9 H2 sections covering search intent fully.
- Each H2 may include 2-4 H3 sub-points.
- Cover gaps competitors miss; rearrange topics for better flow.
- Suggest 3-6 internal links from the candidate list (only if genuinely relevant). Anchor text should be natural and keyword-rich.${competitorBlock}${internalBlock}`;

  const result = await callClaudeWithTool<ClaudeOutlineResponse>({
    systemPrompt,
    userPrompt: `Topic: ${topic}\nPrimary keyword: ${keyword}\n\nReturn the outline + internal link suggestions via the return_outline tool.`,
    toolName: "return_outline",
    toolDescription: "Return the SEO outline and internal link suggestions.",
    toolSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        outline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              h2: { type: "string" },
              h3: { type: "array", items: { type: "string" } },
            },
            required: ["h2"],
          },
        },
        suggestedInternalLinks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              anchor: { type: "string" },
            },
            required: ["title", "slug", "anchor"],
          },
        },
      },
      required: ["title", "outline", "suggestedInternalLinks"],
    },
    maxTokens: 2500,
  });

  if (result.error || !result.data) {
    return {
      title: "",
      outline: [],
      competitorHeadings,
      suggestedInternalLinks: [],
      error: result.error || "No outline returned.",
    };
  }
  return {
    title: result.data.title || "",
    outline: Array.isArray(result.data.outline) ? result.data.outline : [],
    competitorHeadings,
    suggestedInternalLinks: Array.isArray(result.data.suggestedInternalLinks)
      ? result.data.suggestedInternalLinks
      : [],
  };
}

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
