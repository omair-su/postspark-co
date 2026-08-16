import { callClaude } from "@/lib/anthropic.server";

export interface VoiceProfile {
  tone_sliders?: { formality?: number; humor?: number; enthusiasm?: number; complexity?: number };
  dos?: string[];
  donts?: string[];
  emoji_density?: "none" | "minimal" | "heavy";
  sentence_length?: "short" | "balanced" | "long";
  cta_style?: "soft" | "direct";
}

function describeSlider(name: string, low: string, high: string, v: number): string {
  if (v <= 20) return `very ${low}`;
  if (v <= 40) return `${low}`;
  if (v <= 60) return `balanced ${name}`;
  if (v <= 80) return `${high}`;
  return `very ${high}`;
}

export function buildVoiceProfileBlock(vp?: VoiceProfile): string {
  if (!vp) return "";
  const bits: string[] = [];
  if (vp.tone_sliders) {
    const t = vp.tone_sliders;
    const parts: string[] = [];
    if (typeof t.formality === "number") parts.push(describeSlider("formality", "casual", "formal", t.formality));
    if (typeof t.humor === "number") parts.push(describeSlider("humor", "serious", "playful", t.humor));
    if (typeof t.enthusiasm === "number") parts.push(describeSlider("energy", "reserved", "high-energy", t.enthusiasm));
    if (typeof t.complexity === "number") parts.push(describeSlider("complexity", "simple", "nuanced", t.complexity));
    if (parts.length) bits.push(`Tone dial: ${parts.join(", ")}.`);
  }
  if (vp.dos?.length) bits.push(`ALWAYS use these words/phrases when natural: ${vp.dos.slice(0, 30).join(", ")}.`);
  if (vp.donts?.length) bits.push(`NEVER use these words/phrases: ${vp.donts.slice(0, 30).join(", ")}.`);
  if (vp.emoji_density) {
    const map = { none: "No emojis at all.", minimal: "Use emojis very sparingly (0-1 max).", heavy: "Use emojis liberally where they fit." };
    bits.push(map[vp.emoji_density]);
  }
  if (vp.sentence_length) {
    const map = { short: "Prefer short, punchy sentences.", balanced: "Mix sentence lengths naturally.", long: "Use longer, more nuanced sentences." };
    bits.push(map[vp.sentence_length]);
  }
  if (vp.cta_style) {
    const map = { soft: "CTAs should feel like invitations, not commands.", direct: "CTAs must be direct and imperative." };
    bits.push(map[vp.cta_style]);
  }
  if (!bits.length) return "";
  return `\n\nVOICE GUARDRAILS (must follow):\n- ${bits.join("\n- ")}`;
}


export async function generateRepurposedContent(
  inputText: string,
  selectedTypes: string[],
  tone: string = "professional",
  customInstructions: string = "",
  brandVoiceSummary: string = "",
  language: string = "English",
  voiceProfile?: VoiceProfile,
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
          return "1 Threads (Meta) post chain (8-12 connected posts, numbered, with a compelling hook)";
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

  const guardrails = buildVoiceProfileBlock(voiceProfile);
  const systemPrompt = `You are PostSpark's AI content engine. You are an expert content strategist and copywriter who specializes in repurposing content for maximum reach across multiple platforms. Always produce high-quality, platform-native content that sounds human and engaging — never robotic or generic.

For this request, generate: ${typeInstructions}. Format each section with a clear markdown header (e.g. "## Tweets"). Be engaging, value-driven, and platform-appropriate.${toneInstruction}${languageBlock}${customBlock}${voiceBlock}${guardrails}`;

  const result = await callClaude({
    systemPrompt,
    userPrompt: inputText,
    maxTokens: 4000,
  });

  if (result.error) return { output: "", error: result.error };
  return { output: result.text };
}

/* ---------------------------------------------------------------------------
 * FOCUSED PER-FORMAT GENERATION
 * One Claude call per format → each gets full token budget → world-class output.
 * ------------------------------------------------------------------------ */

export interface FormatConfig {
  format: string;
  count?: number;
  style?: string;
  length?: string;
}

