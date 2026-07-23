/**
 * Server-only helpers for publishing to X (Twitter) from a trusted context
 * (cron worker, webhook). Do NOT import this from client code.
 *
 * These functions accept a Supabase admin client (service role) so they can
 * act on behalf of a user without a bearer token — which is what the cron
 * worker needs when firing scheduled posts.
 */

type AdminClient = any;

/**
 * Refresh the stored X access token if it's expired or about to expire.
 * Returns a usable access token or an error string.
 */
export async function refreshXTokenForUser(
  supabase: AdminClient,
  userId: string,
): Promise<{ accessToken: string | null; error?: string }> {
  const { data: acct } = await supabase
    .from("social_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("platform", "twitter")
    .maybeSingle();
  if (!acct?.access_token) return { accessToken: null, error: "NOT_CONNECTED" };

  const needsRefresh =
    !acct.token_expires_at ||
    new Date(acct.token_expires_at).getTime() < Date.now() + 60_000;
  if (!needsRefresh) return { accessToken: acct.access_token };
  if (!acct.refresh_token) return { accessToken: null, error: "NO_REFRESH_TOKEN" };

  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const basic = btoa(`${clientId}:${clientSecret}`);
  const r = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
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
    return { accessToken: null, error: "REFRESH_FAILED" };
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
    })
    .eq("user_id", userId)
    .eq("platform", "twitter");
  return { accessToken: newAccess };
}

/**
 * Upload one media file to X via the v2 chunked upload flow.
 * Returns { mediaId } on success.
 */
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
    if (info.state === "failed") {
      return { error: `processing failed: ${info?.error?.message || "unknown"}` };
    }
    const wait = Math.min(info.check_after_secs || 2, 10) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    const sRes = await fetch(
      `${base}?command=STATUS&media_id=${encodeURIComponent(mediaId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!sRes.ok) break;
    const sJson: any = await sRes.json();
    info = sJson?.data?.processing_info || sJson?.processing_info;
    tries++;
  }
  return { mediaId };
}

/**
 * Publish a single tweet on behalf of a user.
 * Handles token refresh + media upload.
 */
export async function publishTweetForUser(
  supabase: AdminClient,
  userId: string,
  args: { text: string; mediaUrls: string[]; inReplyToTweetId?: string },
): Promise<{ tweetId?: string; url?: string | null; error?: string }> {
  const { accessToken, error: refreshErr } = await refreshXTokenForUser(supabase, userId);
  if (!accessToken) return { error: refreshErr || "NOT_CONNECTED" };

  const mediaIds: string[] = [];
  for (const url of args.mediaUrls) {
    const r = await fetch(url);
    if (!r.ok) return { error: `fetch media ${r.status}` };
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 15 * 1024 * 1024) return { error: "media > 15MB" };
    const mimeType = r.headers.get("content-type") || "image/jpeg";
    const up = await uploadMediaToX(accessToken, buf, mimeType);
    if (up.error || !up.mediaId) return { error: up.error || "media upload failed" };
    mediaIds.push(up.mediaId);
  }

  const body: any = { text: args.text.slice(0, 4000) };
  if (mediaIds.length) body.media = { media_ids: mediaIds };
  if (args.inReplyToTweetId) body.reply = { in_reply_to_tweet_id: args.inReplyToTweetId };

  const postRes = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const postJson: any = await postRes.json().catch(() => ({}));
  if (!postRes.ok) {
    const msg = postJson?.detail || postJson?.title || `publish ${postRes.status}`;
    return { error: msg };
  }
  const tweetId = postJson?.data?.id as string | undefined;

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
