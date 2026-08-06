/**
 * Instagram integration — server-only helpers.
 *
 * Uses the standalone **Instagram Login** flow (Instagram API with Instagram
 * Login), NOT Facebook Login. Credentials come from the dedicated PostSpark-IG
 * app: INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET.
 */

export const IG_API_VERSION = "v21.0";
export const IG_GRAPH = `https://graph.instagram.com/${IG_API_VERSION}`;
export const IG_CALLBACK_PATH = "/auth/instagram/callback";

export const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
];

export const INSTAGRAM_ERROR_MESSAGES: Record<string, string> = {
  "190": "Your Instagram session has expired. Please reconnect your account.",
  "102": "Instagram signed you out. Please reconnect your account.",
  "463": "Your Instagram access token expired. Please reconnect your account.",
  "200": "You don't have permission to perform this action. Re-connect Instagram and accept all requested permissions.",
  "100": "Invalid request. Please check your content and try again.",
  "4": "You've hit Instagram's rate limit. Please wait a few minutes and try again.",
  "17": "Too many requests for this Instagram account right now. Try again shortly.",
  "24": "Instagram is throttling this account. Wait a few minutes before publishing again.",
  "368": "Your post was rejected by Instagram for violating community guidelines.",
  "9004": "Instagram couldn't download your media. Make sure the URL is public and reachable.",
  "9007": "This Instagram account isn't a Business/Creator account connected to a Business portfolio.",
  "2207026": "Instagram rejected this video format. Use MP4/MOV with H.264 video and AAC audio.",
  "2207032": "Instagram couldn't create the post. Check media size, aspect ratio and length.",
};


export function igErrorMessage(json: any, res?: Response, fallback = "Instagram returned an error") {
  const e = json?.error;
  const code = e?.code != null ? String(e.code) : "";
  if (code && INSTAGRAM_ERROR_MESSAGES[code]) return INSTAGRAM_ERROR_MESSAGES[code];
  if (e?.error_user_msg) return e.error_user_msg as string;
  if (e?.message) return code ? `${e.message} (Instagram error ${code})` : (e.message as string);
  if (res) return `${fallback} — HTTP ${res.status}`;
  return fallback;
}

export function isAuthError(json: any) {
  const code = json?.error?.code;
  return code === 190 || code === 102 || code === 463;
}

export function getInstagramCredentials() {
  return {
    appId: process.env.INSTAGRAM_APP_ID,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
  };
}

