import { callClaude, callClaudeWithTool } from "./anthropic.server";
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
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return { url, headings: [] };
    if (isBlockedHost(u.hostname)) return { url, headings: [] };
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 PostSparkBot/1.0" },
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
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
  const limited = competitorUrls.slice(0, 3).filter((u) => /^https?:\/\//i.test(u));
  const competitorHeadings = await Promise.all(limited.map(fetchCompetitor));

  const competitorBlock = competitorHeadings.length
    ? "\n\nCompetitor headings (analyze structure, gaps, topics — then beat them):\n" +
      competitorHeadings
        .map((c) => `URL: ${c.url}\n${c.headings.map((h) => `  - ${h}`).join("\n") || "  (no headings extracted)"}`)
        .join("\n\n")
    : "";

  const internalBlock = internalLinkCandidates.length
    ? "\n\nExisting internal posts (suggest relevant ones with natural anchors):\n" +
      internalLinkCandidates.slice(0, 30).map((p) => `- ${p.title} (/blog/${p.slug})`).join("\n")
    : "";

  const systemPrompt = `You are an elite SEO strategist who has built outlines for 500+ page-1 ranking articles. Build an outline that beats competitors for "${keyword}".

Rules:
- Write in ${language}.
- Title under 60 chars, includes keyword naturally.
- 6-9 H2 sections covering full search intent.
- Each H2 may include 2-4 H3 sub-points.
- Cover gaps competitors miss; rearrange topics for better flow.
- Suggest 3-6 internal links from the candidate list (only genuinely relevant). Natural keyword-rich anchors.${competitorBlock}${internalBlock}`;

  const result = await callClaudeWithTool<ClaudeOutlineResponse>({
    systemPrompt,
    userPrompt: `Topic: ${topic}\nPrimary keyword: ${keyword}\n\nReturn the outline + internal link suggestions via return_outline.`,
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
  seoScore?: number;
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

export interface SeoBlogOpts {
  articleType?: string;
  audience?: string;
  niche?: string;
  tone?: string;
  sections?: string[];
  secondaryKeywords?: string;
  competitorAngle?: string;
  /** Approved outline (H2 + optional H3s) the article MUST follow exactly. */
  approvedOutline?: OutlineSection[];
  /** Headings scraped from competitors so the article can beat their coverage. */
  competitorGaps?: string[];
  /** Internal links to weave in naturally. */
  internalLinks?: { anchor: string; slug: string }[];
}


function computeSeoScore(blog: ClaudeBlogResponse, keyword: string, wordTarget: number): number {
  let score = 5.0;
  const md = (blog.markdown || "").toLowerCase();
  const kw = keyword.toLowerCase();
  const words = (blog.markdown || "").split(/\s+/).length;

  if (blog.title && blog.title.toLowerCase().includes(kw)) score += 1.0;
  if (blog.title && blog.title.length <= 65) score += 0.5;
  if (blog.metaDescription && blog.metaDescription.length >= 140 && blog.metaDescription.length <= 165) score += 0.8;
  if (blog.metaDescription && blog.metaDescription.toLowerCase().includes(kw)) score += 0.4;
  if (md.indexOf(kw) > -1 && md.indexOf(kw) < 500) score += 0.5;
  if (Math.abs(words - wordTarget) / wordTarget < 0.15) score += 0.6;
  if (blog.faq && blog.faq.length >= 4) score += 0.5;
  if (blog.outline && blog.outline.length >= 5) score += 0.4;
  if (blog.slug && /^[a-z0-9-]+$/.test(blog.slug)) score += 0.3;

  return Math.min(10, Math.round(score * 10) / 10);
}

export async function generateSeoBlog(
  topic: string,
  keyword: string,
  wordTarget: number,
  language: string,
  brandVoiceSummary = "",
  opts: SeoBlogOpts = {},
): Promise<SeoBlogResult> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const articleType = opts.articleType || "How-to Guide";
  const audience = opts.audience || "general readers";
  const niche = opts.niche || "General";
  const tone = opts.tone || "Professional";
  const sections = (opts.sections && opts.sections.length
    ? opts.sections
    : ["Meta title + description", "Table of contents", "Introduction hook", "FAQ section (5 Q&As)"]).join(", ");
  const secondary = opts.secondaryKeywords?.trim() ? `\nSECONDARY KEYWORDS: ${opts.secondaryKeywords.trim()}` : "";
  const angle = opts.competitorAngle?.trim() ? `\nCOMPETITOR ANGLE: ${opts.competitorAngle.trim()}` : "";
  const outlineBlock = opts.approvedOutline?.length
    ? "\n\nAPPROVED OUTLINE — follow this structure exactly, in this order, using these H2s verbatim:\n" +
      opts.approvedOutline
        .map((s, i) => `${i + 1}. ## ${s.h2}${s.h3?.length ? "\n" + s.h3.map((h) => `   - ### ${h}`).join("\n") : ""}`)
        .join("\n")
    : "";
  const gapBlock = opts.competitorGaps?.length
    ? "\n\nCOMPETITOR HEADINGS (cover these topics better, or deliberately beat them with a stronger angle):\n" +
      opts.competitorGaps.slice(0, 40).map((h) => `- ${h}`).join("\n")
    : "";
  const linkBlock = opts.internalLinks?.length
    ? "\n\nINTERNAL LINKS — weave each in once, naturally, as markdown links:\n" +
      opts.internalLinks.slice(0, 8).map((l) => `- [${l.anchor}](/blog/${l.slug})`).join("\n")
    : "";

  const systemPrompt = `You are an elite SEO content strategist and writer who has helped 500+ blogs rank on page 1 of Google. You write for humans first, search engines second.

ASSIGNMENT: Write a complete, publication-ready ${articleType} blog post.

TOPIC: ${topic}
PRIMARY KEYWORD: "${keyword}" — use naturally 1 time per 300 words (no keyword stuffing).${secondary}
AUDIENCE: ${audience}
INDUSTRY/NICHE: ${niche}
TARGET LENGTH: ${wordTarget} words (hit within 10%).
TONE: ${tone}
LANGUAGE: ${language}
REQUIRED SECTIONS: ${sections}${angle}${outlineBlock}${gapBlock}${linkBlock}


SEO QUALITY RULES (non-negotiable):
1. H1 title: Include primary keyword naturally. Under 65 characters.
2. First paragraph: State exactly what the reader will learn. Include keyword in first 100 words.
3. H2 headings: Use secondary keywords naturally. Make them specific, not generic.
4. Every section: Must deliver real value — no filler paragraphs.
5. Include 2-3 specific data points or note where they should be sourced.
6. Meta description: 150-160 characters. Include keyword. Create urgency or curiosity.
7. FAQ: 5 questions matching "People also ask" search intent.
8. Conclusion: End with a specific, actionable CTA — not "In conclusion, we learned...".

WRITING QUALITY:
- Every sentence earns its place — delete any sentence that doesn't add value
- Vary sentence length: mix short punchy sentences with detailed explanations
- Use second person ("you") to speak directly
- Concrete examples over vague statements
- No corporate jargon. No "In today's fast-paced world.". No "It is important to note."
- Never use em-dashes (—). Use commas, parentheses, or two short sentences.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeBlogResponse>({
    systemPrompt,
    userPrompt: `Topic: ${topic}\nPrimary keyword: ${keyword}\n\nReturn the full ${articleType} via return_blog.`,
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
    seoScore: computeSeoScore(d, keyword, wordTarget),
  };
}

export async function refreshSeoBlog(
  oldContent: string,
  keyword: string,
  language: string,
): Promise<{ markdown: string; error?: string }> {
  const system = `You are an SEO content editor. Refresh and improve this existing blog post for the target keyword "${keyword}". Write in ${language}.

Improvements to make:
1. Update outdated stats and examples (mark with [Verify: YYYY] if you can't cite a source)
2. Improve keyword density naturally (target keyword 1x per 300 words)
3. Add a missing FAQ section (5 Q&As) at the end
4. Strengthen the introduction hook — make first line scroll-stopping
5. Add a markdown table of contents after the intro
6. Tighten any filler. Remove "In today's...", "It's important to note...", "Furthermore", etc.
7. Never use em-dashes — use commas, parentheses, or two short sentences

Output ONLY the refreshed markdown. No preamble.`;

  const r = await callClaude({ systemPrompt: system, userPrompt: oldContent, maxTokens: 4000 });
  if (r.error) return { markdown: "", error: r.error };
  return { markdown: r.text };
}

export type SectionMode = "rewrite" | "expand" | "shorten" | "simplify" | "add_data" | "add_example";

const SECTION_INTENT: Record<SectionMode, string> = {
  rewrite: "Rewrite this section so it is sharper, more specific, and more useful. Same length.",
  expand: "Expand this section with more depth, detail and concrete examples. Roughly double the length.",
  shorten: "Tighten this section to roughly half the length without losing any real insight.",
  simplify: "Rewrite this section in plainer language a beginner can follow. Keep every fact.",
  add_data: "Rewrite this section adding 2-3 specific data points or benchmarks. Mark uncited numbers as [Verify].",
  add_example: "Rewrite this section adding one concrete, realistic worked example the reader can copy.",
};

/** Regenerate a single markdown section of an article. */
export async function rewriteBlogSection(
  sectionMarkdown: string,
  mode: SectionMode,
  keyword: string,
  language: string,
  tone = "Professional",
  brandVoiceSummary = "",
): Promise<{ markdown: string; error?: string }> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const system = `You are an elite SEO editor. You are editing ONE section of a larger article about "${keyword}".

TASK: ${SECTION_INTENT[mode]}

RULES:
- Write in ${language}. Tone: ${tone}.
- Keep the section's original heading level and heading text unless it is weak, in which case improve the wording only.
- Use the keyword naturally at most once. No stuffing.
- No filler, no "In today's world", no "It is important to note".
- Never use em-dashes. Use commas, parentheses, or two short sentences.
- Output ONLY the replacement markdown for this section. No preamble, no code fences.${voiceBlock}`;

  const r = await callClaude({ systemPrompt: system, userPrompt: sectionMarkdown, maxTokens: 2000 });
  if (r.error) return { markdown: "", error: r.error };
  return { markdown: (r.text || "").replace(/^```(?:markdown)?\n?|\n?```$/g, "").trim() };
}

/** Generate SEO title + meta description variants for an existing article. */
export async function generateMetaVariants(
  title: string,
  articleMarkdown: string,
  keyword: string,
  language: string,
): Promise<{ variants: { title: string; metaDescription: string }[]; error?: string }> {
  const r = await callClaudeWithTool<{ variants: { title: string; metaDescription: string }[] }>({
    systemPrompt: `You write click-magnet SERP snippets. Language: ${language}. Primary keyword: "${keyword}".

Return 4 distinct title + meta description pairs for this article.
Rules: title <= 60 chars and includes the keyword; meta description 150-160 chars, includes the keyword, creates curiosity or urgency. No em-dashes. No clickbait lies.`,
    userPrompt: `Current title: ${title}\n\nArticle:\n${articleMarkdown.slice(0, 6000)}\n\nReturn via return_meta.`,
    toolName: "return_meta",
    toolDescription: "Return 4 SERP snippet variants.",
    toolSchema: {
      type: "object",
      properties: {
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: { title: { type: "string" }, metaDescription: { type: "string" } },
            required: ["title", "metaDescription"],
          },
        },
      },
      required: ["variants"],
    },
    maxTokens: 1200,
  });
  if (r.error || !r.data) return { variants: [], error: r.error || "No variants returned." };
  return { variants: Array.isArray(r.data.variants) ? r.data.variants.slice(0, 4) : [] };
}
