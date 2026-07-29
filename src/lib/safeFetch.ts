/**
 * SSRF protection helpers shared by every code path that fetches a
 * user-supplied URL server-side.
 *
 * Pure module (no server-only imports) so it can be imported from
 * *.functions.ts files without leaking server code into the client bundle.
 */

/** Block private, loopback, link-local, and cloud metadata hosts to prevent SSRF. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".local")
  ) return true;
  // IPv6 loopback / unspecified / link-local / unique-local
  if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  const mapped = h.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isBlockedHost(mapped[1]);
  // IPv4 dotted
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 0) return true;                          // 0.0.0.0/8
    if (a === 10) return true;                         // 10.0.0.0/8
    if (a === 127) return true;                        // loopback
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a === 169 && b === 254) return true;           // link-local + AWS/GCP/Azure metadata
    if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
    if (a === 192 && b === 168) return true;           // 192.168.0.0/16
    if (a === 192 && b === 0) return true;             // 192.0.0.0/24 IETF
    if (a >= 224) return true;                         // multicast / reserved
  }
  // Azure IMDS alias
  if (h === "metadata.google.internal" || h === "metadata") return true;
  return false;
}

/** Returns true when the URL is an https/http URL pointing at a public host. */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  return !isBlockedHost(u.hostname);
}

/**
 * fetch() that refuses private/loopback/link-local/metadata destinations and
 * re-validates every redirect hop manually.
 */
export async function safeFetch(raw: string, init?: RequestInit, maxRedirects = 3): Promise<Response> {
  let current = raw;
  for (let i = 0; i <= maxRedirects; i++) {
    if (!isSafePublicUrl(current)) {
      throw new Error("Blocked URL: only public http(s) addresses are allowed");
    }
    const res = await fetch(current, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      current = new URL(loc, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}