function buildSharedSuffix(
  tone: string,
  styleModifiers: string[],
  customInstructions: string,
  brandVoiceSummary: string,
  language: string,
  voiceProfile?: VoiceProfile,
): string {
  const lang = language && language !== "English"
    ? `\n\nLANGUAGE: Write ALL output in ${language} using native idioms and natural phrasing.`
    : "";
  const mods = styleModifiers.length
    ? `\n\nSTYLE MODIFIERS (must apply): ${styleModifiers.join(", ")}.`
    : "";
  const custom = customInstructions.trim()
    ? `\n\nADDITIONAL INSTRUCTIONS: ${customInstructions.trim()}`
    : "";
  const voice = brandVoiceSummary.trim()
    ? `\n\nCRITICAL — Match this brand voice EXACTLY (rhythm, vocabulary, punctuation, formatting habits):\n${brandVoiceSummary.trim()}`
    : "";
  const guardrails = buildVoiceProfileBlock(voiceProfile);
  return `\n\nTONE: ${tone}.${mods}${custom}${voice}${guardrails}${lang}`;
}

/** Every multi-piece format must separate posts with this exact marker. */
const DELIM = "===PIECE===";

function deliveryRule(count: number, noun: string): string {
  if (count <= 1) {
    return `OUTPUT: exactly ONE complete ${noun}. Do NOT number it. Do NOT add commentary, headers, or alternatives.`;
  }
  return `OUTPUT: exactly ${count} complete ${noun}s. Separate each one with a line containing ONLY ${DELIM}. Do NOT number them, do NOT add headers or commentary. Every ${noun} must be fully written and self-contained — no fragments, no "see above", no shared setup.`;
}

const DEPTH_RULES = `
DEPTH & QUALITY (non-negotiable):
- Think before writing: choose a distinct angle, hook, proof point and payoff for EACH piece.
- Never compress, never truncate, never trail off with "…". Write the piece to its natural full length.
- Never repeat the same idea, hook, opening word or structure across pieces.
- Pull concrete specifics out of the source: numbers, names, examples, quotes, causes.
- Zero filler: no "In today's world", "It's important to note", "I wanted to share", no corporate jargon.
- Sound like a sharp human writing from real experience, not an assistant summarizing.`;

/** Token budget scales with how many pieces were asked for. */
function budget(base: number, count: number, perPiece: number): number {
  return Math.min(16000, base + Math.max(0, count - 1) * perPiece);
}

