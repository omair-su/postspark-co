import { callClaude } from "./anthropic.server";

export type PodcastFormat =
  | "tweets"
  | "thread"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "show_notes"
  | "summary"
  | "blog_post"
  | "newsletter"
  | "youtube_description"
  | "title_suggestions"
  | "pull_quotes"
  | "chapters"
  | "key_topics"
  | "promo_email"
  | "sponsor_pitch";

export interface PodcastPackInput {
  transcript: string;
  episodeTitle?: string;
  showName?: string;
  guest?: string;
  niche?: string;
  formats: PodcastFormat[];
  quantities?: Partial<Record<PodcastFormat, number>>;
  brandVoiceSummary?: string;
}

const FORMAT_INSTRUCTIONS: Record<PodcastFormat, (qty: number) => string> = {
  tweets: (q) => `## Tweets\n${q} standalone tweets pulled from the most quotable moments. Each ≤280 chars, numbered. Include speaker attribution where natural.`,
  thread: () => `## X Thread\nOne thread of 8-12 connected tweets. Tweet 1 = killer hook + promise. Numbered "1/N".`,
  linkedin: (q) => `## LinkedIn Posts\n${q} LinkedIn post(s), 200-400 words each, professional storytelling, short paragraphs, ends with question or CTA. Separate with "---".`,
  instagram: (q) => `## Instagram Captions\n${q} caption(s), ~200 chars + 10 strategic hashtags on a new line.`,
  tiktok: (q) => `## TikTok Hooks\n${q} short-form video hook(s) with [VISUAL] cues, ≤60 seconds each.`,
  facebook: (q) => `## Facebook Posts\n${q} conversational post(s) 100-200 words, designed for shares.`,
  show_notes: () => `## Show Notes\nFull show notes block: 2-3 paragraph episode summary (SEO-friendly), then list of mentioned resources/links if any.`,
  summary: () => `## Episode Summary\n2-3 paragraph summary for podcast platforms — makes someone want to listen.`,
  blog_post: () => `## Blog Post\n800-1200 word blog post. SEO title (H1) with primary keyword, intro recapping the key insight, 3-4 H2 sections derived from the transcript, direct quotes attributed to ${"the guest"}, conclusion with "listen to the full episode" CTA.`,
  newsletter: () => `## Newsletter Section\n200-300 word newsletter section. Reader-first ("what you missed"), one key takeaway, link-back CTA.`,
  youtube_description: () => `## YouTube Description\nFull YouTube-optimized description: 1-paragraph hook, bulleted "In this episode", timestamps block (estimate from transcript flow), socials placeholder, hashtags.`,
  title_suggestions: () => `## Episode Title Suggestions\n5 episode title options, each under 70 chars, SEO-aware, curiosity-driven. Numbered.`,
  pull_quotes: (q) => `## Pull Quotes\n${q || 10} of the best quotable lines, verbatim from the transcript, with speaker attribution. Numbered.`,
  chapters: () => `## Timestamps & Chapters\nChapter list with estimated timestamps. If the transcript already includes [MM:SS] markers, use them — otherwise estimate from flow. For EACH chapter output this exact block:\n\n### [MM:SS] <Chapter Title>\n<1-2 sentence summary of what's covered>\n**Pull quotes:**\n- "<verbatim quote from this chapter>" — Speaker\n- "<verbatim quote from this chapter>" — Speaker\n- "<verbatim quote from this chapter>" — Speaker\n\nGenerate 6-12 chapters covering the full episode. Every pull quote MUST be verbatim from the transcript inside that chapter's time range, with speaker attribution when known.`,
  key_topics: () => `## Key Topics & Keywords\n10 keywords/topics, comma-separated, suitable for SEO and podcast tags.`,
  promo_email: () => `## Podcast Promo Email\nShort email to a mailing list announcing this episode. Subject line + preview text + 150-200 word body + CTA.`,
  sponsor_pitch: () => `## Cold Sponsor Pitch\n150-word cold email pitching this episode to a relevant sponsor. Mention the audience, the episode topic, and a clear ask.`,
};

export async function generatePodcastPack(
  input: PodcastPackInput,
): Promise<{ output: string; error?: string }> {
  const { transcript, formats } = input;
  if (!transcript.trim() || formats.length === 0) {
    return { output: "", error: "Missing transcript or formats." };
  }

  const ctxLines = [
    input.episodeTitle && `Episode title: ${input.episodeTitle}`,
    input.showName && `Show: ${input.showName}`,
    input.guest && `Guest(s): ${input.guest}`,
    input.niche && `Niche/topic: ${input.niche}`,
  ].filter(Boolean);
  const context = ctxLines.length ? `\n\nEPISODE CONTEXT:\n${ctxLines.join("\n")}` : "";

  const sections = formats
    .map((f) => FORMAT_INSTRUCTIONS[f]?.(input.quantities?.[f] ?? 5))
    .filter(Boolean)
    .join("\n\n");

  const voice = input.brandVoiceSummary?.trim()
    ? `\n\nMATCH THIS BRAND VOICE EXACTLY (rhythm, vocabulary, formatting habits):\n${input.brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are an expert podcast producer and content strategist who turns raw podcast transcripts into complete, ready-to-publish content packages.

QUALITY RULES (non-negotiable):
- Use exact quotes from the transcript (do NOT paraphrase the guest's words inside quote marks).
- Reference the guest by name throughout when provided.
- Maintain the actual tone and energy of the episode.
- Every output is ready to publish — no placeholders like "[insert link]" unless explicitly requested.
- Each section must start with the exact markdown header given below (e.g. "## Show Notes") so the UI can tab them.
- Never invent facts not present in the transcript.

GENERATE THE FOLLOWING SECTIONS, IN THIS ORDER:

${sections}${context}${voice}`;

  const result = await callClaude({
    systemPrompt,
    userPrompt: `PODCAST TRANSCRIPT:\n\n${transcript}`,
    maxTokens: 8000,
  });

  if (result.error) return { output: "", error: result.error };
  return { output: result.text };
}