export function getInstagramRedirectUri() {
  const explicit = process.env.INSTAGRAM_REDIRECT_URI;
  if (explicit && /^https:\/\//.test(explicit)) return explicit.replace(/\/$/, "");
  return `https://postspark.co${IG_CALLBACK_PATH}`;
}

/** HMAC-signed OAuth state (same shape as the Meta/Threads flows). */
export async function signInstagramState(payload: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-state-secret";
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
    .join("")
    .slice(0, 32);
}

export async function createInstagramState(userId: string) {
  const payload = `${userId}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  return `${payload}.${await signInstagramState(payload)}`;
}

export async function verifyInstagramState(state: string): Promise<{ userId: string } | null> {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [uid, ts, nonce, sig] = parts;
  const expected = await signInstagramState(`${uid}.${ts}.${nonce}`);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) return null;
  return { userId: uid };
}

/** Instagram consent URL (standalone Instagram Login, not Facebook Login). */
export function buildInstagramAuthUrl(state: string) {
  const { appId } = getInstagramCredentials();
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", appId || "");
  url.searchParams.set("redirect_uri", getInstagramRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", IG_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

async function readJson(res: Response) {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { __raw: raw };
  }
}

/**
 * Exchange ?code for a long-lived Instagram token, verify it, and store a
 * platform=instagram row in social_accounts.
 */
export async function completeInstagramOAuth(code: string, userId: string) {
  const { appId, appSecret } = getInstagramCredentials();
  const redirectUri = getInstagramRedirectUri();
  if (!appId || !appSecret) {
    return { ok: false as const, error: "Instagram app not configured (INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET missing)." };
  }

  // 1) code -> short-lived token
  const tRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  const tJson: any = await readJson(tRes);
  const shortToken = tJson?.access_token as string | undefined;
  if (!tRes.ok || !shortToken) {
    console.error("[instagram] token exchange failed", tRes.status, JSON.stringify(tJson).slice(0, 300));
    return { ok: false as const, error: igErrorMessage(tJson, tRes, "Instagram token exchange failed") };
  }

  // 2) short-lived -> long-lived (60 days)
  const llUrl = new URL("https://graph.instagram.com/access_token");
  llUrl.searchParams.set("grant_type", "ig_exchange_token");
  llUrl.searchParams.set("client_secret", appSecret);
  llUrl.searchParams.set("access_token", shortToken);
  const llRes = await fetch(llUrl.toString());
  const llJson: any = await readJson(llRes);
  const longToken = (llJson?.access_token as string) || shortToken;
  const expiresIn = (llJson?.expires_in as number) || 60 * 24 * 60 * 60;

  // 3) verify + read profile
  const profile = await fetchInstagramProfile(longToken);
  if (!profile.ok) return { ok: false as const, error: profile.error };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("social_accounts").delete().eq("user_id", userId).eq("platform", "instagram");
  const { error: insertErr } = await supabaseAdmin.from("social_accounts").insert({
    user_id: userId,
    platform: "instagram",
    platform_user_id: profile.profile.id,
    platform_username: profile.profile.username ?? null,
    access_token: longToken,
    token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scopes: IG_SCOPES.join(","),
    metadata: {
      display_name: profile.profile.name ?? null,
      avatar_url: profile.profile.profile_picture_url ?? null,
      followers_count: profile.profile.followers_count ?? null,
      follows_count: profile.profile.follows_count ?? null,
      media_count: profile.profile.media_count ?? null,
      account_type: profile.profile.account_type ?? null,
      connected_at: new Date().toISOString(),
    },
  });
  if (insertErr) {
    console.error("[instagram] insert social_accounts failed", insertErr);
    return { ok: false as const, error: insertErr.message };
  }
  return { ok: true as const, username: profile.profile.username ?? null };
}

export async function fetchInstagramProfile(token: string) {
  const fields = "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";
  const res = await fetch(`${IG_GRAPH}/me?fields=${fields}&access_token=${encodeURIComponent(token)}`);
  const json: any = await readJson(res);
  if (!res.ok || !json?.id) {
    console.error("[instagram] profile check failed", res.status, JSON.stringify(json).slice(0, 300));
    return {
      ok: false as const,
      error:
        igErrorMessage(json, res, "Could not read your Instagram profile") +
        " — while the Instagram app is in development mode, the account must be added under App roles → Instagram Tester and the invite accepted in Instagram → Settings → Website permissions.",
    };
  }
  return { ok: true as const, profile: json as Record<string, any> };
}

export type IgAccount = {
  id: string;
  platform_user_id: string;
  platform_username: string | null;
  access_token: string;
  token_expires_at: string | null;
  metadata: Record<string, any> | null;
};

export async function getIgAccount(supabase: any, userId: string): Promise<IgAccount | null> {
  const { data } = await supabase
    .from("social_accounts")
    .select("id, platform_user_id, platform_username, access_token, token_expires_at, metadata")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .maybeSingle();
  return (data as IgAccount) || null;
}

/** Refresh a long-lived token when it expires in under 10 days. */
export async function refreshIgTokenIfNeeded(account: IgAccount) {
  if (!account.token_expires_at) return account;
  const msLeft = new Date(account.token_expires_at).getTime() - Date.now();
  if (msLeft > 10 * 24 * 60 * 60 * 1000) return account;

  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", account.access_token);
  const res = await fetch(url.toString());
  const json: any = await readJson(res);
  if (!res.ok || !json?.access_token) {
    console.error("[instagram] token refresh failed", res.status, JSON.stringify(json).slice(0, 200));
    return account;
  }
  const expiresIn = (json.expires_in as number) || 60 * 24 * 60 * 60;
  const nextExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .update({ access_token: json.access_token, token_expires_at: nextExpiry })
    .eq("id", account.id);
  return { ...account, access_token: json.access_token, token_expires_at: nextExpiry };
}

export async function igPost(path: string, token: string, body: Record<string, string>) {
  const form = new URLSearchParams({ ...body, access_token: token });
  const res = await fetch(`${IG_GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  return { res, json: await readJson(res) } as { res: Response; json: any };
}

export async function igGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${IG_GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  return { res, json: await readJson(res) } as { res: Response; json: any };
}

/** Poll a media container until Instagram finishes processing it. */
export async function waitForContainer(containerId: string, token: string, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 3000 : 5000));
    const { json } = await igGet(containerId, token, { fields: "status_code,status" });
    const code = json?.status_code;
    if (code === "FINISHED") return { ok: true as const };
    if (code === "ERROR" || code === "EXPIRED") {
      return { ok: false as const, error: json?.status ? `Instagram rejected the media: ${json.status}` : "Instagram could not process this media." };
    }
  }
  return { ok: false as const, error: "Instagram is still processing this media. Try publishing again in a minute." };
}

