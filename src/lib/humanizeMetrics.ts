/**
 * PostSpark AI-likelihood estimator.
 *
 * Pure, dependency-free, safe to import from both client and server.
 * Nothing here calls a third-party detector — this is an HONEST heuristic
 * estimate built from the same statistical signals real detectors lean on
 * (burstiness, perplexity proxies, lexical fingerprints, rhythm, readability).
 * Always label output as "estimated" in the UI.
 */

/* ------------------------------------------------------------------ */
/* Tokenisation                                                        */
/* ------------------------------------------------------------------ */

export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  // Protect common abbreviations and decimals from the splitter.
  const protectedText = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|Inc|Ltd|Co|Fig|No)\./gi, "$1<%DOT%>")
    .replace(/(\d)\.(\d)/g, "$1<%DOT%>$2");

  const parts = protectedText
    .split(/(?<=[.!?…])[\s\n]+|\n{2,}/)
    .map((s) => s.replace(/<%DOT%>/g, ".").trim())
    .filter((s) => s.length > 0);

  return parts;
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9'’\-]+/g) || []) as string[];
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const cleaned = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  return Math.max(1, (cleaned.match(/[aeiouy]{1,2}/g) || []).length);
}

/* ------------------------------------------------------------------ */
/* AI fingerprint library                                              */
/* ------------------------------------------------------------------ */

export interface FingerprintHit {
  pattern: string;
  label: string;
  category: "opener" | "transition" | "corporate" | "hedge" | "structure" | "filler" | "punctuation";
  count: number;
}

interface Fp {
  re: RegExp;
  label: string;
  category: FingerprintHit["category"];
  weight: number;
}

