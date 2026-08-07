/**
 * Canva Connect API — server-only helpers.
 *
 * The Canva client secret NEVER leaves this file. Access tokens are stored in
 * public.social_accounts (platform = 'canva') and refreshed automatically.
 */
import { CANONICAL_SITE_URL } from "@/lib/siteUrls";

export const CANVA_API_BASE = "https://api.canva.com/rest/v1";
export const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
export const CANVA_REDIRECT_URI = `${CANONICAL_SITE_URL}/auth/canva/callback`;

export const CANVA_SCOPES = [
  "asset:read",
  "asset:write",
  "design:content:read",
  "design:content:write",
  "design:meta:read",
  "profile:read",
  "brandtemplate:content:read",
  "brandtemplate:meta:read",
  "folder:read",
  "folder:write",
];

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "canva-fallback-state-secret";
}

/**
 * PKCE: the verifier is derived deterministically from the signed state, so the
 * stateless callback can recompute it without any client-side storage.
 */
export async function deriveCodeVerifier(payload: string): Promise<string> {
  return hmacHex(`${stateSecret()}:canva-pkce`, payload);
}

export async function codeChallengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export async function buildCanvaState(userId: string): Promise<{ state: string; payload: string }> {
  const payload = `${userId}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  const sig = (await hmacHex(stateSecret(), `canva:${payload}`)).slice(0, 32);
  return { state: `${payload}.${sig}`, payload };
}

export async function verifyCanvaState(
  state: string,
): Promise<{ userId: string; payload: string } | null> {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [uid, ts, nonce, sig] = parts;
  const payload = `${uid}.${ts}.${nonce}`;
  const expected = (await hmacHex(stateSecret(), `canva:${payload}`)).slice(0, 32);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 15 * 60 * 1000) return null;
  return { userId: uid, payload };
}

export function canvaCredentials() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI || CANVA_REDIRECT_URI;
  return { clientId, clientSecret, redirectUri };
}

function basicAuth(clientId: string, clientSecret: string): string {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

export interface CanvaTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export async function exchangeCanvaCode(
  code: string,
  codeVerifier: string,
): Promise<{ tokens?: CanvaTokens; error?: string }> {
  const { clientId, clientSecret, redirectUri } = canvaCredentials();
  if (!clientId || !clientSecret) {
    return { error: "Canva is not configured — CANVA_CLIENT_ID / CANVA_CLIENT_SECRET missing." };
  }
  const res = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(clientId, clientSecret),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[canva] token exchange failed", res.status, text.slice(0, 400));
    return { error: `Canva token exchange failed (${res.status})` };
  }
  try {
    return { tokens: JSON.parse(text) as CanvaTokens };
  } catch {
    return { error: "Canva returned an unreadable token response." };
  }
}

export async function refreshCanvaToken(
  refreshToken: string,
): Promise<{ tokens?: CanvaTokens; error?: string }> {
  const { clientId, clientSecret } = canvaCredentials();
  if (!clientId || !clientSecret) return { error: "Canva is not configured." };
  const res = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(clientId, clientSecret),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: CANVA_SCOPES.join(" "),
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[canva] refresh failed", res.status, text.slice(0, 400));
    return { error: `Canva session could not be refreshed (${res.status})` };
  }
  try {
    return { tokens: JSON.parse(text) as CanvaTokens };
  } catch {
    return { error: "Canva returned an unreadable refresh response." };
  }
}

export async function canvaFetch<T = any>(
  endpoint: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<{ data?: T; status: number; error?: string }> {
  const res = await fetch(`${CANVA_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[canva] request failed", endpoint, res.status, text.slice(0, 300));
    return { status: res.status, error: canvaErrorMessage(res.status, text) };
  }
  try {
    return { status: res.status, data: text ? (JSON.parse(text) as T) : (undefined as any) };
  } catch {
    return { status: res.status, error: "Canva returned an unreadable response." };
  }
}

export function canvaErrorMessage(status: number, body: string): string {
  if (status === 401) return "CANVA_TOKEN_EXPIRED";
  if (status === 403)
    return "Canva denied this request. Your Canva plan or app scopes may not allow it.";
  if (status === 404) return "That Canva resource no longer exists.";
  if (status === 429) return "Canva rate limit reached — please retry in a moment.";
  try {
    const parsed = JSON.parse(body);
    if (parsed?.message) return String(parsed.message);
  } catch {
    /* ignore */
  }
  return `Canva request failed (${status}).`;
}

export const CANVA_PRESETS: Record<
  string,
  { label: string; width: number; height: number; platform: string }
> = {
  youtube_thumbnail: { label: "YouTube Thumbnail", width: 1280, height: 720, platform: "youtube" },
  linkedin_banner: { label: "LinkedIn Banner", width: 1584, height: 396, platform: "linkedin" },
  instagram_post: { label: "Instagram Post", width: 1080, height: 1080, platform: "instagram" },
  instagram_story: { label: "Instagram Story", width: 1080, height: 1920, platform: "instagram" },
  x_header: { label: "X / Twitter Header", width: 1500, height: 500, platform: "twitter" },
  podcast_cover: { label: "Podcast Cover", width: 3000, height: 3000, platform: "podcast" },
  linkedin_carousel: {
    label: "LinkedIn Carousel",
    width: 1080,
    height: 1350,
    platform: "linkedin",
  },
  x_carousel: { label: "X Carousel", width: 1600, height: 900, platform: "twitter" },
};

export function canvaEditUrl(designId: string): string {
  return `https://www.canva.com/design/${designId}/edit`;
}