export type IgPublishInput = {
  type: "IMAGE" | "REELS" | "CAROUSEL" | "STORIES";
  caption?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  thumbnailUrl?: string;
  shareToFeed?: boolean;
  firstComment?: string;
};

/** Create the media container(s) for a post and return the id ready to publish. */
export async function createIgContainer(igUserId: string, token: string, input: IgPublishInput) {
  if (input.type === "IMAGE" || input.type === "STORIES") {
    if (!input.mediaUrl) return { ok: false as const, error: "An image URL is required." };
    const body: Record<string, string> = { image_url: input.mediaUrl };
    if (input.type === "STORIES") body.media_type = "STORIES";
    else if (input.caption) body.caption = input.caption;
    const { res, json } = await igPost(`${igUserId}/media`, token, body);
    if (!res.ok || !json?.id) return { ok: false as const, error: igErrorMessage(json, res, "Instagram container failed"), json };
    return { ok: true as const, containerId: json.id as string, needsPolling: input.type === "STORIES" };
  }

  if (input.type === "REELS") {
    if (!input.mediaUrl) return { ok: false as const, error: "A video URL is required for Reels." };
    const body: Record<string, string> = {
      media_type: "REELS",
      video_url: input.mediaUrl,
      share_to_feed: String(input.shareToFeed !== false),
    };
    if (input.caption) body.caption = input.caption;
    if (input.thumbnailUrl) body.thumb_offset = "0";
    const { res, json } = await igPost(`${igUserId}/media`, token, body);
    if (!res.ok || !json?.id) return { ok: false as const, error: igErrorMessage(json, res, "Instagram Reel container failed"), json };
    return { ok: true as const, containerId: json.id as string, needsPolling: true };
  }

  // CAROUSEL
  const urls = (input.mediaUrls || []).filter(Boolean);
  if (urls.length < 2) return { ok: false as const, error: "A carousel needs at least 2 images." };
  if (urls.length > 10) return { ok: false as const, error: "Instagram carousels support at most 10 images." };
  const childIds: string[] = [];
  for (const url of urls) {
    const isVideo = /\.(mp4|mov|m4v)(\?|$)/i.test(url);
    const body: Record<string, string> = { is_carousel_item: "true" };
    if (isVideo) {
      body.media_type = "VIDEO";
      body.video_url = url;
    } else {
      body.image_url = url;
    }
    const { res, json } = await igPost(`${igUserId}/media`, token, body);
    if (!res.ok || !json?.id) return { ok: false as const, error: igErrorMessage(json, res, "Carousel item failed"), json };
    childIds.push(json.id);
  }
  const body: Record<string, string> = { media_type: "CAROUSEL", children: childIds.join(",") };
  if (input.caption) body.caption = input.caption;
  const { res, json } = await igPost(`${igUserId}/media`, token, body);
  if (!res.ok || !json?.id) return { ok: false as const, error: igErrorMessage(json, res, "Carousel container failed"), json };
  return { ok: true as const, containerId: json.id as string, needsPolling: true };
}

/** Publish a finished container, retrying while Instagram reports "media not ready". */
export async function publishIgContainer(igUserId: string, token: string, containerId: string) {
  let last: any = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { res, json } = await igPost(`${igUserId}/media_publish`, token, { creation_id: containerId });
    if (res.ok && json?.id) return { ok: true as const, mediaId: json.id as string, json };
    last = { res, json };
    const sub = json?.error?.error_subcode;
    const retryable = sub === 2207027 || sub === 4279009 || res.status >= 500;
    if (!retryable) break;
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
  }
  return { ok: false as const, error: igErrorMessage(last?.json, last?.res, "Instagram publish failed"), json: last?.json };
}

/* ------------------------------------------------------------------ *
 * Token recovery, deauthorization + webhook diagnostics
 * ------------------------------------------------------------------ */

