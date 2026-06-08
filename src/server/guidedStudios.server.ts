/**
 * Shared engine for all four Guided Studios.
 * Each studio assembles a system prompt + user prompt and either returns
 * markdown (default) or a structured JSON via tool-use (hooks, slides).
 */
import { callClaude, callClaudeWithTool } from "./anthropic.server";

export interface StudioGenResult {
  output: string;
  error?: string;
}

interface StudioCallOpts {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function runStudio({ systemPrompt, userPrompt, maxTokens = 4000 }: StudioCallOpts): Promise<StudioGenResult> {
  const r = await callClaude({ systemPrompt, userPrompt, maxTokens });
  if (r.error) return { output: "", error: r.error };
  return { output: r.text };
}

/* ====================== FOUNDER LESSON ====================== */

export interface FounderHook { text: string; style: string; score: number; rationale: string }

const LESSON_TYPE_HINTS: Record<string, string> = {
  failure: "Frame as a failure-and-recovery story. Lead with the painful mistake, show what happened, end with the lesson.",
  win: "Frame as a win + repeatable how-to. Lead with the result, then reveal the steps.",
  contrarian: "Frame as a contrarian take. Lead with the conventional wisdom, then dismantle it.",
  data: "Frame as a data-driven insight. Lead with a number or stat, then explain the mechanism.",
  mindset: "Frame as a mindset shift. Lead with the old belief, then the new one.",
  process: "Frame as a process reveal. Show how the work actually gets done behind the scenes.",
};

const FOUNDER_PLATFORM_INSTR: Record<string, string> = {
  linkedin: "1 LinkedIn post (300-450 words, short paragraphs of 1-2 lines, line breaks for the LinkedIn algorithm, a strong opener, and a single takeaway line at the end). Header: ## LinkedIn Post",
  thread: "1 Twitter/X thread (10-14 numbered tweets, each <270 chars, the first tweet is the hook). Header: ## Twitter/X Thread",
  email: "1 email newsletter (Subject, Preview text, Body in 3 sections, CTA). Header: ## Email Newsletter",
  instagram: "3 Instagram captions (~150 chars each + 10 relevant hashtags each). Header: ## Instagram Captions",
  video: "1 short-video script (Hook in first 3 sec, 60-90 sec body, CTA). Header: ## Short Video Script",
};

export async function generateFounderHooks(
  lesson: string, story: string, audience: string, lessonType: string, hookStyle: string,
  voice = "",
): Promise<{ hooks: FounderHook[]; error?: string }> {
  const voiceBlock = voice.trim() ? `\n\nMatch this brand voice:\n${voice.trim()}` : "";
  const system = `You are a viral content strategist. Generate exactly 3 distinct scroll-stopping opening hooks for a founder's lesson post.
${LESSON_TYPE_HINTS[lessonType] || ""}
Preferred hook style: ${hookStyle}. Each hook ≤ 220 chars, platform-native, no hashtags.
Score each hook from 0-10 on virality potential (curiosity, specificity, emotional pull). Give a 1-line rationale.${voiceBlock}`;
  const user = `Lesson: ${lesson}\n\nStory: ${story}\n\nAudience: ${audience || "founders & operators"}`;
  const r = await callClaudeWithTool<{ hooks: FounderHook[] }>({
    systemPrompt: system, userPrompt: user, toolName: "return_hooks", toolDescription: "Return 3 scored hooks.",
    toolSchema: { type: "object", properties: { hooks: { type: "array", items: { type: "object",
      properties: { text: { type: "string" }, style: { type: "string" }, score: { type: "number" }, rationale: { type: "string" } },
      required: ["text", "style", "score", "rationale"] } } }, required: ["hooks"] },
    maxTokens: 800,
  });
  if (r.error || !r.data) return { hooks: [], error: r.error || "No hooks returned." };
  return { hooks: (r.data.hooks || []).slice(0, 3) };
}

export async function generateFounderLesson(input: {
  lesson: string; story: string; takeaway: string; audience: string; lessonType: string;
  platforms: string[]; tone: string; length: string; selectedHook?: string; voice?: string;
}): Promise<StudioGenResult> {
  const platformInstr = input.platforms.map(p => FOUNDER_PLATFORM_INSTR[p]).filter(Boolean).join("\n- ");
  const lengthHint = input.length === "short" ? "Keep it punchy and tight." : input.length === "long" ? "Go deep, add detail and color." : "Balanced detail.";
  const voiceBlock = input.voice?.trim() ? `\n\nMatch this brand voice EXACTLY:\n${input.voice.trim()}` : "";
  const hookBlock = input.selectedHook ? `\n\nUse this EXACT hook to open every piece: "${input.selectedHook}"` : "";
  const system = `You are PostSpark's Founder Lesson Engine. Write authentic, specific, story-driven founder content that builds trust and authority.
${LESSON_TYPE_HINTS[input.lessonType] || ""}
Tone: ${input.tone}. ${lengthHint}
Generate, with clear markdown headers (## Platform Name) for each:
- ${platformInstr}
Make it human, specific, with concrete numbers/details. No corporate fluff. No hashtags unless platform expects them.${voiceBlock}${hookBlock}`;
  const user = `Lesson: ${input.lesson}\n\nStory: ${input.story}\n\nTakeaway: ${input.takeaway}\n\nAudience: ${input.audience || "founders & operators"}`;
  return runStudio({ systemPrompt: system, userPrompt: user, maxTokens: 4000 });
}

/* ====================== CREATOR PLAYBOOK ====================== */

const PLAYBOOK_FORMATS: Record<string, string> = {
  "step-by-step": "Format as a numbered step-by-step framework. Each step is concrete and actionable.",
  "myth-reality": "Format as 'Myth vs Reality'. For each tip: state the common myth, then the reality.",
  "before-after": "Format as a Before→After transformation. Show the old way, the trigger, and the new way.",
  "framework": "Format as a named framework reveal (give it a memorable acronym or model name).",
  "checklist": "Format as a self-audit checklist with checkboxes.",
  "secrets": "Format as insider 'secrets revealed' — things most people don't know.",
};

const PLAYBOOK_PLATFORM_INSTR: Record<string, string> = {
  carousel: `1 LinkedIn carousel (10 slides). Output as:
## LinkedIn Carousel (10 slides)
Then for EACH slide use this exact format:
### Slide N
Title: <punchy 6-10 word slide title>
Body: <1-3 short lines of body copy>`,
  "ig-carousel": `1 Instagram carousel (8 slides). Same slide format as LinkedIn carousel.
## Instagram Carousel (8 slides)`,
  thread: "1 Twitter/X thread (10-14 numbered tweets). Header: ## Twitter/X Thread",
  linkedin: "1 LinkedIn long-form post (300-500 words, line-broken). Header: ## LinkedIn Post",
  instagram: "3 Instagram caption variations. Header: ## Instagram Captions",
  newsletter: "1 newsletter section (250-350 words with subhead + body + CTA). Header: ## Newsletter Section",
};

export async function generateCreatorPlaybook(input: {
  topic: string; niche: string; steps: string; example: string; format: string;
  platforms: string[]; voice?: string;
}): Promise<StudioGenResult> {
  const platformInstr = input.platforms.map(p => PLAYBOOK_PLATFORM_INSTR[p]).filter(Boolean).join("\n\n");
  const voiceBlock = input.voice?.trim() ? `\n\nMatch this brand voice:\n${input.voice.trim()}` : "";
  const system = `You are PostSpark's Creator Playbook Studio. You turn knowledge into shareable educational content.
${PLAYBOOK_FORMATS[input.format] || PLAYBOOK_FORMATS["step-by-step"]}
Niche: ${input.niche}. Write platform-native, punchy, scroll-stopping content.

Generate the following with clear markdown headers:
${platformInstr}${voiceBlock}`;
  const user = `Playbook topic: ${input.topic}\n\nSteps/tips:\n${input.steps}\n\n${input.example ? `Proof/example: ${input.example}` : ""}`;
  return runStudio({ systemPrompt: system, userPrompt: user, maxTokens: 4500 });
}

/* ====================== PRODUCT LAUNCH ====================== */

const PRODUCT_TYPE_FRAMING: Record<string, string> = {
  physical: "Physical/Shopify product. Focus on transformation, sensory benefits, social proof, urgency.",
  saas: "SaaS/software product. Focus on the workflow before/after, time saved, integration story.",
  digital: "Digital product (course, ebook, template). Focus on the outcome the learner gets.",
  service: "Service/agency offer. Focus on the result, the credibility, and the process.",
  subscription: "Subscription/membership. Focus on the recurring value and community.",
};

const PRODUCT_PLATFORM_INSTR: Record<string, string> = {
  shopify: "1 Shopify product description, SEO-optimized, 200-300 words, with benefit-led copy, paragraphs + 4-6 feature bullets. Header: ## Shopify Product Description",
  amazon: "1 Amazon listing: title (≤200 chars, keyword-front-loaded) + 5 benefit-led bullet points. Header: ## Amazon Listing",
  facebook_ad: `1 Facebook/Instagram ad. Output:
## Facebook/Instagram Ad
Primary text: <1 paragraph, scroll-stopper hook, 80-150 words>
Headline: <≤40 chars>
Description: <≤30 chars>
CTA: <one button label>`,
  tiktok_ad: "1 TikTok ad script (15-30 sec): 3-sec hook, 12-sec body, 5-sec CTA. Format as timestamped lines. Header: ## TikTok Ad Script",
  google_ad: "1 Google Search ad: 3 headlines (≤30 chars each) + 2 descriptions (≤90 chars each). Header: ## Google Search Ad",
  instagram_post: "1 Instagram launch post caption (~180 words) + 10 hashtags. Header: ## Instagram Post",
  tiktok_post: "1 TikTok caption + 8 hashtags + 3 trending hook variations. Header: ## TikTok Post",
  facebook_post: "1 Facebook launch post (~150 words, conversational). Header: ## Facebook Post",
  linkedin_post: "1 LinkedIn launch post (300-450 words). Header: ## LinkedIn Post",
  pinterest: "5 Pinterest pin descriptions (~200 chars each, keyword-rich). Header: ## Pinterest Pins",
  twitter: "1 Twitter/X launch thread (8-12 tweets). Header: ## Twitter/X Launch Thread",
  product_hunt: "1 Product Hunt launch post (title + tagline + first comment intro). Header: ## Product Hunt Launch",
  email_announce: "1 launch announcement email: subject, preview, body (~300 words), CTA. Header: ## Launch Email",
  email_sequence: `3-email launch sequence:
## Email 1 — Teaser (sent T-2 days)
Subject + preview + body
## Email 2 — Launch Day
Subject + preview + body
## Email 3 — Last Chance (sent T+3 days)
Subject + preview + body`,
  abandoned_cart: "1 abandoned cart email. Subject + body + CTA. Header: ## Abandoned Cart Email",
};

export async function generateProductLaunch(input: {
  productType: string; name: string; category?: string; productUrl?: string;
  whatItDoes: string; benefits: string; audience: string; painPoint?: string;
  price?: string; priceTier?: string; socialProof?: string; urgency?: string;
  tone: string; platforms: string[]; voice?: string;
}): Promise<StudioGenResult> {
  const platformInstr = input.platforms.map(p => PRODUCT_PLATFORM_INSTR[p]).filter(Boolean).join("\n\n");
  const voiceBlock = input.voice?.trim() ? `\n\nMatch this brand voice:\n${input.voice.trim()}` : "";
  const system = `You are PostSpark's Product Launch Command Center. You write conversion-grade launch copy across every channel.
${PRODUCT_TYPE_FRAMING[input.productType] || ""}
Tone: ${input.tone}. Always lead with transformation, not features. Handle the customer's #1 objection inside the copy. Include the urgency/social proof when provided. No corporate jargon.

Generate the following with clear markdown headers:
${platformInstr}${voiceBlock}`;
  const user = [
    `Product: ${input.name}`,
    input.category ? `Category: ${input.category}` : "",
    input.productUrl ? `Reference URL: ${input.productUrl}` : "",
    `What it does: ${input.whatItDoes}`,
    `Key benefits:\n${input.benefits}`,
    `Target audience: ${input.audience}`,
    input.painPoint ? `Customer #1 pain: ${input.painPoint}` : "",
    input.price ? `Price: ${input.price}${input.priceTier ? ` (${input.priceTier})` : ""}` : "",
    input.socialProof ? `Social proof: ${input.socialProof}` : "",
    input.urgency ? `Urgency/scarcity: ${input.urgency}` : "",
  ].filter(Boolean).join("\n\n");
  return runStudio({ systemPrompt: system, userPrompt: user, maxTokens: 5000 });
}

/* ====================== MARKETING TIP ====================== */

const TIP_ANGLES: Record<string, string> = {
  educational: "Position as educational 'how-to'. Calm authority.",
  contrarian: "Position as contrarian. Challenge a popular assumption.",
  data: "Position as data-driven. Lead with the stat.",
  story: "Position as a personal story — 'I tried this and here's what happened'.",
  warning: "Position as a warning — 'Stop doing X'.",
};

const TIP_PLATFORM_INSTR: Record<string, string> = {
  linkedin: "1 LinkedIn post (300-400 words, line-broken). Header: ## LinkedIn Post",
  thread: "1 Twitter/X thread (8-12 tweets). Header: ## Twitter/X Thread",
  newsletter: "1 newsletter snippet (200-300 words, subhead + body + CTA). Header: ## Newsletter Snippet",
  ig_carousel: `1 Instagram carousel (5 slides). Header: ## Instagram Carousel (5 slides)
### Slide N
Title: ...
Body: ...`,
  video: "1 60-second video script with hook + body + CTA. Header: ## Video Script (60s)",
  cold_email: "1 cold email using this insight as the value lead. Subject + body. Header: ## Cold Email",
};

export async function generateMarketingTip(input: {
  channel: string; insight: string; stat?: string; why: string; howTo: string;
  audience: string; angle: string; platforms: string[]; weekPlan?: boolean; voice?: string;
}): Promise<StudioGenResult> {
  const platformInstr = input.platforms.map(p => TIP_PLATFORM_INSTR[p]).filter(Boolean).join("\n\n");
  const voiceBlock = input.voice?.trim() ? `\n\nMatch this brand voice:\n${input.voice.trim()}` : "";
  const weekBlock = input.weekPlan ? `\n\nAFTER the above, also generate:
## 7-Day Content Plan
Mon: <original insight post idea>
Tue: <deep-dive thread idea>
Wed: <counter-argument idea>
Thu: <case study idea>
Fri: <data recap idea>
Sat: <community question idea>
Sun: <reflection / weekly recap idea>
Each day: 1 line title + 1 line angle.` : "";
  const system = `You are PostSpark's Marketing Insight Engine. You turn one insight into authority content.
Channel: ${input.channel}. Audience: ${input.audience}.
${TIP_ANGLES[input.angle] || TIP_ANGLES.educational}
Cite data naturally when provided. Make the insight feel both surprising and immediately actionable.

Generate the following with clear markdown headers:
${platformInstr}${weekBlock}${voiceBlock}`;
  const user = `Insight: ${input.insight}\n\n${input.stat ? `Stat/source: ${input.stat}\n\n` : ""}Why it works: ${input.why}\n\nHow to apply: ${input.howTo}`;
  return runStudio({ systemPrompt: system, userPrompt: user, maxTokens: 4500 });
}

/* ====================== EDIT WITH AI ====================== */

export async function editStudioOutput(currentContent: string, instruction: string): Promise<StudioGenResult> {
  const system = `You are an expert editor. Rewrite the user's content following the given instruction. Preserve any markdown headers and structure unless the instruction says otherwise. Return only the rewritten content.`;
  const user = `INSTRUCTION: ${instruction}\n\n---CONTENT---\n${currentContent}`;
  return runStudio({ systemPrompt: system, userPrompt: user, maxTokens: 4000 });
}
