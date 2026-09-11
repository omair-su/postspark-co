/**
 * Human-friendly pack titles derived from the source content.
 * Shared by the server (when a pack row is created) and the UI (rail labels).
 */

const NOISE = [
  /^video source\s*:?\s*/i,
  /^transcript\s*:?\s*/i,
  /^from\s*:?\s*/i,
  /^source\s*:?\s*/i,
  /^https?:\/\/\S+/i,
];

function tidy(line: string): string {
  let s = line.trim().replace(/\s+/g, " ");
  for (const rx of NOISE) s = s.replace(rx, "").trim();
  return s
    .replace(/^[#>*\-–—•\d.)\s]+/, "")
    .replace(/[*_`#]+/g, "")
    .trim();
}

/** Picks the most title-like line of the source and trims it to a clean label. */
export function smartPackTitle(source: string, fallback = "Content pack"): string {
  const lines = (source || "")
    .split(/\r?\n/)
    .map(tidy)
    .filter((l) => l.length >= 12);

  // Prefer a short, headline-shaped line; otherwise the first sentence.
  const headline = lines.find((l) => l.length <= 90 && !/[.!?]$/.test(l)) || lines[0];
  if (!headline) return fallback;

  const sentence = headline.length > 90
    ? (headline.split(/(?<=[.!?])\s/)[0] || headline)
    : headline;

  const out = sentence.slice(0, 80).trim().replace(/[,;:\-–—]+$/, "");
  if (out.length < 8) return fallback;
  return out.charAt(0).toUpperCase() + out.slice(1);
}
