// Server-only helpers for extracting public LinkedIn video URLs.
// Best-effort: parses og:video / og:video:url / progressive MP4 URLs from the public page HTML.

export type ExtractResult =
  | { ok: true; videoUrl: string; posterUrl?: string; title?: string }
  | { ok: false; error: string };

const LI_URL_REGEX = /^https?:\/\/([a-z0-9-]+\.)*linkedin\.com\/.+/i;

export function isLinkedInUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /(^|\.)linkedin\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/")
    .replace(/&#34;/g, '"')
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"');
}

function pickMeta(html: string, prop: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1]) : undefined;
}

function pickFirstMp4(html: string): string | undefined {
  // Look for typical LinkedIn DMS progressive MP4 URLs.
  const re = /https?:\\?\/\\?\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi;
  const matches = html.match(re);
  if (!matches || matches.length === 0) return undefined;
  // Prefer highest-quality (last) and decoded
  const cleaned = matches.map(decode).filter((u) => /^https?:\/\//i.test(u));
  if (cleaned.length === 0) return undefined;
  // Prefer URLs containing "progressive" or with the largest path length (proxy for resolution)
  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0];
}

export async function extractLinkedInVideo(url: string): Promise<ExtractResult> {
  if (!LI_URL_REGEX.test(url)) {
    return { ok: false, error: "Not a valid LinkedIn URL." };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (e) {
    return { ok: false, error: "Could not reach LinkedIn. Try again." };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `LinkedIn returned ${res.status}. The post may be private or removed.`,
    };
  }

  const html = await res.text();

  const ogVideo =
    pickMeta(html, "og:video:secure_url") ||
    pickMeta(html, "og:video:url") ||
    pickMeta(html, "og:video");
  const posterUrl = pickMeta(html, "og:image");
  const title = pickMeta(html, "og:title");

  const videoUrl = ogVideo || pickFirstMp4(html);

  if (!videoUrl) {
    return {
      ok: false,
      error:
        "No public video found on this post. Make sure the URL is a public LinkedIn video post (not a private/login-walled page).",
    };
  }

  return { ok: true, videoUrl, posterUrl, title };
}
