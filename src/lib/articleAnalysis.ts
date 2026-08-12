/** Markdown section utilities shared by the SEO Blog studio. */

export interface MdSection {
  /** Heading text without the leading #s (empty for the intro block). */
  heading: string;
  level: number;
  /** Full markdown for this section, heading line included. */
  markdown: string;
}

/** Split an article into H2-level sections (leading content becomes an intro section). */
export function splitSections(markdown: string): MdSection[] {
  const lines = (markdown || "").split("\n");
  const out: MdSection[] = [];
  let buf: string[] = [];
  let heading = "";
  let level = 0;

  const flush = () => {
    const md = buf.join("\n").trim();
    if (md) out.push({ heading, level, markdown: md });
    buf = [];
  };

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (m && m[1].length <= 2) {
      flush();
      level = m[1].length;
      heading = m[2].trim();
      buf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

export function joinSections(sections: MdSection[]): string {
  return sections.map((s) => s.markdown.trim()).join("\n\n");
}

export interface SeoStats {
  words: number;
  chars: number;
  readingMinutes: number;
  keywordCount: number;
  density: number;
  keywordInTitle: boolean;
  keywordInFirst100: boolean;
  h2Count: number;
  h3Count: number;
  linkCount: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  listCount: number;
  tableCount: number;
  faqCount: number;
  avgSentenceWords: number;
  longParagraphs: number;
  passiveHints: number;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function analyzeArticle(markdown: string, keyword: string, title = ""): SeoStats {
  const md = markdown || "";
  const plain = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  const words = plain.split(/\s+/).filter(Boolean).length;
  const kw = keyword.trim().toLowerCase();
  const keywordCount = kw
    ? (plain.toLowerCase().match(new RegExp(esc(kw), "g")) || []).length
    : 0;
  const first100 = plain.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
  const links = md.match(/\[[^\]]*\]\(([^)]+)\)/g) || [];
  const internalLinks = links.filter((l) => /\((\/|#)/.test(l)).length;
  const sentences = plain.split(/[.!?]+\s/).filter((s) => s.trim().split(/\s+/).length > 2);
  const paragraphs = md.split(/\n{2,}/).filter((p) => !/^\s*#/.test(p) && p.trim().length > 0);

  return {
    words,
    chars: plain.trim().length,
    readingMinutes: Math.max(1, Math.round(words / 225)),
    keywordCount,
    density: words ? Math.round((keywordCount / words) * 10000) / 100 : 0,
    keywordInTitle: !!kw && title.toLowerCase().includes(kw),
    keywordInFirst100: !!kw && first100.includes(kw),
    h2Count: (md.match(/^##\s/gm) || []).length,
    h3Count: (md.match(/^###\s/gm) || []).length,
    linkCount: links.length,
    internalLinks,
    externalLinks: links.length - internalLinks,
    imageCount: (md.match(/!\[[^\]]*\]\(/g) || []).length,
    listCount: (md.match(/^\s*([-*]|\d+\.)\s/gm) || []).length,
    tableCount: (md.match(/^\|.*\|$/gm) || []).length ? 1 : 0,
    faqCount: (md.match(/^###?\s.*\?\s*$/gm) || []).length,
    avgSentenceWords: sentences.length
      ? Math.round(plain.split(/\s+/).filter(Boolean).length / sentences.length)
      : 0,
    longParagraphs: paragraphs.filter((p) => p.split(/\s+/).length > 120).length,
    passiveHints: (plain.match(/\b(was|were|been|being|is|are)\s+\w+ed\b/gi) || []).length,
  };
}

/** 0-100 on-page score derived from the computed stats. */
export function scoreArticle(s: SeoStats, wordTarget: number, metaDescription: string): {
  score: number;
  checks: { label: string; ok: boolean; hint: string }[];
} {
  const checks = [
    { label: "Keyword in title", ok: s.keywordInTitle, hint: "Put the exact keyword in the H1." },
    { label: "Keyword in first 100 words", ok: s.keywordInFirst100, hint: "Mention the keyword in the opening paragraph." },
    { label: "Density 0.5-2.5%", ok: s.density >= 0.5 && s.density <= 2.5, hint: `Currently ${s.density}%.` },
    { label: "Meta description 140-165 chars", ok: metaDescription.length >= 140 && metaDescription.length <= 165, hint: `Currently ${metaDescription.length} chars.` },
    { label: "5+ H2 sections", ok: s.h2Count >= 5, hint: "Add more H2s to cover full intent." },
    { label: "Sub-headings present", ok: s.h3Count >= 3, hint: "Break long sections into H3s." },
    { label: "Length within 15% of target", ok: wordTarget ? Math.abs(s.words - wordTarget) / wordTarget <= 0.15 : true, hint: `${s.words} of ~${wordTarget} words.` },
    { label: "2+ internal links", ok: s.internalLinks >= 2, hint: "Link to related posts on your site." },
    { label: "FAQ block", ok: s.faqCount >= 3, hint: "Add 5 People-Also-Ask style Q&As." },
    { label: "Scannable lists", ok: s.listCount >= 5, hint: "Add bullet lists or steps." },
    { label: "No 120+ word paragraphs", ok: s.longParagraphs === 0, hint: `${s.longParagraphs} paragraph(s) too long.` },
    { label: "Avg sentence under 24 words", ok: s.avgSentenceWords > 0 && s.avgSentenceWords <= 24, hint: `Currently ${s.avgSentenceWords} words.` },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}
