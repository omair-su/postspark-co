/**
 * Local (no-AI) quality signals for a single generated piece: platform length,
 * hook strength, readability and similarity against sibling pieces.
 *
 * Everything here is a cheap heuristic that runs in the browser, so the Studio
 * can show trust signals on every card without an extra model call.
 */
import { limitFor, autoChunk, type Piece, type PublishPlatform } from "@/lib/pieces";

export interface QualitySignals {
  chars: number;
  limit: number;
  overBy: number;
  /** 0-100 fill of the platform character ring. */
  fillPct: number;
  hook: number;        // 0-100
  readability: number; // 0-100 (higher = easier)
  /** 1-based index of the most similar sibling piece, when too similar. */
  similarTo?: number;
  similarity?: number; // 0-100
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with",
  "is", "are", "was", "were", "it", "this", "that", "you", "your", "we", "our",
  "i", "as", "at", "by", "be", "from", "so", "if", "not", "they", "their",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Jaccard overlap of significant words, 0-100. */
export function similarityScore(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => { if (B.has(w)) inter += 1; });
  const union = A.size + B.size - inter;
  return Math.round((inter / union) * 100);
}

/** Hook strength of the first line: specificity, numbers, curiosity, brevity. */
export function hookScore(text: string): number {
  const first = (text.split(/\n/).find((l) => l.trim()) || "").trim();
  if (!first) return 0;
  let score = 34;
  const len = first.length;
  if (len <= 90) score += 16;
  else if (len <= 140) score += 8;
  else score -= 6;
  if (/\d/.test(first)) score += 12;
  if (/\?$/.test(first)) score += 8;
  if (/^(how|why|what|the truth|stop|most|nobody|everyone|i |we )/i.test(first)) score += 10;
  if (/[:—-]/.test(first)) score += 5;
  if (/\b(unlock|leverage|game[- ]changer|delve|in today's world|revolutionize)\b/i.test(first)) score -= 14;
  if (/^(here (is|are)|in this post|let's talk about)/i.test(first)) score -= 10;
  return Math.max(0, Math.min(100, score));
}

/** Simplified Flesch reading ease, clamped to 0-100. */
export function readabilityScore(text: string): number {
  const clean = text.replace(/https?:\/\/\S+/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const sentences = clean.split(/[.!?\n]+/).filter((s) => s.trim().length > 1);
  if (!words.length || !sentences.length) return 0;
  const syllables = words.reduce((sum, w) => {
    const m = w.toLowerCase().replace(/[^a-z]/g, "").match(/[aeiouy]+/g);
    return sum + Math.max(1, m ? m.length : 1);
  }, 0);
  const ease =
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.max(0, Math.min(100, Math.round(ease)));
}

export function analyzePiece(piece: Piece, siblings: Piece[]): QualitySignals {
  const limit = limitFor(piece.platform as PublishPlatform);
  const chars = piece.text.length;
  const signals: QualitySignals = {
    chars,
    limit,
    overBy: Math.max(0, chars - limit),
    fillPct: Math.min(100, Math.round((chars / limit) * 100)),
    hook: hookScore(piece.text),
    readability: readabilityScore(piece.text),
  };

  if (!piece.document) {
    let best = 0;
    let bestIndex = 0;
    siblings.forEach((s) => {
      if (s.id === piece.id) return;
      const score = similarityScore(piece.text, s.text);
      if (score > best) { best = score; bestIndex = s.index; }
    });
    if (best >= 55) {
      signals.similarity = best;
      signals.similarTo = bestIndex;
    }
  }
  return signals;
}

/**
 * Auto-fix an over-limit piece locally.
 * X/Twitter turns into a native numbered thread; every other platform is
 * tightened to the limit at a sentence boundary.
 */
export function autoFixPiece(piece: Piece): { text: string; chain?: string[]; note: string } | null {
  const limit = limitFor(piece.platform as PublishPlatform);
  if (piece.text.length <= limit) return null;

  const chunks = autoChunk(piece.text, limit);
  if (piece.platform === "twitter") {
    return {
      text: chunks[0] ?? piece.text.slice(0, limit),
      chain: chunks,
      note: `Split into a ${chunks.length}-tweet thread`,
    };
  }

  const sentences = piece.text.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out ? out.length + 1 : 0) + s.length > limit) break;
    out = out ? `${out} ${s}` : s;
  }
  if (!out) out = piece.text.slice(0, limit - 1).replace(/\s+\S*$/, "");
  return { text: out.trim(), note: `Tightened to ${limit} characters` };
}
