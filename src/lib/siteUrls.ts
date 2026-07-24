export const CANONICAL_SITE_URL = "https://postspark.co";

const TYPO_HOSTS = new Set(["popstspark.co", "www.popstspark.co"]);
const ALLOWED_CANONICAL_HOSTS = new Set(["postspark.co", "www.postspark.co"]);

export function getCanonicalSiteUrl() {
  return CANONICAL_SITE_URL;
}

export function getSafePublicBaseUrl() {
  const configured = typeof process !== "undefined" ? process.env.PUBLIC_BASE_URL?.trim() : undefined;
  if (!configured) return CANONICAL_SITE_URL;

  try {
    const parsed = new URL(configured);
    if (TYPO_HOSTS.has(parsed.hostname)) return CANONICAL_SITE_URL;
    if (ALLOWED_CANONICAL_HOSTS.has(parsed.hostname)) {
      return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
    }
  } catch {
    return CANONICAL_SITE_URL;
  }

  return CANONICAL_SITE_URL;
}

export function getSafeExplicitUrl(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (TYPO_HOSTS.has(parsed.hostname)) return null;
    if (!ALLOWED_CANONICAL_HOSTS.has(parsed.hostname)) return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getCorrectedCanonicalUrl(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_CANONICAL_HOSTS.has(parsed.hostname) && !TYPO_HOSTS.has(parsed.hostname)) return null;
    parsed.protocol = "https:";
    parsed.hostname = "postspark.co";
    parsed.port = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}