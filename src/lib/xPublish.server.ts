import { safeFetch } from "./safeFetch";
/**
 * Server-only helpers for publishing to X (Twitter) from cron/public routes.
 * Do not import this file from client code.
 */

type AdminClient = any;

const X_REQUIRED_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"] as const;
const X_SCOPES = X_REQUIRED_SCOPES.join(" ");
const X_PERMISSION_DENIED_MESSAGE =
  "Your X account is connected but does not currently have write permission. Please reconnect X and grant posting access.";
const X_RECONNECT_INSTRUCTIONS =
  "X permission denied. Please go to Settings -> Integrations, disconnect X, and reconnect your account to grant write permissions.";
const X_RECONNECT_ERROR = `${X_PERMISSION_DENIED_MESSAGE} ${X_RECONNECT_INSTRUCTIONS}`;

function splitOAuthScopes(scopes?: string | null): string[] {
  return (scopes || "")
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function getMissingXScopes(scopes?: string | null): string[] {
  const granted = new Set(splitOAuthScopes(scopes));
  return X_REQUIRED_SCOPES.filter((scope) => !granted.has(scope));
}

function getXProviderMessage(status: number, body: any): string {
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const firstError = errors[0] || null;
  return (
    firstError?.message ||
    firstError?.detail ||
    body?.detail ||
    body?.title ||
    body?.error_description ||
    body?.error ||
    `X publish failed (${status})`
  );
}

function getXProviderCode(body: any): string | null {
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const code = errors[0]?.code || body?.code || body?.error_code || null;
  return code == null ? null : String(code);
}

function isXPermissionDenied(status: number, body: any): boolean {
  const code = getXProviderCode(body);
  const message = getXProviderMessage(status, body);
  return status === 403 || code === "261" || /not permitted|permission denied|forbidden/i.test(message);
}

async function logXPublishAttempt(
  supabase: AdminClient,
  userId: string,
  args: {
    status: "success" | "failed";
    action?: string;
    text?: string;
    scheduledPostId?: string | null;
    responseStatus?: number | null;
    responseBody?: any;
    tweetId?: string | null;
    errorMessage?: string | null;
  },
) {
  try {
    await supabase.from("publishing_logs").insert({
      user_id: userId,
      platform: "twitter",
      action: args.action || "scheduled_publish_tweet",
      status: args.status,
      scheduled_post_id: args.scheduledPostId || null,
      request_payload: { text_preview: (args.text || "").slice(0, 80) },
      response_payload: {
        status: args.responseStatus ?? null,
        body: args.responseBody ?? null,
        tweet_id: args.tweetId ?? null,
        error_code: getXProviderCode(args.responseBody),
      },
      error_message: args.errorMessage || null,
    } as any);
  } catch (error) {
    console.warn("[xPublish] log skipped", error);
  }
}

export async function refreshXTokenForUser(
  supabase: AdminClient,
  userId: string,
  options: { force?: boolean; validateScopes?: boolean } = {},
): Promise<{ accessToken: string | null; error?: string; code?: string }> {
  const { data: acct } = await supabase
    .from("social_accounts")
    .select("access_token, refresh_token, token_expires_at, scopes")
    .eq("user_id", userId)
    .eq("platform", "twitter")
    .maybeSingle();
  if (!acct?.access_token) return { accessToken: null, error: "NOT_CONNECTED" };

  if (options.validateScopes !== false) {
    const missingScopes = getMissingXScopes(acct.scopes);
    if (missingScopes.length > 0) {
      return {
        accessToken: null,
        code: "X_RECONNECT_REQUIRED",
        error: `X connection is missing ${missingScopes.join(", ")}. ${X_RECONNECT_INSTRUCTIONS}`,
      };
    }
  }

  const needsRefresh =
    options.force ||
    !acct.token_expires_at ||
    new Date(acct.token_expires_at).getTime() < Date.now() + 60_000;
  if (!needsRefresh) return { accessToken: acct.access_token };
  if (!acct.refresh_token) {
    return {
      accessToken: null,
      code: "X_RECONNECT_REQUIRED",
      error: `X connection is missing a refresh token. ${X_RECONNECT_INSTRUCTIONS}`,
    };
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { accessToken: null, error: "X integration is not configured." };

  const r = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: acct.refresh_token,
      client_id: clientId,
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    console.error("[xPublish] refresh failed", r.status, txt.slice(0, 200));
    return {
      accessToken: null,
      code: "X_RECONNECT_REQUIRED",
      error: `X token refresh failed. ${X_RECONNECT_INSTRUCTIONS}`,
    };
  }
  const j: any = await r.json();
  const newAccess = j.access_token as string;
  const newRefresh = (j.refresh_token as string) || acct.refresh_token;
  const expiresIn = j.expires_in || 7200;
  await supabase
    .from("social_accounts")
    .update({
      access_token: newAccess,
      refresh_token: newRefresh,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scopes: j.scope || acct.scopes || X_SCOPES,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("platform", "twitter");
  return { accessToken: newAccess };
}

export async function uploadMediaToX(
  accessToken: string,
  fileBuf: ArrayBuffer,
  mimeType: string,
): Promise<{ mediaId?: string; error?: string }> {
  const isVideo = mimeType.startsWith("video/");
  const mediaCategory = isVideo ? "tweet_video" : "tweet_image";
  const base = "https://api.x.com/2/media/upload";
  const initRes = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      command: "INIT",
      total_bytes: String(fileBuf.byteLength),
      media_type: mimeType,
      media_category: mediaCategory,
    }),
  });
  if (!initRes.ok) {
    const txt = await initRes.text();
    return { error: `INIT ${initRes.status}: ${txt.slice(0, 160)}` };
  }
  const initJson: any = await initRes.json();
  const mediaId = initJson?.data?.id || initJson?.media_id_string;
  if (!mediaId) return { error: "INIT: no media_id" };

  const form = new FormData();
  form.set("command", "APPEND");
  form.set("media_id", mediaId);
  form.set("segment_index", "0");
  form.set("media", new Blob([fileBuf], { type: mimeType }));
  const appendRes = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!appendRes.ok) {
    const txt = await appendRes.text();
    return { error: `APPEND ${appendRes.status}: ${txt.slice(0, 160)}` };
  }

  const finRes = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ command: "FINALIZE", media_id: mediaId }),
  });
  if (!finRes.ok) {
    const txt = await finRes.text();
    return { error: `FINALIZE ${finRes.status}: ${txt.slice(0, 160)}` };
  }
  const finJson: any = await finRes.json();
  let info = finJson?.data?.processing_info || finJson?.processing_info;
  let tries = 0;
  while (info && info.state && info.state !== "succeeded" && tries < 20) {
    if (info.state === "failed") return { error: `processing failed: ${info?.error?.message || "unknown"}` };
    const wait = Math.min(info.check_after_secs || 2, 10) * 1000;
    await new Promise((resolve) => setTimeout(resolve, wait));
    const sRes = await fetch(`${base}?command=STATUS&media_id=${encodeURIComponent(mediaId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!sRes.ok) break;
    const sJson: any = await sRes.json();
    info = sJson?.data?.processing_info || sJson?.processing_info;
    tries++;
  }
  return { mediaId };
}

async function postTweetWithToken(accessToken: string, body: any) {
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { detail: text };
  }
  return { ok: response.ok, status: response.status, json };
}

export async function publishTweetForUser(
  supabase: AdminClient,
  userId: string,
  args: { text: string; mediaUrls: string[]; inReplyToTweetId?: string; scheduledPostId?: string },
): Promise<{ tweetId?: string; url?: string | null; error?: string; code?: string }> {
  const token = await refreshXTokenForUser(supabase, userId);
  if (!token.accessToken) return { error: token.error || "NOT_CONNECTED", code: token.code };

  const mediaIds: string[] = [];
  for (const url of args.mediaUrls) {
    let r: Response;
    try {
      r = await safeFetch(url);
    } catch {
      return { error: "media URL not allowed" };
    }
    if (!r.ok) return { error: `fetch media ${r.status}` };
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 15 * 1024 * 1024) return { error: "media > 15MB" };
    const mimeType = r.headers.get("content-type") || "image/jpeg";
    const up = await uploadMediaToX(token.accessToken, buf, mimeType);
    if (up.error || !up.mediaId) return { error: up.error || "media upload failed" };
    mediaIds.push(up.mediaId);
  }

  const body: any = { text: args.text.slice(0, 4000) };
  if (mediaIds.length) body.media = { media_ids: mediaIds };
  if (args.inReplyToTweetId) body.reply = { in_reply_to_tweet_id: args.inReplyToTweetId };

  let result = await postTweetWithToken(token.accessToken, body);
  if (!result.ok && result.status === 401) {
    const refreshed = await refreshXTokenForUser(supabase, userId, { force: true, validateScopes: false });
    if (refreshed.accessToken) result = await postTweetWithToken(refreshed.accessToken, body);
  }

  if (!result.ok) {
    const denied = isXPermissionDenied(result.status, result.json);
    const error = denied ? X_RECONNECT_ERROR : getXProviderMessage(result.status, result.json);
    await logXPublishAttempt(supabase, userId, {
      status: "failed",
      text: args.text,
      scheduledPostId: args.scheduledPostId,
      responseStatus: result.status,
      responseBody: result.json,
      errorMessage: error,
    });
    return { error, code: denied ? "X_PERMISSION_DENIED" : getXProviderCode(result.json) || "X_PUBLISH_FAILED" };
  }

  const tweetId = result.json?.data?.id as string | undefined;
  await logXPublishAttempt(supabase, userId, {
    status: "success",
    text: args.text,
    scheduledPostId: args.scheduledPostId,
    responseStatus: result.status,
    responseBody: result.json,
    tweetId: tweetId || null,
  });

  const { data: acctRow } = await supabase
    .from("social_accounts")
    .select("platform_username")
    .eq("user_id", userId)
    .eq("platform", "twitter")
    .maybeSingle();
  const uname = (acctRow?.platform_username || "i").replace(/^@/, "");
  const url = tweetId ? `https://x.com/${uname}/status/${tweetId}` : null;
  return { tweetId, url };
}
