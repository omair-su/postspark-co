/**
 * Multi-pass humanization engine.
 * Server-only — never import from client code.
 *
 * Pipeline: analyze (tool call) → rewrite (targeted prompt) → critique & repair.
 * Scoring/meaning checks come from the pure `humanizeMetrics` module so the
 * client and server always agree on the numbers.
 */

import { callClaude, callClaudeWithTool } from "./anthropic.server";
import {
  analyzeText,
  checkMeaning,
  countWords,
  type HumanizeAnalysis,
  type MeaningCheck,
} from "./humanizeMetrics";

export type Intensity = "light" | "medium" | "strong";

export interface HumanizeSettings {
  intensity: Intensity;
  purpose?: string;
  style?: string;
  preserve?: string[];
  brandVoice?: string;
  brandContext?: string;
  /** Skip the critique/repair pass (used for long-form chunks after the first). */
  skipCritique?: boolean;
}

export interface StageAnalysis {
  tells: string[];
  register: string;
  riskySentences: string[];
  guidance: string;
}

export interface HumanizeResult {
  output: string;
  error?: string;
  before?: HumanizeAnalysis;
  after?: HumanizeAnalysis;
  meaning?: MeaningCheck;
  stageAnalysis?: StageAnalysis;
  passes: number;
  repaired: boolean;
}

const INTENSITY_RULES: Record<Intensity, string> = {
  light:
    "LIGHT: touch only the clearest machine tells. Rewrite roughly 20-30% of sentences. Keep the author's existing phrasing wherever it already reads fine.",
  medium:
    "MEDIUM: full rewrite that keeps the register. Change 50-60% of sentences. Vary sentence length aggressively — mix 4-word lines with 22-word lines.",
  strong:
    "STRONG: aggressive rewrite. Change up to 80% of sentences. Push naturalness hard: fragments, asides, direct address, conversational pivots, deliberate imperfection.",
};

const CORE_RULES = `
NEVER change: meaning, facts, statistics, numbers, dates, names, quotes, URLs, product names.
NEVER add information that is not in the source.
NEVER use em-dashes (—). Use commas, parentheses, or two short sentences.
NEVER open with "In today's", "In the ever-evolving", "It is important to note", "Let's dive in".
Avoid: utilize, leverage, robust, seamless, cutting-edge, state-of-the-art, delve, tapestry, testament to, plethora, myriad, furthermore, moreover, in conclusion.
Avoid the "not only X but also Y" and "it's not X, it's Y" constructions.
Do not start consecutive sentences with the same word.
Preserve the original paragraph breaks and any markdown headings, lists, or links exactly where they are.

WRITE LIKE A PERSON:
- Vary sentence length hard. Short punch lines next to longer detailed ones.
- Occasional fragments. Like this one.
- Use contractions where they fit the register.
- Concrete detail beats abstraction.
- Natural connectors: "That's why", "The thing is", "Here's the catch".
- Let some sentences start mid-thought instead of announcing the topic.
`;

