/**
 * Shared "piece" model for Repurpose Studio.
 *
 * A generated format returns ONE text blob. A piece is one publishable post
 * inside that blob. Preview cards and the Publishing Center both read pieces,
 * so a single post can never be mis-split into several cards again.
 */

export const PIECE_DELIMITER = "===PIECE===";

/** sessionStorage key carrying a whole pack to the Publishing Center. */
export const PUBLISH_PACK_KEY = "postspark.publish.pack";

export type PublishPlatform =
  | "twitter"
  | "threads"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "email"
  | "blog";

export const PLATFORM_LIMITS: Record<PublishPlatform, number> = {
  twitter: 280,
  threads: 500,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  youtube: 5000,
  email: 100000,
  blog: 100000,
};

/** Formats that are ALWAYS one single document — never split. */
export const SINGLE_DOC_FORMATS = new Set(["email", "video", "seo", "podcast", "carousel"]);

export const FORMAT_PLATFORM: Record<string, PublishPlatform> = {
  tweets: "twitter",
  thread: "threads",
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  video: "youtube",
  email: "email",
  podcast: "blog",
  seo: "blog",
  carousel: "linkedin",
};

export interface Piece {
  id: string;
  format: string;
  platform: PublishPlatform;
  index: number;
  total: number;
  text: string;
  /** Threads chain / long tweet thread: the connected sub-posts, if any. */
  chain?: string[];
  /** True when this piece is a document (email, script, notes) not a social post. */
  document: boolean;
}

function cleanBlock(s: string): string {
  return s
    .replace(/^\s*(?:\*\*)?(?:tweet|post|caption|slide|script)\s*#?\d{1,2}(?:\*\*)?\s*[:.)-]\s*/i, "")
    .replace(/^\s*\d{1,2}\s*\/\s*\d{1,2}\s*[:.)-]?\s*/, "")
    .replace(/^\s*\d{1,2}\s*[.)]\s*/, "")
    .trim();
}

/** Fallback segmentation for legacy packs generated before the delimiter existed. */
function legacySplit(format: string, content: string): string[] {
  const text = content.trim();
  if (!text) return [];
  if (SINGLE_DOC_FORMATS.has(format)) return [text];

  if (format === "linkedin") {
    const parts = text
      .split(/^\s*-{3,}\s*$/m)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : [text];
  }

  if (format === "thread") {
    // One connected chain → one piece; sub-posts extracted separately.
    return [text];
  }

  // tweets / instagram / facebook / tiktok: split only on strong numeric markers
  // that appear at least twice ("1." … "2." or "1)" … "2)").
  const marked = text
    .split(/\n(?=\s*(?:\*\*)?(?:tweet|post|caption|script)?\s*#?\d{1,2}\s*[.)]\s)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (marked.length > 1) return marked.map(cleanBlock);
  return [text];
}

/** Extract the numbered sub-posts of a Threads / Twitter chain. */
export function splitChain(content: string): string[] {
  const parts = content
    .split(/\n(?=\s*\d{1,2}\s*\/\s*\d{0,2}\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts.map((p) => p.replace(/^\s*\d{1,2}\s*\/\s*\d{0,2}\s*/, "").trim());
  const numbered = content
    .split(/\n(?=\s*\d{1,2}\s*[.)]\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (numbered.length > 1) return numbered.map(cleanBlock);
  return content
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Turn one format's raw output into pieces.
 * Prefers the explicit ===PIECE=== delimiter; falls back to legacy heuristics.
 */
export function parsePieces(format: string, content: string): Piece[] {
  const raw = (content || "").trim();
  if (!raw) return [];

  let blocks: string[];
  if (raw.includes(PIECE_DELIMITER)) {
    blocks = raw
      .split(PIECE_DELIMITER)
      .map((s) => s.trim())
      .filter(Boolean);
    if (SINGLE_DOC_FORMATS.has(format) || format === "thread") {
      // Defensive: these formats must stay as one card even if the model
      // sprinkled delimiters inside.
      blocks = [blocks.join("\n\n")];
    }
  } else {
    blocks = legacySplit(format, raw);
  }

  const platform = FORMAT_PLATFORM[format] ?? "blog";
  const document = SINGLE_DOC_FORMATS.has(format);

  return blocks.map((text, i) => {
    const piece: Piece = {
      id: `${format}-${i}`,
      format,
      platform,
      index: i + 1,
      total: blocks.length,
      text: cleanBlock(text),
      document,
    };
    if (format === "thread") {
      const chain = splitChain(text);
      if (chain.length > 1) piece.chain = chain;
    }
    return piece;
  });
}

/** All pieces for a whole pack, in a stable format order. */
export function parsePack(
  results: Record<string, string | undefined>,
  order?: string[],
): Piece[] {
  const keys = order?.length ? order.filter((k) => results[k]) : Object.keys(results);
  const out: Piece[] = [];
  keys.forEach((format) => {
    const content = results[format];
    if (!content) return;
    parsePieces(format, content).forEach((p) => out.push({ ...p, id: `${format}-${out.length}` }));
  });
  return out;
}

export function limitFor(platform: PublishPlatform): number {
  return PLATFORM_LIMITS[platform] ?? 3000;
}

/** Split an over-long text into platform-sized chunks at sentence boundaries. */
export function autoChunk(text: string, limit: number): string[] {
  const clean = text.trim();
  if (clean.length <= limit) return [clean];
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    const piece = s.length > limit ? s.slice(0, limit - 1) : s;
    if ((current ? current.length + 1 : 0) + piece.length > limit - 6) {
      if (current) chunks.push(current.trim());
      current = piece;
    } else {
      current = current ? `${current} ${piece}` : piece;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  const total = chunks.length;
  return chunks.map((c, i) => (total > 1 ? `${c} ${i + 1}/${total}` : c));
}