/** Refresh a long-lived token immediately, regardless of remaining lifetime. */
export async function forceRefreshIgToken(account: IgAccount) {
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", account.access_token);
  const res = await fetch(url.toString());
  const json: any = await readJson(res);
  if (!res.ok || !json?.access_token) {
    return { ok: false as const, account, error: igErrorMessage(json, res, "Instagram token refresh failed") };
  }
  const expiresIn = (json.expires_in as number) || 60 * 24 * 60 * 60;
  const nextExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .update({ access_token: json.access_token, token_expires_at: nextExpiry })
    .eq("id", account.id);
  return {
    ok: true as const,
    account: { ...account, access_token: json.access_token, token_expires_at: nextExpiry } as IgAccount,
  };
}

function base64Url(buf: Uint8Array | Buffer) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Call our own deauthorize/data-deletion callback with a properly signed
 * signed_request, exactly the way Meta would. This keeps a user-initiated
 * disconnect on the same cleanup path as a Meta-initiated one.
 */
export async function callInstagramDeauthorizeCallback(igUserId: string) {
  const { appSecret } = getInstagramCredentials();
  const target = `${IG_DEAUTHORIZE_CALLBACK_URL}`;
  if (!appSecret) return { ok: false as const, error: "Instagram app secret not configured" };
  const payload = base64Url(
    Buffer.from(
      JSON.stringify({
        user_id: igUserId,
        algorithm: "HMAC-SHA256",
        issued_at: Math.floor(Date.now() / 1000),
      }),
      "utf8",
    ),
  );
  const { createHmac } = await import("node:crypto");
  const sig = base64Url(createHmac("sha256", appSecret).update(payload).digest());
  const form = new URLSearchParams({ signed_request: `${sig}.${payload}` });
  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const json: any = await readJson(res);
    if (!res.ok) return { ok: false as const, error: `Deauthorize callback returned HTTP ${res.status}` };
    return { ok: true as const, confirmationCode: json?.confirmation_code ?? null };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Could not reach the deauthorize callback" };
  }
}

export const IG_WEBHOOK_CALLBACK_URL = "https://postspark.co/api/public/webhooks/instagram";
export const IG_DEAUTHORIZE_CALLBACK_URL = "https://postspark.co/api/public/webhooks/instagram/delete";

/** Run the Meta subscription handshake against our own webhook endpoint. */
export async function checkInstagramWebhookVerification() {
  const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!token) {
    return {
      verifyTokenConfigured: false as const,
      ok: false as const,
      detail: "INSTAGRAM_WEBHOOK_VERIFY_TOKEN is not set, so Meta's handshake will always fail.",
    };
  }
  const challenge = `ps-${Math.random().toString(36).slice(2, 10)}`;
  const url = new URL(IG_WEBHOOK_CALLBACK_URL);
  url.searchParams.set("hub.mode", "subscribe");
  url.searchParams.set("hub.verify_token", token);
  url.searchParams.set("hub.challenge", challenge);
  try {
    const res = await fetch(url.toString());
    const text = (await res.text()).trim();
    return {
      verifyTokenConfigured: true as const,
      ok: res.ok && text === challenge,
      detail: res.ok && text === challenge ? "Handshake succeeded." : `Handshake failed — HTTP ${res.status}.`,
    };
  } catch (e: any) {
    return { verifyTokenConfigured: true as const, ok: false as const, detail: e?.message || "Endpoint unreachable." };
  }
}

/* ------------------------------------------------------------------ *
 * Publish flow (container → poll → publish) as a retryable unit
 * ------------------------------------------------------------------ */

export type IgFlowResult =
  | { ok: true; mediaId: string; json: any }
  | { ok: false; stage: "container" | "processing" | "publish"; error: string; json?: any; authError: boolean };

export async function publishIgFlow(account: IgAccount, input: IgPublishInput): Promise<IgFlowResult> {
  const container = await createIgContainer(account.platform_user_id, account.access_token, input);
  if (!container.ok) {
    return {
      ok: false,
      stage: "container",
      error: container.error,
      json: (container as any).json,
      authError: isAuthError((container as any).json),
    };
  }
  if (container.needsPolling) {
    const ready = await waitForContainer(container.containerId, account.access_token);
    if (!ready.ok) return { ok: false, stage: "processing", error: ready.error, authError: false };
  }
  const published = await publishIgContainer(account.platform_user_id, account.access_token, container.containerId);
  if (!published.ok) {
    return {
      ok: false,
      stage: "publish",
      error: published.error,
      json: published.json,
      authError: isAuthError(published.json),
    };
  }
  return { ok: true, mediaId: published.mediaId, json: published.json };
}