function buildFormatPrompt(
  cfg: FormatConfig,
  tone: string,
  styleModifiers: string[],
  customInstructions: string,
  brandVoiceSummary: string,
  language: string,
  voiceProfile?: VoiceProfile,
): { system: string; maxTokens: number } {
  const suffix = buildSharedSuffix(tone, styleModifiers, customInstructions, brandVoiceSummary, language, voiceProfile);
  const style = cfg.style || "";
  const count = cfg.count || 1;

  switch (cfg.format) {
    case "tweets":
      return {
        maxTokens: budget(1600, count, 320),
        system: `You are an elite Twitter/X content strategist who writes for top founders and creators. Your tweets get thousands of impressions because they are specific, punchy, and human.

TASK: Extract the ${count} strongest, most shareable insight${count > 1 ? "s" : ""} from the source and write ${count === 1 ? "it" : "them"} as standalone tweet${count > 1 ? "s" : ""}.

TWITTER RULES:
1. Each tweet stands alone with full meaning.
2. Start with a hook — the first 5 words must stop the scroll.
3. Under 270 characters. Specific over clever.
4. Vary structure: statements, questions, lists, mini-stories.
${DEPTH_RULES}

STYLE: ${style || "Standalone tweets"}

${deliveryRule(count, "tweet")}${suffix}`,
      };

    case "linkedin":
      return {
        maxTokens: budget(2600, count, 1100),
        system: `You are a LinkedIn content expert writing for founders and execs with 10K–500K followers. Your posts consistently earn 500+ reactions.

TASK: Write ${count} LinkedIn post${count > 1 ? "s" : ""} from the source.

LINKEDIN FORMAT RULES:
1. First line is EVERYTHING — must be so compelling readers click "see more".
2. SHORT paragraphs — 1-2 lines max, with real white space between them.
3. Length: 300-600 words is the sweet spot; never under 150.
4. End with ONE clear CTA or thought-provoking question.
5. First person, direct voice.

STRUCTURE — pick the strongest per post, and use a DIFFERENT one for each:
A) Hook → Story → Lesson → CTA
B) Contrarian statement → Why → Evidence → Takeaway
C) "X things I learned…" numbered insights
${DEPTH_RULES}

STYLE: ${style || "Long-form story"}

${deliveryRule(count, "LinkedIn post")}${suffix}`,
      };

    case "instagram":
      return {
        maxTokens: budget(1400, count, 400),
        system: `You are an Instagram caption strategist for creators with 50K+ followers.

TASK: Write ${count} Instagram caption${count > 1 ? "s" : ""} from the source.

RULES:
1. Hook in the first 125 characters (before the "…more" cut).
2. 150-400 characters of caption, then 10-15 strategic hashtags on their own final line.
3. Conversational, human, scroll-stopping. Mix story-driven and insight-driven.
${DEPTH_RULES}

STYLE: ${style || "With hashtags"}

${deliveryRule(count, "caption")}${suffix}`,
      };

    case "facebook":
      return {
        maxTokens: budget(1400, count, 500),
        system: `You are a Facebook content writer who creates genuinely shareable posts.

TASK: Write ${count} Facebook post${count > 1 ? "s" : ""}.

RULES:
1. Conversational, built for shares and comments.
2. 120-250 words each, fully developed.
3. End with a question or an invitation to share an experience.
${DEPTH_RULES}

${deliveryRule(count, "Facebook post")}${suffix}`,
      };

    case "thread": {
      const n = cfg.count || 5;
      const single = cfg.style === "Single posts";
      if (single) {
        return {
          maxTokens: budget(1500, n, 380),
          system: `You write Threads (Meta) posts that people actually stop for.

TASK: Write ${n} INDEPENDENT Threads post${n > 1 ? "s" : ""} from the source. These are NOT a chain — each one works completely on its own.

RULES:
1. Under 500 characters each (hard Threads limit).
2. Conversational, personality-forward — Threads rewards voice over polish.
3. Each post covers a different idea from the source.
${DEPTH_RULES}

${deliveryRule(n, "Threads post")}${suffix}`,
        };
      }
      return {
        maxTokens: budget(2200, n, 260),
        system: `You write viral Threads (Meta) post chains.

TASK: Turn the source into ONE connected Threads chain of exactly ${n} posts.

CHAIN RULES:
1. Post 1 = killer hook + promise. Make people NEED post 2.
2. Each following post delivers one specific idea and builds momentum.
3. Each post under 500 characters (Threads limit).
4. Conversational, human tone.
5. Final post = strong CTA or memorable takeaway.
${DEPTH_RULES}

OUTPUT: the single chain, with each post numbered 1/${n}, 2/${n}, … and separated by a blank line. This is ONE deliverable — do NOT use ${DELIM}, do not add commentary.${suffix}`,
      };
    }

    case "email":
      return {
        maxTokens: 3200,
        system: `You are an email copywriter whose newsletters get 40%+ open rates.

EMAIL TYPE: ${style || "Newsletter"}

TASK: Transform the source into ONE complete, compelling email.

STRUCTURE (return all sections, in this order, exactly once):
SUBJECT LINE OPTIONS: (3 options, mark the strongest with ★)
PREVIEW TEXT: (one line complementing the subject)
BODY:
- Opening hook (1 paragraph)
- Main content (400-700 words, fully developed with specifics)
- Key takeaway
- Clear CTA
- Sign-off

RULES:
1. NEVER truncate. Write the full email.
2. Subject lines: specific, curiosity-driven, under 50 chars.
3. No "I hope this email finds you well".
4. Conversational — one smart friend to another.
${DEPTH_RULES}

OUTPUT: ONE email only. Do NOT use ${DELIM}. Do not produce alternate versions.${suffix}`,
      };

    case "video": {
      const lengthLabel = cfg.length || "60 seconds";
      const wordTarget =
        lengthLabel.includes("30") ? "75 words" :
        lengthLabel.includes("60") ? "150 words" :
        lengthLabel.includes("3") ? "450 words" :
        lengthLabel.includes("5") ? "750 words" :
        lengthLabel.includes("10") ? "1500 words" : "150 words";
      return {
        maxTokens: 4000,
        system: `You write high-performing video scripts for YouTube, TikTok, Reels, and LinkedIn Video.

SCRIPT LENGTH: ${lengthLabel} (~${wordTarget})

STRUCTURE (use these exact markers):
[HOOK - 0:00-0:03]
[INTRO - 0:03-0:10]
[MAIN CONTENT]  — add [PAUSE], [EMPHASIS] and [B-ROLL: description] cues
[CTA - final 10 seconds]

RULES:
1. Spoken language — how people actually talk.
2. Short sentences. Active voice.
3. Total word count must match: ${wordTarget}.
${DEPTH_RULES}

OUTPUT: ONE script. Do NOT use ${DELIM}.${suffix}`,
      };
    }

    case "tiktok":
      return {
        maxTokens: budget(1600, count, 600),
        system: `You write TikTok / Reels scripts that go viral.

TASK: Write ${count} short-form video script${count > 1 ? "s" : ""} (60-90 seconds each).

RULES:
1. Hook in the first 3 seconds.
2. Pattern interrupt every 5-7 seconds.
3. End with a loop, twist, or CTA.
4. Include [VISUAL] cues throughout.
${DEPTH_RULES}

${deliveryRule(count, "script")}${suffix}`,
      };

    case "podcast":
      return {
        maxTokens: 3000,
        system: `You write podcast show notes for top business podcasts.

STYLE: ${style || "Show notes + quotes"}

OUTPUT (ONE document, do NOT use ${DELIM}):
- Episode Title (compelling, specific)
- One-paragraph summary
- Key Takeaways (5-7 bullets)
- Pull Quotes (3 quotable lines)
- Chapters & timestamps outline
- Links / Resources mentioned
${DEPTH_RULES}${suffix}`,
      };

    case "seo":
      return {
        maxTokens: 3000,
        system: `You are an SEO content strategist.

OUTPUT TYPE: ${style || "Blog intro"}

DELIVER (ONE document, do NOT use ${DELIM}):
- Suggested H1 title (60 chars max, keyword-rich)
- 3 meta descriptions (under 160 chars each)
- Blog intro paragraph (~150 words, hooks reader, primary keyword used naturally)
- 5 H2 subheadings outline
- 3 FAQ questions with answers
${DEPTH_RULES}${suffix}`,
      };

    case "carousel": {
      const slides = cfg.count || 8;
      return {
        maxTokens: budget(2000, slides, 140),
        system: `You design educational LinkedIn / Instagram carousels.

TASK: Create ONE ${slides}-slide carousel.

RULES per slide:
1. Slide 1 = HOOK (title + subhead, max 12 words combined).
2. Middle slides = one idea each, ≤25 words.
3. Last slide = CTA.
4. Each slide self-contained and readable in isolation.
${DEPTH_RULES}

OUTPUT (ONE deck, do NOT use ${DELIM}):
SLIDE 1:
Title: …
Body: …
SLIDE 2:
…${suffix}`,
      };
    }

    default:
      return {
        maxTokens: 2000,
        system: `Repurpose the source content into ${cfg.format}. High quality, complete, platform-native.${DEPTH_RULES}${suffix}`,
      };
  }
}