function settingsBlock(s: HumanizeSettings): string {
  const preserve = (s.preserve?.length ? s.preserve : ["Original meaning", "Key facts/data"]).join(", ");
  const lines = [
    `PURPOSE: ${s.purpose || "General text"}`,
    `TARGET STYLE: ${s.style || "Conversational"}`,
    `MUST PRESERVE: ${preserve}`,
    INTENSITY_RULES[s.intensity],
  ];
  if (s.brandContext) lines.push(`BRAND CONTEXT: ${s.brandContext}`);
  if (s.brandVoice) lines.push(`BRAND VOICE TO MATCH (this is how the author actually writes):\n${s.brandVoice.slice(0, 1800)}`);
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Stage 1 — analyze                                                   */
/* ------------------------------------------------------------------ */

const ANALYZE_SCHEMA = {
  type: "object",
  properties: {
    tells: {
      type: "array",
      items: { type: "string" },
      description: "Specific machine-writing tells found in this text, quoting the offending phrasing.",
    },
    register: {
      type: "string",
      description: "The register/voice of the source in one short phrase (e.g. 'formal B2B explainer').",
    },
    riskySentences: {
      type: "array",
      items: { type: "string" },
      description: "Up to 8 sentences (verbatim) that read most machine-written.",
    },
    guidance: {
      type: "string",
      description: "3-6 sentences of concrete rewrite guidance specific to this text.",
    },
  },
  required: ["tells", "register", "riskySentences", "guidance"],
} as const;

async function analyzePass(text: string, s: HumanizeSettings): Promise<StageAnalysis | null> {
  const r = await callClaudeWithTool<StageAnalysis>({
    systemPrompt: `You are a forensic writing analyst. You detect machine-written prose by its statistical and lexical fingerprints: uniform sentence length, predictable word choice, corporate vocabulary, hedged framing, mechanical parallel structure, topic-sentence announcements.

Analyse the text the user gives you and report what makes it read machine-written. Be specific and quote the text. Do not rewrite anything.

${settingsBlock(s)}`,
    userPrompt: `Analyse this text:\n"""${text.slice(0, 12000)}"""`,
    toolName: "report_analysis",
    toolDescription: "Report the machine-writing tells found in the text.",
    toolSchema: ANALYZE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 1500,
  });
  if (r.error || !r.data) return null;
  return {
    tells: (r.data.tells || []).slice(0, 20).map(String),
    register: String(r.data.register || ""),
    riskySentences: (r.data.riskySentences || []).slice(0, 10).map(String),
    guidance: String(r.data.guidance || ""),
  };
}

/* ------------------------------------------------------------------ */
/* Stage 2 — rewrite                                                   */
/* ------------------------------------------------------------------ */

async function rewritePass(
  text: string,
  s: HumanizeSettings,
  stage: StageAnalysis | null,
  heuristics: HumanizeAnalysis,
): Promise<{ text: string; error?: string }> {
  const detected = heuristics.fingerprints
    .slice(0, 14)
    .map((f) => `${f.pattern} ×${f.count}`)
    .join(", ");

  const findings = stage
    ? `\nFORENSIC FINDINGS FOR THIS TEXT:\nRegister: ${stage.register}\nTells: ${stage.tells.slice(0, 14).join("; ")}\nHighest-risk sentences:\n${stage.riskySentences.map((x) => `- ${x}`).join("\n")}\nRewrite guidance: ${stage.guidance}\n`
    : "";

  const stats = `\nMEASURED SIGNALS (fix these):\n- Sentence-length spread: ${heuristics.signals.burstiness} (target 6-16 — higher means more human variation)\n- Repeated sentence openers: ${Math.round(heuristics.signals.uniformOpeners * 100)}%\n- Passive voice: ${Math.round(heuristics.signals.passiveRatio * 100)}%\n- Contractions per 100 words: ${heuristics.signals.contractionRate}\n- Detected fingerprints: ${detected || "none"}\n`;

  const system = `You are an elite editor who rewrites machine-written prose so it reads as though a skilled human wrote it in one sitting. You have studied thousands of AI-vs-human writing samples.

${settingsBlock(s)}
${findings}${stats}
${CORE_RULES}

OUTPUT: return ONLY the rewritten text. No preamble, no explanation, no quotes, no notes.`;

  const r = await callClaude({
    systemPrompt: system,
    userPrompt: text,
    maxTokens: Math.min(8000, Math.max(1500, Math.ceil(countWords(text) * 3))),
  });
  if (r.error) return { text: "", error: r.error };
  return { text: cleanOutput(r.text) };
}

/* ------------------------------------------------------------------ */
/* Stage 3 — critique & repair                                         */
/* ------------------------------------------------------------------ */

async function repairPass(
  source: string,
  draft: string,
  s: HumanizeSettings,
  problems: string[],
): Promise<{ text: string; error?: string }> {
  const system = `You are a repair editor. You are given an original text and a humanized draft. The draft has specific measurable problems listed below.

Fix ONLY the listed problems. Leave every sentence that is already fine exactly as it is.

${settingsBlock(s)}

PROBLEMS TO FIX:
${problems.map((p) => `- ${p}`).join("\n")}

${CORE_RULES}

OUTPUT: return ONLY the corrected full text. No preamble, no commentary.`;

  const r = await callClaude({
    systemPrompt: system,
    userPrompt: `ORIGINAL SOURCE (facts must match this exactly):\n"""${source.slice(0, 12000)}"""\n\nDRAFT TO REPAIR:\n"""${draft}"""`,
    maxTokens: Math.min(8000, Math.max(1500, Math.ceil(countWords(draft) * 3))),
  });
  if (r.error) return { text: "", error: r.error };
  return { text: cleanOutput(r.text) };
}

function cleanOutput(text: string): string {
  let t = text.trim();
  // Strip a wrapping code fence or quote block if the model added one.
  t = t.replace(/^```[a-z]*\n([\s\S]*?)\n```$/i, "$1");
  t = t.replace(/^"""([\s\S]*?)"""$/, "$1");
  t = t.replace(/^(?:Here(?:'s| is)[^\n:]{0,60}:)\s*/i, "");
  // House rule: no em-dashes.
  t = t.replace(/\s?—\s?/g, ", ").replace(/,\s*,/g, ",");
  return t.trim();
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export async function humanizeMultiPass(
  text: string,
  settings: HumanizeSettings,
): Promise<HumanizeResult> {
  const before = analyzeText(text);
  let passes = 0;

  // Stage 1 runs in parallel-friendly isolation; a failure is non-fatal.
  const stage = await analyzePass(text, settings);
  if (stage) passes += 1;

  const rewritten = await rewritePass(text, settings, stage, before);
  passes += 1;
  if (rewritten.error || !rewritten.text) {
    return {
      output: "",
      error: rewritten.error || "No content returned.",
      before,
      passes,
      repaired: false,
    };
  }

  let output = rewritten.text;
  let after = analyzeText(output);
  let meaning = checkMeaning(text, output);
  let repaired = false;

  const problems: string[] = [];
  if (!meaning.preserved && meaning.missing.length) {
    problems.push(
      `These facts from the source are missing or altered in the draft and MUST be restored verbatim: ${meaning.missing.join(", ")}`,
    );
  }
  if (after.aiLikelihood > 35 && after.aiLikelihood > before.aiLikelihood - 15) {
    problems.push(
      `The draft still reads machine-written (estimated AI likelihood ${after.aiLikelihood}%). Break up uniform sentence rhythm further and remove remaining stock phrasing.`,
    );
  }
  if (after.signals.burstiness < 5.5) {
    problems.push(
      `Sentence lengths are too uniform (spread ${after.signals.burstiness}). Add several very short sentences and a couple of long ones.`,
    );
  }
  if (after.signals.uniformOpeners > 0.28) {
    problems.push(
      `${Math.round(after.signals.uniformOpeners * 100)}% of sentences reuse the same opening word. Vary sentence openings.`,
    );
  }
  const remaining = after.fingerprints.slice(0, 8).map((f) => f.pattern);
  if (remaining.length) {
    problems.push(`These AI stock phrases are still present: ${remaining.join(", ")}. Replace them with plain wording.`);
  }

  if (problems.length && !settings.skipCritique) {
    const fixed = await repairPass(text, output, settings, problems);
    passes += 1;
    if (!fixed.error && fixed.text) {
      const candidateAfter = analyzeText(fixed.text);
      const candidateMeaning = checkMeaning(text, fixed.text);
      // Only accept the repair when it genuinely improves things.
      const better =
        candidateMeaning.score >= meaning.score &&
        candidateAfter.humanScore >= after.humanScore - 2;
      if (better) {
        output = fixed.text;
        after = candidateAfter;
        meaning = candidateMeaning;
        repaired = true;
      }
    }
  }

  return { output, before, after, meaning, stageAnalysis: stage ?? undefined, passes, repaired };
}

/* ------------------------------------------------------------------ */
/* Single-sentence re-roll                                             */
/* ------------------------------------------------------------------ */

export async function rewriteSingleSentence(opts: {
  sentence: string;
  original: string;
  before: string;
  afterCtx: string;
  settings: HumanizeSettings;
  avoid?: string[];
}): Promise<{ text: string; error?: string }> {
  const system = `You rewrite ONE sentence so it reads human, inside its surrounding context.

${settingsBlock(opts.settings)}

${CORE_RULES}

HARD RULES:
- Return exactly one sentence (or two short ones if the rhythm demands it). Nothing else.
- It must carry the same meaning and facts as the ORIGINAL sentence.
- It must flow from the preceding text and into the following text.
- It must be clearly different from every version listed under AVOID.

OUTPUT: the rewritten sentence only. No quotes, no preamble.`;

  const avoid = opts.avoid?.length
    ? `\nAVOID producing anything close to these:\n${opts.avoid.map((a) => `- ${a}`).join("\n")}\n`
    : "";

  const r = await callClaude({
    systemPrompt: system,
    userPrompt: `PRECEDING TEXT: ...${opts.before.slice(-400)}\n\nORIGINAL SENTENCE (source of truth for meaning): ${opts.original}\n\nCURRENT REWRITE: ${opts.sentence}\n${avoid}\nFOLLOWING TEXT: ${opts.afterCtx.slice(0, 400)}...`,
    maxTokens: 400,
  });
  if (r.error) return { text: "", error: r.error };
  return { text: cleanOutput(r.text).replace(/^["'“]|["'”]$/g, "").trim() };
}
