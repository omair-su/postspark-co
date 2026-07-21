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
        maxTokens: 2500,
        system: `You are an elite Twitter/X content strategist who writes for top founders and creators. Your tweets get thousands of impressions because they are specific, punchy, and human.

TASK: Extract the ${count} most shareable insights from the source content and write them as standalone tweets.

QUALITY RULES (non-negotiable):
1. Be COMPLETE — never truncate. Each tweet stands alone with full meaning.
2. Be SPECIFIC — use concrete numbers, names, examples. No generic statements.
3. Start with a HOOK — first 5 words must stop the scroll.
4. CONVERSATIONAL — write like a real person, not a bot.
5. Under 240 characters unless completeness requires more.
6. NO filler: "In today's world", "It's important to note", "I wanted to share".
7. NO corporate jargon.
8. Vary structure: mix statements, questions, lists, mini-stories.

STYLE: ${style || "Standalone tweets"}

OUTPUT: Return exactly ${count} tweets, numbered 1, 2, 3... Each is a distinct insight, NOT a variation of the same idea.${suffix}`,
      };

    case "linkedin":
      return {
        maxTokens: 3500,
        system: `You are a LinkedIn content expert writing for founders and execs with 10K–500K followers. Your posts consistently earn 500+ reactions.

TASK: Write ${count} LinkedIn post${count > 1 ? "s" : ""} from the source.

LINKEDIN FORMAT RULES:
1. First line is EVERYTHING — must be so compelling readers click "see more".
2. SHORT paragraphs — 1-2 lines max per paragraph.
3. Strategic line breaks (algorithm rewards this).
4. Length: 150-800 words (300-600 is the sweet spot).
5. End with ONE clear CTA or thought-provoking question.
6. NO "I wanted to share...", NO "In today's fast-paced world".
7. First person, direct voice.
8. White space is a feature, not a bug.

STRUCTURE — pick the strongest:
A) Hook → Story → Lesson → CTA
B) Contrarian Statement → Why → Evidence → Takeaway
C) "X things I learned…" numbered insights

STYLE: ${style || "Long-form story"}

OUTPUT: ${count} complete LinkedIn post${count > 1 ? "s" : ""}, clearly separated with "---". No truncation. Each self-contained, fully developed.${suffix}`,
      };

    case "instagram":
      return {
        maxTokens: 2000,
        system: `You are an Instagram caption strategist for creators with 50K+ followers.

TASK: Write ${count} Instagram caption${count > 1 ? "s" : ""} from the source.

RULES:
1. Each caption ~150-300 chars + 10-15 strategic hashtags at the bottom.
2. Hook in first 125 chars (before "...more" truncation).
3. Conversational, human, scroll-stopping.
4. Mix story-driven and insight-driven captions.

STYLE: ${style || "With hashtags"}

OUTPUT: ${count} numbered captions, hashtags on a separate line per caption.${suffix}`,
      };

    case "facebook":
      return {
        maxTokens: 1800,
        system: `You are a Facebook content writer who creates shareable posts.

TASK: Write ${count} Facebook post${count > 1 ? "s" : ""}.

RULES:
1. Conversational, designed for shares & comments.
2. 100-200 words each.
3. End with a question or invitation to share an experience.

OUTPUT: ${count} numbered posts.${suffix}`,
      };

    case "thread": {
      const tweetCount = cfg.count || 10;
      return {
        maxTokens: 3500,
        system: `You write viral Twitter/X threads.

TASK: Turn the source into ONE thread of exactly ${tweetCount} connected tweets.

THREAD RULES:
1. Tweet 1 = killer hook + promise. Make people NEED to read tweet 2.
2. Each subsequent tweet delivers a single, specific idea.
3. Each tweet under 280 characters.
4. Build narrative momentum — don't repeat ideas.
5. Final tweet = strong CTA or memorable takeaway.

OUTPUT: Numbered 1/${tweetCount}, 2/${tweetCount}, … Each tweet on its own block.${suffix}`,
      };
    }

    case "email":
      return {
        maxTokens: 2500,
        system: `You are an email copywriter whose newsletters get 40%+ open rates.

EMAIL TYPE: ${style || "Newsletter"}

TASK: Transform the source into a complete, compelling email.

STRUCTURE (return all sections):
SUBJECT LINE OPTIONS: (3 options, mark the strongest with ★)
PREVIEW TEXT: (one line complementing subject)
BODY:
- Opening hook (1 paragraph)
- Main content (300-600 words, fully developed)
- Key takeaway
- Clear CTA
- Sign-off

RULES:
1. NEVER truncate. Write the full email.
2. Subject lines: specific, curiosity-driven, under 50 chars.
3. No "I hope this email finds you well".
4. Conversational — one smart friend to another.${suffix}`,
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
        maxTokens: 3000,
        system: `You write high-performing video scripts for YouTube, TikTok, Reels, and LinkedIn Video.

SCRIPT LENGTH: ${lengthLabel} (~${wordTarget})

STRUCTURE (use these exact markers):
[HOOK - 0:00-0:03]
First words must immediately grab attention. State the payoff.

[INTRO - 0:03-0:10]
Establish credibility and what the viewer will get.

[MAIN CONTENT]
Deliver value. Short sentences. Active voice. Add [PAUSE] and [EMPHASIS] markers. Add [B-ROLL: description] notes where visuals help.

[CTA - final 10 seconds]
One clear action.

RULES:
1. Spoken language — how people actually talk.
2. Short sentences. Active voice.
3. Total word count must match: ${wordTarget}.${suffix}`,
      };
    }

    case "tiktok":
      return {
        maxTokens: 2000,
        system: `You write TikTok / Reels scripts that go viral.

TASK: Write ${count} short-form video script${count > 1 ? "s" : ""} (60-90 seconds each).

RULES:
1. Hook in first 3 seconds — must stop the scroll.
2. Pattern interrupts every 5-7 seconds.
3. End with a loop, twist, or CTA.
4. Include [VISUAL] cues throughout.

OUTPUT: ${count} numbered scripts.${suffix}`,
      };

    case "podcast":
      return {
        maxTokens: 2500,
        system: `You write podcast show notes for top business podcasts.

STYLE: ${style || "Show notes + quotes"}

OUTPUT:
- Episode Title (compelling, specific)
- One-paragraph summary
- Key Takeaways (5-7 bullets)
- Pull Quotes (3 quotable lines)
- Chapters & timestamps outline
- Links / Resources mentioned${suffix}`,
      };

    case "seo":
      return {
        maxTokens: 2500,
        system: `You are an SEO content strategist.

OUTPUT TYPE: ${style || "Blog intro"}

DELIVER:
- Suggested H1 title (60 chars max, keyword-rich)
- 3 meta descriptions (under 160 chars each)
- Blog intro paragraph (~150 words, hooks reader, includes primary keyword naturally)
- 5 H2 subheadings outline
- 3 FAQ questions with answers${suffix}`,
      };

    case "carousel": {
      const slides = cfg.count || 8;
      return {
        maxTokens: 2500,
        system: `You design educational LinkedIn / Instagram carousels.

TASK: Create a ${slides}-slide carousel.

RULES per slide:
1. Slide 1 = HOOK (title + subhead, max 12 words combined).
2. Slides 2-${slides - 1} = one idea each, ≤25 words.
3. Last slide = CTA.
4. Each slide self-contained, reads well in isolation.

OUTPUT: Numbered slides:
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
        system: `Repurpose the source content into ${cfg.format}. High quality, complete, platform-native.${suffix}`,
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
}): Promise<{ output: string; error?: string }> {
  const { system, maxTokens } = buildFormatPrompt(
    { format: opts.format, count: opts.count, style: opts.style, length: opts.length },
    opts.tone,
    opts.styleModifiers,
    opts.customInstructions,
    opts.brandVoiceSummary,
    opts.language,
  );

  const result = await callClaude({
    systemPrompt: system,
    userPrompt: opts.inputText,
    maxTokens,
  });

  if (result.error) return { output: "", error: result.error };
  return { output: result.text };
}