export async function generateOneFormat(opts: {
  inputText: string;
  format: string;
  count?: number;
  style?: string;
  length?: string;
  tone: string;
  styleModifiers: string[];
  customInstructions: string;
  brandVoiceSummary: string;
  language: string;
  voiceProfile?: VoiceProfile;
}): Promise<{ output: string; error?: string }> {
  const { system, maxTokens } = buildFormatPrompt(
    { format: opts.format, count: opts.count, style: opts.style, length: opts.length },
    opts.tone,
    opts.styleModifiers,
    opts.customInstructions,
    opts.brandVoiceSummary,
    opts.language,
    opts.voiceProfile,
  );

  // Extra guidance when the source is a YouTube transcript import.
  const isYouTubeSource =
    /Video source: https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(opts.inputText);
  const systemPrompt = isYouTubeSource
    ? `${system}

YOUTUBE CONTEXT: You are repurposing a YouTube video transcript. The user has provided the transcript (or, when unavailable, the video title and channel). Extract the most valuable insights, key quotes, and actionable points. Create content that feels like it came from someone who actually watched and understood the video deeply. Never mention that you were given a transcript.`
    : system;

  const result = await callClaude({
    systemPrompt,
    userPrompt: opts.inputText,
    maxTokens,
  });


  if (result.error) return { output: "", error: result.error };
  return { output: result.text };
}