const FINGERPRINTS: Fp[] = [
  // Openers / framing clichés
  { re: /\bin today'?s (?:fast[- ]paced|digital|modern|competitive|ever[- ]changing)\b/gi, label: "“In today’s … world”", category: "opener", weight: 3 },
  { re: /\bin the (?:ever[- ]evolving|rapidly changing|world) (?:landscape|world) of\b/gi, label: "“ever-evolving landscape”", category: "opener", weight: 3 },
  { re: /\bin the (?:realm|world|landscape|sphere) of\b/gi, label: "“in the realm of”", category: "opener", weight: 2 },
  { re: /\bwhen it comes to\b/gi, label: "“when it comes to”", category: "opener", weight: 1.5 },
  { re: /\bat the end of the day\b/gi, label: "“at the end of the day”", category: "opener", weight: 1.5 },
  { re: /\blet'?s (?:dive|delve) (?:in|into)\b/gi, label: "“let’s dive in”", category: "opener", weight: 2.5 },
  { re: /\b(?:dive|delve) deep(?:er)? into\b/gi, label: "“delve deeper into”", category: "opener", weight: 2.5 },
  { re: /\bunlock(?:ing)? the (?:power|potential|secrets)\b/gi, label: "“unlock the potential”", category: "opener", weight: 3 },
  { re: /\bin conclusion\b/gi, label: "“in conclusion”", category: "structure", weight: 2 },
  { re: /\bto sum(?: it)? up\b/gi, label: "“to sum up”", category: "structure", weight: 1.5 },

  // Transitions
  { re: /\bfurthermore\b/gi, label: "“furthermore”", category: "transition", weight: 2 },
  { re: /\bmoreover\b/gi, label: "“moreover”", category: "transition", weight: 2 },
  { re: /\badditionally\b/gi, label: "“additionally”", category: "transition", weight: 1.5 },
  { re: /\bconsequently\b/gi, label: "“consequently”", category: "transition", weight: 1.5 },
  { re: /\bnevertheless\b/gi, label: "“nevertheless”", category: "transition", weight: 1.5 },
  { re: /\bnotably\b/gi, label: "“notably”", category: "transition", weight: 1 },
  { re: /\bthus\b/gi, label: "“thus”", category: "transition", weight: 1 },
  { re: /\bhence\b/gi, label: "“hence”", category: "transition", weight: 1 },
  { re: /\bin essence\b/gi, label: "“in essence”", category: "transition", weight: 1.5 },
  { re: /\bultimately\b/gi, label: "“ultimately”", category: "transition", weight: 1 },

  // Corporate / LLM vocabulary
  { re: /\butiliz(?:e|es|ed|ing|ation)\b/gi, label: "“utilize”", category: "corporate", weight: 2.5 },
  { re: /\bleverag(?:e|es|ed|ing)\b/gi, label: "“leverage”", category: "corporate", weight: 2.5 },
  { re: /\brobust\b/gi, label: "“robust”", category: "corporate", weight: 2 },
  { re: /\bseamless(?:ly)?\b/gi, label: "“seamless”", category: "corporate", weight: 2.5 },
  { re: /\bcutting[- ]edge\b/gi, label: "“cutting-edge”", category: "corporate", weight: 2.5 },
  { re: /\bstate[- ]of[- ]the[- ]art\b/gi, label: "“state-of-the-art”", category: "corporate", weight: 2.5 },
  { re: /\bgame[- ]chang(?:er|ing)\b/gi, label: "“game-changer”", category: "corporate", weight: 2 },
  { re: /\bharness(?:ing)?\b/gi, label: "“harness”", category: "corporate", weight: 2 },
  { re: /\bfoster(?:ing)?\b/gi, label: "“foster”", category: "corporate", weight: 1.5 },
  { re: /\bstreamlin(?:e|es|ed|ing)\b/gi, label: "“streamline”", category: "corporate", weight: 2 },
  { re: /\bempower(?:ing|ment)?\b/gi, label: "“empower”", category: "corporate", weight: 1.5 },
  { re: /\bholistic\b/gi, label: "“holistic”", category: "corporate", weight: 1.5 },
  { re: /\bsynerg(?:y|ies|istic)\b/gi, label: "“synergy”", category: "corporate", weight: 2 },
  { re: /\bparadigm\b/gi, label: "“paradigm”", category: "corporate", weight: 2 },
  { re: /\bmyriad\b/gi, label: "“myriad”", category: "corporate", weight: 2 },
  { re: /\bplethora\b/gi, label: "“plethora”", category: "corporate", weight: 2.5 },
  { re: /\btapestry\b/gi, label: "“tapestry”", category: "corporate", weight: 3 },
  { re: /\bnavigat(?:e|ing) the\b/gi, label: "“navigating the …”", category: "corporate", weight: 2 },
  { re: /\btestament to\b/gi, label: "“a testament to”", category: "corporate", weight: 2.5 },
  { re: /\bpivotal\b/gi, label: "“pivotal”", category: "corporate", weight: 1.5 },
  { re: /\bmeticulous(?:ly)?\b/gi, label: "“meticulously”", category: "corporate", weight: 2 },
  { re: /\bcrucial\b/gi, label: "“crucial”", category: "corporate", weight: 1 },
  { re: /\bvibrant\b/gi, label: "“vibrant”", category: "corporate", weight: 1 },
  { re: /\bunwavering\b/gi, label: "“unwavering”", category: "corporate", weight: 2 },
  { re: /\bever[- ]growing\b/gi, label: "“ever-growing”", category: "corporate", weight: 2 },
  { re: /\bunparalleled\b/gi, label: "“unparalleled”", category: "corporate", weight: 2 },
  { re: /\btransformative\b/gi, label: "“transformative”", category: "corporate", weight: 1.5 },
  { re: /\bactionable insights?\b/gi, label: "“actionable insights”", category: "corporate", weight: 2 },
  { re: /\bbest practices\b/gi, label: "“best practices”", category: "corporate", weight: 1 },
  { re: /\bkey takeaways?\b/gi, label: "“key takeaways”", category: "structure", weight: 1.5 },
  { re: /\bdeep dive\b/gi, label: "“deep dive”", category: "corporate", weight: 1.5 },

  // Hedges / disclaimers
  { re: /\bit(?:'| i)s (?:important|worth|crucial|essential) to (?:note|mention|remember|understand)\b/gi, label: "“it’s important to note”", category: "hedge", weight: 3 },
  { re: /\bit should be noted\b/gi, label: "“it should be noted”", category: "hedge", weight: 2.5 },
  { re: /\bwhile .{0,40}, it(?:'| i)s\b/gi, label: "hedged “while … it’s”", category: "hedge", weight: 1 },
  { re: /\bas an AI\b/gi, label: "“as an AI”", category: "hedge", weight: 5 },
  { re: /\bin summary\b/gi, label: "“in summary”", category: "structure", weight: 2 },
  { re: /\boverall,/gi, label: "“Overall,”", category: "structure", weight: 1 },

  // Structural tells
  { re: /\bnot only .{0,60}? but(?: also)?\b/gi, label: "“not only … but also”", category: "structure", weight: 2.5 },
  { re: /\bit(?:'| i)s not (?:just |only )?.{0,40}?[,;] it(?:'| i)s\b/gi, label: "“it’s not X, it’s Y”", category: "structure", weight: 3 },
  { re: /\bwhether you(?:'| a)re .{0,40}? or\b/gi, label: "“whether you’re … or”", category: "structure", weight: 2.5 },
  { re: /\bfrom .{0,30}? to .{0,30}?,/gi, label: "“from X to Y,” framing", category: "structure", weight: 1.5 },
  { re: /\bthink of it as\b/gi, label: "“think of it as”", category: "structure", weight: 1 },
  { re: /\bthe (?:truth|reality|bottom line) is\b/gi, label: "“the bottom line is”", category: "structure", weight: 1 },

  // Filler intensifiers
  { re: /\bvery\b/gi, label: "“very”", category: "filler", weight: 0.6 },
  { re: /\breally\b/gi, label: "“really”", category: "filler", weight: 0.5 },
  { re: /\bbasically\b/gi, label: "“basically”", category: "filler", weight: 0.8 },
  { re: /\bessentially\b/gi, label: "“essentially”", category: "filler", weight: 0.8 },
  { re: /\bsimply put\b/gi, label: "“simply put”", category: "filler", weight: 1 },
  { re: /\bsignificantly\b/gi, label: "“significantly”", category: "filler", weight: 0.8 },
  { re: /\bincredibly\b/gi, label: "“incredibly”", category: "filler", weight: 0.8 },

  // Punctuation habits
  { re: /—/g, label: "em-dash", category: "punctuation", weight: 0.9 },
  { re: /\b(?:—|--)\s?(?:and|but|which)\b/g, label: "em-dash pivot", category: "punctuation", weight: 1 },
  { re: /:\s*\n\s*[-*•]/g, label: "colon → bullet list", category: "punctuation", weight: 0.6 },
];

export function findFingerprints(text: string): FingerprintHit[] {
  const hits: FingerprintHit[] = [];
  for (const fp of FINGERPRINTS) {
    const m = text.match(fp.re);
    if (m && m.length) {
      hits.push({ pattern: fp.label, label: fp.label, category: fp.category, count: m.length });
    }
  }
  return hits.sort((a, b) => b.count - a.count);
}

function fingerprintWeight(text: string): number {
  let total = 0;
  for (const fp of FINGERPRINTS) {
    const m = text.match(fp.re);
    if (m) total += m.length * fp.weight;
  }
  return total;
}

/* ------------------------------------------------------------------ */
/* Signals                                                             */
/* ------------------------------------------------------------------ */

export interface HumanizeSignals {
  /** Sentence-length standard deviation. Human prose ≈ 6–14. */
  burstiness: number;
  /** Coefficient of variation of sentence length. Human ≈ 0.45–0.8. */
  burstinessCv: number;
  /** Lexical variety (type/token ratio, capped window). */
  lexicalDiversity: number;
  /** Repeated-bigram rate — high means mechanical phrasing. */
  bigramRepetition: number;
  /** Weighted AI fingerprint density per 100 words. */
  fingerprintDensity: number;
  /** Share of sentences opening with the same first word/POS shape. */
  uniformOpeners: number;
  /** Passive-voice sentence ratio. */
  passiveRatio: number;
  /** Paragraph-length standard deviation (in sentences). */
  paragraphVariance: number;
  /** Flesch reading ease (0–100, higher = easier). */
  readingEase: number;
  /** US grade level. */
  gradeLevel: number;
  /** Contractions per 100 words. */
  contractionRate: number;
  /** Share of sentences shorter than 8 words (punch). */
  shortSentenceRatio: number;
}

export interface SubScore {
  key: string;
  label: string;
  /** 0–100, higher = more human. */
  score: number;
  detail: string;
}

export interface HumanizeAnalysis {
  /** Estimated likelihood (0–100) a detector flags this as AI. Lower is better. */
  aiLikelihood: number;
  /** 100 - aiLikelihood, the number we show as "human feel". */
  humanScore: number;
  verdict: string;
  signals: HumanizeSignals;
  subScores: SubScore[];
  fingerprints: FingerprintHit[];
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
}

const PASSIVE_RE = /\b(?:is|are|was|were|be|been|being|get|gets|got)\s+(?:\w+ly\s+)?\w+(?:ed|en|wn|ne)\b/i;

export function computeSignals(text: string): HumanizeSignals {
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);
  const allWords = words(text);
  const wc = allWords.length || 1;

  const lens = sentences.map((s) => words(s).length).filter((n) => n > 0);
  const mean = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const variance = lens.length
    ? lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length
    : 0;
  const sd = Math.sqrt(variance);

  // Lexical diversity over a moving 200-word window (length-independent).
  const window = allWords.slice(0, 400);
  const lexicalDiversity = window.length ? new Set(window).size / window.length : 0;

  // Bigram repetition
  const bigrams = new Map<string, number>();
  for (let i = 0; i < allWords.length - 1; i++) {
    const k = `${allWords[i]} ${allWords[i + 1]}`;
    bigrams.set(k, (bigrams.get(k) || 0) + 1);
  }
  let repeated = 0;
  for (const n of bigrams.values()) if (n > 1) repeated += n - 1;
  const bigramRepetition = allWords.length > 1 ? repeated / (allWords.length - 1) : 0;

  // Uniform openers: same first word across sentences
  const openers = new Map<string, number>();
  for (const s of sentences) {
    const first = (words(s)[0] || "").slice(0, 12);
    if (first) openers.set(first, (openers.get(first) || 0) + 1);
  }
  let dupOpeners = 0;
  for (const n of openers.values()) if (n > 1) dupOpeners += n - 1;
  const uniformOpeners = sentences.length ? dupOpeners / sentences.length : 0;

  const passiveCount = sentences.filter((s) => PASSIVE_RE.test(s)).length;
  const passiveRatio = sentences.length ? passiveCount / sentences.length : 0;

  const paraLens = paragraphs.map((p) => splitSentences(p).length);
  const pMean = paraLens.length ? paraLens.reduce((a, b) => a + b, 0) / paraLens.length : 0;
  const paragraphVariance = paraLens.length
    ? Math.sqrt(paraLens.reduce((a, b) => a + (b - pMean) ** 2, 0) / paraLens.length)
    : 0;

  const syl = allWords.reduce((a, w) => a + syllables(w), 0);
  const spw = syl / wc;
  const wps = mean || wc;
  const readingEase = Math.max(0, Math.min(100, 206.835 - 1.015 * wps - 84.6 * spw));
  const gradeLevel = Math.max(1, 0.39 * wps + 11.8 * spw - 15.59);

  const contractions = (text.match(/\b\w+['’](?:s|t|re|ve|ll|d|m)\b/gi) || []).length;
  const contractionRate = (contractions / wc) * 100;

  const shortSentenceRatio = lens.length ? lens.filter((n) => n < 8).length / lens.length : 0;

  return {
    burstiness: round(sd, 2),
    burstinessCv: round(mean ? sd / mean : 0, 3),
    lexicalDiversity: round(lexicalDiversity, 3),
    bigramRepetition: round(bigramRepetition, 4),
    fingerprintDensity: round((fingerprintWeight(text) / wc) * 100, 2),
    uniformOpeners: round(uniformOpeners, 3),
    passiveRatio: round(passiveRatio, 3),
    paragraphVariance: round(paragraphVariance, 2),
    readingEase: round(readingEase, 1),
    gradeLevel: round(gradeLevel, 1),
    contractionRate: round(contractionRate, 2),
    shortSentenceRatio: round(shortSentenceRatio, 3),
  };
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Map a value onto 0–100 where `ideal` scores 100 and `worst` scores 0. */
function band(value: number, worst: number, ideal: number): number {
  if (worst === ideal) return 50;
  const t = (value - worst) / (ideal - worst);
  return Math.max(0, Math.min(100, t * 100));
}

/** Plateau scoring: full marks inside [lo, hi], falling off outside. */
function plateau(value: number, lo: number, hi: number, floorLo: number, floorHi: number): number {
  if (value >= lo && value <= hi) return 100;
  if (value < lo) return band(value, floorLo, lo);
  return band(value, floorHi, hi);
}

export function analyzeText(text: string): HumanizeAnalysis {
  const signals = computeSignals(text);
  const sentences = splitSentences(text);
  const wc = words(text).length;

  const subScores: SubScore[] = [
    {
      key: "burstiness",
      label: "Burstiness",
      score: plateau(signals.burstiness, 6, 16, 0, 30),
      detail: `Sentence-length spread ${signals.burstiness} (human prose sits near 6–16)`,
    },
    {
      key: "perplexity",
      label: "Word unpredictability",
      score: Math.round(
        0.6 * plateau(signals.lexicalDiversity, 0.45, 0.85, 0.2, 1) +
          0.4 * band(signals.bigramRepetition, 0.12, 0.01),
      ),
      detail: `Lexical variety ${(signals.lexicalDiversity * 100).toFixed(0)}%, repeated phrasing ${(signals.bigramRepetition * 100).toFixed(1)}%`,
    },
    {
      key: "fingerprints",
      label: "AI fingerprints",
      score: band(signals.fingerprintDensity, 6, 0),
      detail: `${signals.fingerprintDensity} weighted tells per 100 words`,
    },
    {
      key: "rhythm",
      label: "Rhythm & structure",
      score: Math.round(
        0.4 * band(signals.uniformOpeners, 0.5, 0.05) +
          0.3 * band(signals.passiveRatio, 0.55, 0.1) +
          0.3 * plateau(signals.paragraphVariance, 0.6, 3, 0, 8),
      ),
      detail: `${Math.round(signals.uniformOpeners * 100)}% repeated openers, ${Math.round(signals.passiveRatio * 100)}% passive`,
    },
    {
      key: "readability",
      label: "Readability",
      score: plateau(signals.readingEase, 50, 80, 10, 100),
      detail: `Flesch ${signals.readingEase} · grade ${signals.gradeLevel}`,
    },
    {
      key: "voice",
      label: "Human voice cues",
      score: Math.round(
        0.5 * plateau(signals.contractionRate, 1, 6, 0, 14) +
          0.5 * plateau(signals.shortSentenceRatio, 0.12, 0.45, 0, 0.85),
      ),
      detail: `${signals.contractionRate} contractions/100 words, ${Math.round(signals.shortSentenceRatio * 100)}% punchy lines`,
    },
  ].map((s) => ({ ...s, score: Math.round(s.score) }));

  const WEIGHTS: Record<string, number> = {
    burstiness: 0.22,
    perplexity: 0.2,
    fingerprints: 0.26,
    rhythm: 0.16,
    readability: 0.08,
    voice: 0.08,
  };
  let human = 0;
  for (const s of subScores) human += s.score * (WEIGHTS[s.key] ?? 0);

  // Very short samples are statistically unreliable — pull toward the middle.
  const confidence = Math.min(1, wc / 120);
  const humanScore = Math.round(human * confidence + 50 * (1 - confidence));
  const aiLikelihood = 100 - humanScore;

  return {
    aiLikelihood,
    humanScore,
    verdict: verdictFor(aiLikelihood, wc),
    signals,
    subScores,
    fingerprints: findFingerprints(text),
    wordCount: wc,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length ? round(wc / sentences.length, 1) : 0,
  };
}

function verdictFor(ai: number, wc: number): string {
  if (wc < 40) return "Sample too short for a reliable estimate — paste 60+ words.";
  if (ai >= 75) return "Reads strongly machine-written. Detectors will very likely flag this.";
  if (ai >= 55) return "Leans machine-written. Several statistical tells remain.";
  if (ai >= 35) return "Mixed signals. Some passages still read mechanical.";
  if (ai >= 18) return "Reads human. Rhythm and word choice look natural.";
  return "Reads convincingly human across every signal we measure.";
}

/* ------------------------------------------------------------------ */
/* Meaning integrity                                                   */
/* ------------------------------------------------------------------ */

export interface MeaningCheck {
  preserved: boolean;
  /** 0–100 share of extracted facts still present. */
  score: number;
  missing: string[];
  added: string[];
  checked: number;
}

const STOP_CAPS = new Set([
  "The", "A", "An", "This", "That", "These", "Those", "It", "In", "On", "But", "And", "Or",
  "If", "When", "While", "For", "So", "Then", "There", "Here", "You", "We", "They", "He",
  "She", "I", "As", "At", "By", "To", "Of", "With", "From", "Not", "No", "Yes", "Our", "Your",
  "Its", "His", "Her", "Their", "My", "Me", "Us", "Because", "After", "Before", "How", "Why",
  "What", "Who", "Which", "Every", "Each", "Most", "More", "Less", "One", "Two", "Three",
]);

function extractFacts(text: string): string[] {
  const out = new Set<string>();
  // numbers, percentages, currency, years
  for (const m of text.match(/\$?\d[\d,.]*\s?(?:%|percent|k|m|bn|billion|million|thousand)?/gi) || []) {
    const t = m.trim();
    if (t.replace(/[^\d]/g, "").length) out.add(t.toLowerCase().replace(/\s+/g, " "));
  }
  // URLs & emails
  for (const m of text.match(/https?:\/\/\S+|\b[\w.+-]+@[\w-]+\.[\w.]+\b/gi) || []) out.add(m.toLowerCase());
  // Proper nouns (skip sentence-initial common words)
  for (const m of text.match(/\b[A-Z][a-zA-Z0-9&.'’-]{2,}\b/g) || []) {
    if (!STOP_CAPS.has(m)) out.add(m.toLowerCase());
  }
  return [...out];
}

/** Normalised comparison so "12,000" vs "12000" and casing don't false-flag. */
function norm(s: string): string {
  return s.replace(/[,\s]/g, "").replace(/[.'’-]+$/, "").toLowerCase();
}

export function checkMeaning(input: string, output: string): MeaningCheck {
  const inFacts = extractFacts(input);
  const outFacts = extractFacts(output);
  const outNorm = new Set(outFacts.map(norm));
  const inNorm = new Set(inFacts.map(norm));

  const missing = inFacts.filter((f) => !outNorm.has(norm(f)));
  const added = outFacts.filter((f) => !inNorm.has(norm(f)));

  const checked = inFacts.length;
  const score = checked ? Math.round(((checked - missing.length) / checked) * 100) : 100;

  return {
    preserved: missing.length === 0,
    score,
    missing: missing.slice(0, 12),
    added: added.slice(0, 12),
    checked,
  };
}

/* ------------------------------------------------------------------ */
/* Sentence diff                                                       */
/* ------------------------------------------------------------------ */

export interface SentenceDiff {
  index: number;
  original: string;
  rewritten: string;
  changed: boolean;
  /** 0–1 similarity between the two. */
  similarity: number;
}

function bigramSet(s: string): Set<string> {
  const w = words(s);
  const set = new Set<string>();
  for (let i = 0; i < w.length - 1; i++) set.add(`${w[i]} ${w[i + 1]}`);
  if (!set.size && w.length) set.add(w[0]);
  return set;
}

export function similarity(a: string, b: string): number {
  const A = bigramSet(a);
  const B = bigramSet(b);
  if (!A.size && !B.size) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size || 1);
}

/**
 * Greedy alignment of original → rewritten sentences.
 * Handles splits/merges by looking ahead a small window.
 */
export function alignSentences(input: string, output: string): SentenceDiff[] {
  const src = splitSentences(input);
  const dst = splitSentences(output);
  const rows: SentenceDiff[] = [];
  let j = 0;

  for (let i = 0; i < src.length; i++) {
    const remainingSrc = src.length - i;
    const remainingDst = dst.length - j;
    let best = -1;
    let bestScore = -1;
    const lookahead = Math.min(dst.length, j + Math.max(1, Math.ceil(remainingDst / Math.max(1, remainingSrc)) + 1));

    for (let k = j; k < lookahead; k++) {
      const sc = similarity(src[i], dst[k]);
      if (sc > bestScore) {
        bestScore = sc;
        best = k;
      }
    }

    // Merge any skipped destination sentences into this row (a split).
    let rewritten = "";
    if (best >= 0) {
      rewritten = dst.slice(j, best + 1).join(" ");
      j = best + 1;
    }
    const sim = rewritten ? similarity(src[i], rewritten) : 0;
    rows.push({
      index: i,
      original: src[i],
      rewritten,
      changed: rewritten.trim() !== src[i].trim(),
      similarity: round(sim, 3),
    });
  }

  // Anything left over gets appended to the last row.
  if (j < dst.length && rows.length) {
    const tail = dst.slice(j).join(" ");
    const last = rows[rows.length - 1];
    last.rewritten = `${last.rewritten} ${tail}`.trim();
    last.changed = last.rewritten.trim() !== last.original.trim();
  }

  return rows;
}

/** Assemble final text from per-sentence accept/revert decisions. */
export function assembleFromDiff(rows: SentenceDiff[], accepted: Record<number, boolean>): string {
  return rows
    .map((r) => (accepted[r.index] === false ? r.original : r.rewritten || r.original))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Long-form chunking                                                  */
/* ------------------------------------------------------------------ */

export interface Chunk {
  index: number;
  text: string;
  wordCount: number;
}

/**
 * Split on paragraph boundaries into ~targetWords chunks.
 * Paragraphs longer than the target are split on sentence boundaries.
 */
export function chunkForHumanize(text: string, targetWords = 1200): Chunk[] {
  const paras = splitParagraphs(text);
  const units: string[] = [];

  for (const p of paras.length ? paras : [text]) {
    if (words(p).length <= targetWords) {
      units.push(p);
      continue;
    }
    let buf: string[] = [];
    let n = 0;
    for (const s of splitSentences(p)) {
      const sw = words(s).length;
      if (n + sw > targetWords && buf.length) {
        units.push(buf.join(" "));
        buf = [];
        n = 0;
      }
      buf.push(s);
      n += sw;
    }
    if (buf.length) units.push(buf.join(" "));
  }

  const chunks: Chunk[] = [];
  let buf: string[] = [];
  let n = 0;
  for (const u of units) {
    const uw = words(u).length;
    if (n + uw > targetWords && buf.length) {
      chunks.push({ index: chunks.length, text: buf.join("\n\n"), wordCount: n });
      buf = [];
      n = 0;
    }
    buf.push(u);
    n += uw;
  }
  if (buf.length) chunks.push({ index: chunks.length, text: buf.join("\n\n"), wordCount: n });
  return chunks;
}

export function countWords(text: string): number {
  return words(text).length;
}
