/**
 * Shared OAuth state primitives.
 *
 * Fails closed: if no signing secret is configured the connect flow errors out
 * instead of signing with a well-known literal (which would let anyone forge a
 * callback state for any user).
 *
 * Pure module (no server-only imports) so it can be imported from
 * *.functions.ts files. Every helper reads process.env lazily, inside the call.
 */

/** Signing secret for OAuth state. Throws when nothing is configured. */
export function oauthStateSecret(): string {
  const secret =
    process.env.OAUTH_STATE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!secret) {
    throw new Error(
      "Social connections are not configured on this deployment (missing OAuth state secret).",
    );
  }
  return secret;
}

/** Cryptographically random, dot-free nonce for one-shot OAuth state values. */
export function oauthNonce(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hex HMAC-SHA256 of `payload` under `secret`. */
export async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison for signatures. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
