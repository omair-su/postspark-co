/**
 * Google Workspace (Drive + Docs) OAuth + REST primitives. Server-only.
 *
 * The OAuth client lives in Google Cloud Console → Credentials → "Web client 1".
 * Authorized redirect URI must be exactly:
 *   https://postspark.co/auth/google/callback
 */

export const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const DRIVE_API = "https://www.googleapis.com/drive/v3";
export const DOCS_API = "https://docs.googleapis.com/v1";
export const DEFAULT_GOOGLE_REDIRECT_URI = "https://postspark.co/auth/google/callback";

/** Folder every PostSpark export lands in. */
export const POSTSPARK_FOLDER_NAME = "PostSpark Exports";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
];

export const GOOGLE_IMPORT_MIME_TYPES = [
  "application/vnd.google-apps.document",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function googleCredentials() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || DEFAULT_GOOGLE_REDIRECT_URI,
  };
}

/* ── signed, stateless OAuth state ─────────────────────────────────── */

async function hmacHex(secret: string, payload: string): Promise<string> {
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

function stateSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "google-fallback-state-secret";
}

export async function buildGoogleState(userId: string, returnTo?: string): Promise<string> {
  const nonce = Math.random().toString(36).slice(2, 10);
  const ret = returnTo ? btoa(returnTo).replace(/=+$/, "") : "-";
  const payload = `${userId}~${Date.now()}~${nonce}~${ret}`;
  const sig = (await hmacHex(stateSecret(), `google:${payload}`)).slice(0, 32);
  return `${payload}~${sig}`;
}

export async function verifyGoogleState(
  state: string,
): Promise<{ userId: string; returnTo: string | null } | null> {
  const parts = state.split("~");
  if (parts.length !== 5) return null;
  const [uid, ts, nonce, ret, sig] = parts;
  const expected = (await hmacHex(stateSecret(), `google:${uid}~${ts}~${nonce}~${ret}`)).slice(0, 32);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 15 * 60 * 1000) return null;
  let returnTo: string | null = null;
  if (ret && ret !== "-") {
    try {
      const decoded = atob(ret.padEnd(Math.ceil(ret.length / 4) * 4, "="));
      if (decoded.startsWith("/")) returnTo = decoded;
    } catch {}
  }
  return { userId: uid, returnTo };
}

/**
 * Consent URL. `access_type=offline` + `prompt=consent` guarantee a refresh
 * token so users never have to reconnect after the 1-hour access token expires.
 */
export async function buildGoogleAuthUrl(
  userId: string,
  extraScopes: string[] = [],
  returnTo?: string,
): Promise<{ url?: string; error?: string }> {
  const { clientId, redirectUri } = googleCredentials();
  if (!clientId) return { error: "Google is not configured yet — GOOGLE_CLIENT_ID is missing." };

  const scope = Array.from(new Set([...GOOGLE_SCOPES, ...extraScopes])).join(" ");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: await buildGoogleState(userId, returnTo),
  });
  return { url: `${GOOGLE_AUTHORIZE_URL}?${params.toString()}` };
}

/* ── token endpoints ───────────────────────────────────────────────── */

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export async function exchangeGoogleCode(
  code: string,
): Promise<{ tokens?: GoogleTokens; error?: string }> {
  const { clientId, clientSecret, redirectUri } = googleCredentials();
  if (!clientId || !clientSecret) return { error: "Google OAuth credentials are missing." };

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json?.access_token) {
    return { error: json?.error_description || json?.error || `token_failed_${res.status}` };
  }
  return { tokens: json as GoogleTokens };
}

export async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ tokens?: GoogleTokens; error?: string }> {
  const { clientId, clientSecret } = googleCredentials();
  if (!clientId || !clientSecret) return { error: "Google OAuth credentials are missing." };

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json?.access_token) {
    return { error: json?.error_description || json?.error || "GOOGLE_REAUTH_REQUIRED" };
  }
  return { tokens: json as GoogleTokens };
}

export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch {}
}

export async function fetchGoogleProfile(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as
    | { id: string; email?: string; name?: string; picture?: string }
    | null;
}

/** Extract a Docs/Drive document id from a raw id or a pasted URL. */
export function extractGoogleDocId(input: string): string {
  const m = input.match(/\/d\/([a-zA-Z0-9-_]{10,})/) || input.match(/[?&]id=([a-zA-Z0-9-_]{10,})/);
  return m ? m[1] : input.trim();
}
