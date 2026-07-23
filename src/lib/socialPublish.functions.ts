import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

function getRedirectUri() {
  // Public OAuth callback. Override per-env via PUBLIC_BASE_URL if needed.
  const base = process.env.PUBLIC_BASE_URL || "https://postspark.co";
  return `${base.replace(/\/$/, "")}/api/public/oauth/youtube/callback`;
}

async function signState(payload: string): Promise<string> {
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

export const getYouTubeAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) return { error: "YouTube publishing not configured (missing Google OAuth credentials)." };
    const ts = Date.now();
    const nonce = Math.random().toString(36).slice(2, 10);
    const payload = `${context.userId}.${ts}.${nonce}`;
    const sig = signState(payload);
    const state = `${payload}.${sig}`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", getRedirectUri());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", YT_SCOPES);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

export const getConnectedSocials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data } = await context.supabase
        .from("social_accounts")
        .select("platform, platform_username, token_expires_at")
        .eq("user_id", context.userId);
      return { accounts: data || [] };
    } catch {
      return { accounts: [] };
    }
  });

export const disconnectSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ platform: z.enum(["youtube", "tiktok", "linkedin", "twitter"]) }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("platform", data.platform);
    if (error) return { error: error.message };
    return { ok: true };
  });

/**
 * Attach an uploaded video URL (storage path) to a generated shorts job.
 * Stores it in repurpose_jobs.outputs.video so it appears in History.
 */
export const attachShortVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      storagePath: z.string().min(1).max(500),
      mimeType: z.string().min(1).max(120),
      sizeBytes: z.number().int().min(1).max(1024 * 1024 * 500),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job } = await supabase
      .from("repurpose_jobs")
      .select("id, outputs")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!job) return { error: "Job not found" };
    const outputs = (job.outputs as any) || {};
    outputs.video = {
      storage_path: data.storagePath,
      mime_type: data.mimeType,
      size_bytes: data.sizeBytes,
      uploaded_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("repurpose_jobs")
      .update({ outputs })
      .eq("id", data.jobId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    return { ok: true };
  });

/**
 * Returns a short-lived signed URL the client can use to download the video
 * (e.g. to drop into the TikTok upload page after we open it).
 */
export const getShortVideoSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storagePath: z.string().min(1).max(500) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.storagePath.startsWith(`${userId}/`)) return { error: "Forbidden" };
    const { data: signed, error } = await supabase.storage
      .from("shorts-videos")
      .createSignedUrl(data.storagePath, 60 * 60);
    if (error || !signed) return { error: error?.message || "Failed to sign URL" };
    return { url: signed.signedUrl };
  });

/**
 * Publish to YouTube via Data API v3 resumable upload.
 * Server fetches the video from private storage, uploads to YouTube,
 * records the resulting video id in scheduled_posts.
 */
export const publishToYouTube = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      storagePath: z.string().min(1).max(500),
      title: z.string().min(1).max(100),
      description: z.string().max(5000),
      hashtags: z.array(z.string().max(60)).max(20).default([]),
      privacy: z.enum(["public", "unlisted", "private"]).default("private"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.storagePath.startsWith(`${userId}/`)) return { error: "Forbidden" };

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) return { error: "YouTube not configured" };

    // 1. Find token
    const { data: acct } = await supabase
      .from("social_accounts")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", userId)
      .eq("platform", "youtube")
      .maybeSingle();
    if (!acct?.refresh_token) return { error: "NOT_CONNECTED" };

    // 2. Refresh access token if needed
    let accessToken = acct.access_token as string | null;
    const needRefresh = !accessToken || !acct.token_expires_at ||
      new Date(acct.token_expires_at).getTime() < Date.now() + 60_000;
    if (needRefresh) {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: acct.refresh_token,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        console.error("YT refresh failed", r.status, txt);
        return { error: "Re-connect YouTube (refresh failed)" };
      }
      const j = await r.json();
      accessToken = j.access_token as string;
      await supabase.from("social_accounts").update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + (j.expires_in || 3600) * 1000).toISOString(),
      }).eq("user_id", userId).eq("platform", "youtube");
    }

    // 3. Download video bytes from storage (private bucket)
    const { data: signed } = await supabase.storage
      .from("shorts-videos")
      .createSignedUrl(data.storagePath, 60 * 10);
    if (!signed?.signedUrl) return { error: "Could not access video" };
    const videoRes = await fetch(signed.signedUrl);
    if (!videoRes.ok) return { error: "Video fetch failed" };
    const videoBuf = await videoRes.arrayBuffer();
    const mimeType = videoRes.headers.get("content-type") || "video/mp4";

    // 4. YouTube resumable upload — start
    const description =
      (data.description || "") +
      (data.hashtags.length ? "\n\n" + data.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : "");
    const metadata = {
      snippet: {
        title: data.title.slice(0, 100),
        description: description.slice(0, 5000),
        tags: data.hashtags.slice(0, 15).map((h) => h.replace(/^#/, "")),
        categoryId: "22", // People & Blogs
      },
      status: { privacyStatus: data.privacy, selfDeclaredMadeForKids: false },
    };
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(videoBuf.byteLength),
          "X-Upload-Content-Type": mimeType,
        },
        body: JSON.stringify(metadata),
      },
    );
    if (!initRes.ok) {
      const txt = await initRes.text();
      console.error("YT init failed", initRes.status, txt);
      return { error: `YouTube init failed: ${initRes.status}` };
    }
    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) return { error: "No upload URL from YouTube" };

    // 5. PUT video bytes
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType, "Content-Length": String(videoBuf.byteLength) },
      body: videoBuf,
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      console.error("YT upload failed", putRes.status, txt);
      return { error: `YouTube upload failed: ${putRes.status}` };
    }
    const published = await putRes.json();
    const videoId = published?.id as string | undefined;
    const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

    // 6. Record in scheduled_posts
    await supabase.from("scheduled_posts").insert({
      user_id: userId,
      platform: "youtube",
      status: "published",
      published_at: new Date().toISOString(),
      content: description.slice(0, 2000),
      title: data.title,
      platform_post_id: videoId,
      media_url: watchUrl,
      media_type: mimeType,
      tool: "shorts_studio",
      repurpose_job_id: data.jobId,
      scheduled_for: new Date().toISOString(),
    } as any);

    return { ok: true, videoId, url: watchUrl };
  });

/**
 * Mark a TikTok publish as "drafted" (we opened tiktok.com/upload).
 * Records intent in scheduled_posts so it appears in History.
 */
export const recordTikTokIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      storagePath: z.string().min(1).max(500),
      title: z.string().min(1).max(200),
      description: z.string().max(2200),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("scheduled_posts").insert({
      user_id: context.userId,
      platform: "tiktok",
      status: "draft",
      content: data.description.slice(0, 2000),
      title: data.title,
      media_url: data.storagePath,
      tool: "shorts_studio",
      repurpose_job_id: data.jobId,
      scheduled_for: new Date().toISOString(),
    } as any);
    return { ok: true };
  });

// Re-export the signing helper for the OAuth callback route to verify state.
export async function verifyOAuthState(state: string): Promise<{ userId: string } | null> {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [uid, ts, nonce, sig] = parts;
  const payload = `${uid}.${ts}.${nonce}`;
  const expected = await signState(payload);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) return null;
  return { userId: uid };
}

// ============================================================================
// TikTok OAuth (Login Kit + Content Posting API)
// ============================================================================

const TIKTOK_SCOPES = ["user.info.basic", "video.publish", "video.upload"].join(",");

function getTikTokRedirectUri() {
  const base = process.env.PUBLIC_BASE_URL || "https://postspark.co";
  return `${base.replace(/\/$/, "")}/api/public/oauth/tiktok/callback`;
}

export const getTikTokAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    if (!clientKey) return { error: "TikTok integration not configured (missing TIKTOK_CLIENT_KEY)." };
    const ts = Date.now();
    const nonce = Math.random().toString(36).slice(2, 10);
    const payload = `${context.userId}.${ts}.${nonce}`;
    const sig = await signState(payload);
    const state = `${payload}.${sig}`;
    const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key", clientKey);
    url.searchParams.set("scope", TIKTOK_SCOPES);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", getTikTokRedirectUri());
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

/**
 * Publish a video to TikTok using PULL_FROM_URL (Content Posting API v2).
 * The video URL must be an HTTPS URL on a verified domain (see TikTok docs).
 */
export const publishToTikTok = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      videoUrl: z.string().url(),
      title: z.string().min(1).max(150),
      privacyLevel: z.enum([
        "PUBLIC_TO_EVERYONE",
        "MUTUAL_FOLLOW_FRIENDS",
        "FOLLOWER_OF_CREATOR",
        "SELF_ONLY",
      ]).default("PUBLIC_TO_EVERYONE"),
      disableDuet: z.boolean().default(false),
      disableComment: z.boolean().default(false),
      disableStitch: z.boolean().default(false),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { data: acct } = await context.supabase
      .from("social_accounts")
      .select("access_token, token_expires_at")
      .eq("user_id", context.userId)
      .eq("platform", "tiktok")
      .maybeSingle();
    if (!acct?.access_token) return { error: "TikTok not connected. Connect in Settings first." };
    if (acct.token_expires_at && new Date(acct.token_expires_at) < new Date()) {
      return { error: "TikTok access expired. Please reconnect in Settings." };
    }

    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acct.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: data.title.slice(0, 150),
          privacy_level: data.privacyLevel,
          disable_duet: data.disableDuet,
          disable_comment: data.disableComment,
          disable_stitch: data.disableStitch,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: data.videoUrl,
        },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error?.code !== "ok") {
      const msg = json?.error?.message || `TikTok publish failed (${res.status})`;
      console.error("TikTok publish error", res.status, json);
      return { error: msg };
    }
    return { ok: true, publishId: json?.data?.publish_id };
  });

// ============================================================================
// LinkedIn OAuth (Sign In with LinkedIn OIDC) + Share on LinkedIn
// ============================================================================

const LINKEDIN_SCOPES = ["openid", "profile", "email", "w_member_social"].join(" ");

function getLinkedInRedirectUri() {
  const base = process.env.PUBLIC_BASE_URL || "https://postspark.co";
  return `${base.replace(/\/$/, "")}/api/public/oauth/linkedin/callback`;
}

export const getLinkedInAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) return { error: "LinkedIn integration not configured (missing LINKEDIN_CLIENT_ID)." };
    const ts = Date.now();
    const nonce = Math.random().toString(36).slice(2, 10);
    const payload = `${context.userId}.${ts}.${nonce}`;
    const sig = await signState(payload);
    const state = `${payload}.${sig}`;
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", getLinkedInRedirectUri());
    url.searchParams.set("scope", LINKEDIN_SCOPES);
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

/**
 * Publish a native LinkedIn post using the /rest/posts API.
 * - Text-only when no mediaUrl
 * - Single image when mediaUrl points to an image (jpeg/png)
 * - Article/link post when linkUrl is provided
 */
export const publishToLinkedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      commentary: z.string().min(1).max(3000),
      visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
      mediaUrl: z.string().url().optional(),
      mediaTitle: z.string().max(200).optional(),
      mediaAltText: z.string().max(300).optional(),
      linkUrl: z.string().url().optional(),
      status: z.enum(["published", "draft"]).default("published"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: acct } = await supabase
      .from("social_accounts")
      .select("access_token, token_expires_at, platform_user_id, platform_username")
      .eq("user_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();
    if (!acct?.access_token) return { error: "LinkedIn not connected. Connect in Settings first." };
    if (acct.token_expires_at && new Date(acct.token_expires_at) < new Date()) {
      return { error: "LinkedIn access expired. Please reconnect in Settings." };
    }
    if (!acct.platform_user_id) return { error: "LinkedIn member id missing. Please reconnect." };

    // Draft: just record intent, no API call
    if (data.status === "draft") {
      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "linkedin",
        status: "draft",
        content: data.commentary.slice(0, 3000),
        media_url: data.mediaUrl || data.linkUrl || null,
        scheduled_for: new Date().toISOString(),
      } as any);
      return { ok: true, draft: true };
    }

    const authorUrn = acct.platform_user_id.startsWith("urn:")
      ? acct.platform_user_id
      : `urn:li:person:${acct.platform_user_id}`;

    const headers = {
      Authorization: `Bearer ${acct.access_token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202506",
      "X-Restli-Protocol-Version": "2.0.0",
    } as Record<string, string>;

    let content: any = undefined;

    // Image upload flow
    if (data.mediaUrl && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(data.mediaUrl)) {
      // 1. Initialize upload
      const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers,
        body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
      });
      if (!initRes.ok) {
        const txt = await initRes.text();
        console.error("LinkedIn image init failed", initRes.status, txt);
        return { error: `LinkedIn image init failed: ${initRes.status}` };
      }
      const initJson = await initRes.json();
      const uploadUrl = initJson?.value?.uploadUrl as string;
      const imageUrn = initJson?.value?.image as string;
      if (!uploadUrl || !imageUrn) return { error: "LinkedIn upload URL missing" };

      // 2. Fetch image bytes and PUT them
      const imgRes = await fetch(data.mediaUrl);
      if (!imgRes.ok) return { error: "Could not fetch image bytes" };
      const imgBuf = await imgRes.arrayBuffer();
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${acct.access_token}` },
        body: imgBuf,
      });
      if (!putRes.ok) {
        const txt = await putRes.text();
        console.error("LinkedIn image PUT failed", putRes.status, txt);
        return { error: `LinkedIn image upload failed: ${putRes.status}` };
      }
      content = {
        media: { id: imageUrn, altText: data.mediaAltText || data.mediaTitle || "" },
      };
    } else if (data.linkUrl) {
      content = { article: { source: data.linkUrl, title: data.mediaTitle || "" } };
    }

    // 3. Create post
    const postBody: any = {
      author: authorUrn,
      commentary: data.commentary,
      visibility: data.visibility,
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (content) postBody.content = content;

    const postRes = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers,
      body: JSON.stringify(postBody),
    });
    if (!postRes.ok && postRes.status !== 201) {
      const txt = await postRes.text();
      console.error("LinkedIn post failed", postRes.status, txt);
      return { error: `LinkedIn publish failed (${postRes.status}): ${txt.slice(0, 200)}` };
    }
    const postId = postRes.headers.get("x-restli-id") || postRes.headers.get("x-linkedin-id") || null;
    const postUrl = postId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/` : null;

    await supabase.from("scheduled_posts").insert({
      user_id: userId,
      platform: "linkedin",
      status: "published",
      published_at: new Date().toISOString(),
      content: data.commentary.slice(0, 3000),
      platform_post_id: postId,
      media_url: postUrl || data.mediaUrl || data.linkUrl || null,
      scheduled_for: new Date().toISOString(),
    } as any);

    return { ok: true, postId, url: postUrl };
  });

// ============================================================================
// X (Twitter) OAuth 2.0 with PKCE + Direct posting
// ============================================================================

const X_SCOPES = ["tweet.read", "users.read", "tweet.write", "offline.access", "media.write"].join(" ");

function getXRedirectUri() {
  // Allow an explicit override so it EXACTLY matches whatever is registered in
  // the X developer portal ("Callback URI / Redirect URL"). If not set, derive
  // from PUBLIC_BASE_URL.
  const explicit = process.env.X_REDIRECT_URI;
  if (explicit) return explicit.trim();
  const base = process.env.PUBLIC_BASE_URL || "https://postspark.co";
  return `${base.replace(/\/$/, "")}/api/public/oauth/x/callback`;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sha256b64url(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return b64url(new Uint8Array(buf));
}

// State format for X (carries PKCE verifier): "x.<uid>.<ts>.<verifier>.<sig>"
async function signXState(userId: string, ts: number, verifier: string): Promise<string> {
  const payload = `x.${userId}.${ts}.${verifier}`;
  const sig = await signState(payload);
  return `${payload}.${sig}`;
}

export async function verifyXOAuthState(
  state: string,
): Promise<{ userId: string; codeVerifier: string } | null> {
  const parts = state.split(".");
  if (parts.length !== 5 || parts[0] !== "x") return null;
  const [, uid, ts, verifier, sig] = parts;
  const payload = `x.${uid}.${ts}.${verifier}`;
  const expected = await signState(payload);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) return null;
  return { userId: uid, codeVerifier: verifier };
}

export const getXAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const clientId = process.env.X_CLIENT_ID;
      if (!clientId) return { error: "X integration not configured (missing X_CLIENT_ID)." };

      // PKCE
      const verifierBytes = new Uint8Array(48);
      crypto.getRandomValues(verifierBytes);
      const codeVerifier = b64url(verifierBytes);
      const codeChallenge = await sha256b64url(codeVerifier);

      const ts = Date.now();
      const state = await signXState(context.userId, ts, codeVerifier);

      const url = new URL("https://twitter.com/i/oauth2/authorize");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", getXRedirectUri());
      url.searchParams.set("scope", X_SCOPES);
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      return { url: url.toString() };
    } catch (e: any) {
      console.error("getXAuthUrl error:", e);
      return { error: e?.message || "Failed to build X auth URL" };
    }
  });

/**
 * Refresh the X access token if it's expired.
 * Uses HTTP Basic auth (X requires client_id:client_secret) for confidential clients.
 */
async function refreshXTokenIfNeeded(
  supabase: any,
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
  if (!acct.refresh_token) return { accessToken: null, error: "Reconnect X (no refresh token)" };

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
    console.error("X refresh failed", r.status, txt);
    return { accessToken: null, error: "Reconnect X (refresh failed)" };
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
 * Upload a single media file (image or video) to X via the v1.1 chunked
 * upload endpoint (INIT/APPEND/FINALIZE + STATUS polling). X's v2 media
 * upload uses the same INIT/APPEND/FINALIZE flow at /2/media/upload.
 * Returns the media_id_string.
 */
async function uploadMediaToX(
  accessToken: string,
  fileBuf: ArrayBuffer,
  mimeType: string,
): Promise<{ mediaId?: string; error?: string }> {
  const isVideo = mimeType.startsWith("video/");
  const mediaCategory = isVideo ? "tweet_video" : "tweet_image";
  const base = "https://api.x.com/2/media/upload";

  // INIT
  const initBody = new URLSearchParams({
    command: "INIT",
    total_bytes: String(fileBuf.byteLength),
    media_type: mimeType,
    media_category: mediaCategory,
  });
  const initRes = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: initBody,
  });
  if (!initRes.ok) {
    const txt = await initRes.text();
    return { error: `X media INIT failed (${initRes.status}): ${txt.slice(0, 200)}` };
  }
  const initJson: any = await initRes.json();
  const mediaId = initJson?.data?.id || initJson?.media_id_string;
  if (!mediaId) return { error: "X media INIT: no media_id" };

  // APPEND (single chunk; small enough for this app's usage)
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
    return { error: `X media APPEND failed (${appendRes.status}): ${txt.slice(0, 200)}` };
  }

  // FINALIZE
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
    return { error: `X media FINALIZE failed (${finRes.status}): ${txt.slice(0, 200)}` };
  }
  const finJson: any = await finRes.json();

  // Poll processing_info for video
  let info = finJson?.data?.processing_info || finJson?.processing_info;
  let tries = 0;
  while (info && info.state && info.state !== "succeeded" && tries < 20) {
    if (info.state === "failed") {
      return { error: `X media processing failed: ${info?.error?.message || "unknown"}` };
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
 * Publish a single tweet (text + optional media). Media URLs are fetched
 * server-side, uploaded to X, and attached to the tweet.
 */
export const publishToX = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(4000),
      mediaUrls: z.array(z.string().url()).max(4).default([]),
      altTexts: z.array(z.string().max(1000)).max(4).default([]),
      inReplyToTweetId: z.string().max(40).optional(),
      repurposeJobId: z.string().uuid().optional(),
      poll: z
        .object({
          options: z.array(z.string().min(1).max(25)).min(2).max(4),
          durationMinutes: z.number().int().min(5).max(10080),
        })
        .optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      // Plan gating: Free tier caps X publishing (text only, 5/month, no scheduling).
      const { data: prof } = await supabase.from("profiles").select("plan").eq("user_id", userId).maybeSingle();
      const plan = (prof?.plan || "free") as string;
      const isPaid = plan === "pro" || plan === "agency";
      if (!isPaid) {
        if (data.mediaUrls.length > 0) {
          return { error: "Attaching images to X posts is a Pro feature. Upgrade to publish with media." };
        }
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("scheduled_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("platform", "twitter")
          .eq("status", "published")
          .gte("published_at", startOfMonth.toISOString());
        if ((count ?? 0) >= 5) {
          return { error: "Free plan limit reached: 5 X posts / month. Upgrade to Pro for unlimited." };
        }
      }

      const { accessToken, error: refreshErr } = await refreshXTokenIfNeeded(supabase, userId);
      if (refreshErr || !accessToken) {
        return { error: refreshErr === "NOT_CONNECTED" ? "X not connected. Connect in Settings." : refreshErr };
      }



      // Polls can't be combined with media on X.
      if (data.poll && data.mediaUrls.length > 0) {
        return { error: "X does not allow polls with media attachments." };
      }

      // Upload each media URL to X (and set alt text if provided)
      const mediaIds: string[] = [];
      if (!data.poll) {
        for (let i = 0; i < data.mediaUrls.length; i++) {
          const url = data.mediaUrls[i];
          const r = await fetch(url);
          if (!r.ok) return { error: `Could not fetch media at ${url.slice(0, 80)}` };
          const buf = await r.arrayBuffer();
          const mimeType = r.headers.get("content-type") || "image/jpeg";
          if (buf.byteLength > 15 * 1024 * 1024) {
            return { error: "Media exceeds 15MB limit" };
          }
          const up = await uploadMediaToX(accessToken, buf, mimeType);
          if (up.error || !up.mediaId) return { error: up.error || "X media upload failed" };
          mediaIds.push(up.mediaId);

          // Best-effort alt text (a11y). Non-fatal if it fails.
          const alt = (data.altTexts?.[i] || "").trim();
          if (alt) {
            try {
              await fetch("https://api.x.com/2/media/metadata", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: up.mediaId,
                  metadata: { alt_text: { text: alt.slice(0, 1000) } },
                }),
              });
            } catch (e) {
              console.warn("[publishToX] alt-text metadata failed", e);
            }
          }
        }
      }

      // Post tweet
      const body: any = { text: data.text.slice(0, 4000) };
      if (mediaIds.length) body.media = { media_ids: mediaIds };
      if (data.inReplyToTweetId) body.reply = { in_reply_to_tweet_id: data.inReplyToTweetId };
      if (data.poll) {
        body.poll = {
          options: data.poll.options.map((o) => o.slice(0, 25)),
          duration_minutes: data.poll.durationMinutes,
        };
      }

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
        const msg = postJson?.detail || postJson?.title || `X publish failed (${postRes.status})`;
        console.error("X publish error", postRes.status, postJson);
        return { error: msg };
      }
      const tweetId = postJson?.data?.id as string | undefined;

      // Get username for the tweet URL
      const { data: acctRow } = await supabase
        .from("social_accounts")
        .select("platform_username")
        .eq("user_id", userId)
        .eq("platform", "twitter")
        .maybeSingle();
      const uname = (acctRow?.platform_username || "i").replace(/^@/, "");
      const tweetUrl = tweetId ? `https://x.com/${uname}/status/${tweetId}` : null;

      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "twitter",
        status: "published",
        published_at: new Date().toISOString(),
        content: data.text.slice(0, 3000),
        title: data.text.slice(0, 80),
        platform_post_id: tweetId,
        media_url: tweetUrl || data.mediaUrls[0] || null,
        media_type: data.mediaUrls[0] ? "image" : null,
        repurpose_job_id: data.repurposeJobId,
        scheduled_for: new Date().toISOString(),
      } as any);

      return { ok: true, tweetId, url: tweetUrl };
    } catch (e: any) {
      console.error("[publishToX] error:", e);
      return { error: e?.message || "Failed to publish to X" };
    }
  });

/**
 * Schedule an X post. Stored in scheduled_posts; the cron worker will
 * pick it up and call publishToX at the scheduled time.
 */
export const scheduleXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(4000),
      mediaUrls: z.array(z.string().url()).max(4).default([]),
      scheduledFor: z.string().datetime(),
      repurposeJobId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      // Plan gating: scheduling is a Pro feature.
      const { data: prof } = await supabase.from("profiles").select("plan").eq("user_id", userId).maybeSingle();
      const plan = (prof?.plan || "free") as string;
      if (plan !== "pro" && plan !== "agency") {
        return { error: "Scheduling posts is a Pro feature. Upgrade to schedule to X." };
      }


      const { data: inserted, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: userId,
          platform: "twitter",
          status: "scheduled",
          content: data.text.slice(0, 3000),
          title: data.text.slice(0, 80),
          media_url: data.mediaUrls[0] || null,
          media_type: data.mediaUrls[0] ? "image" : null,
          scheduled_for: data.scheduledFor,
          repurpose_job_id: data.repurposeJobId,
          tool: "x_publish",
        } as any)
        .select()
        .single();
      if (error) {
        console.error("Schedule X post error:", error);
        return { error: error.message };
      }
      return { ok: true, post: inserted };
    } catch (e: any) {
      console.error("[scheduleXPost] error:", e);
      return { error: e?.message || "Failed to schedule X post" };
    }
  });

/**
 * Delete a tweet that was already published via PostSpark.
 */
export const deleteXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tweetId: z.string().min(1).max(40) }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const { accessToken, error: refreshErr } = await refreshXTokenIfNeeded(supabase, userId);
      if (refreshErr || !accessToken) return { error: refreshErr || "Not connected" };
      const r = await fetch(`https://api.x.com/2/tweets/${encodeURIComponent(data.tweetId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) {
        const txt = await r.text();
        return { error: `Delete failed (${r.status}): ${txt.slice(0, 200)}` };
      }
      await supabase
        .from("scheduled_posts")
        .update({ status: "deleted" })
        .eq("user_id", userId)
        .eq("platform_post_id", data.tweetId);
      return { ok: true };
    } catch (e: any) {
      console.error("[deleteXPost] error:", e);
      return { error: e?.message || "Failed to delete tweet" };
    }
  });

/**
 * Cancel a scheduled (not-yet-published) X post. Removes it from the queue.
 */
export const cancelScheduledXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", data.id)
        .eq("user_id", userId)
        .eq("platform", "twitter")
        .in("status", ["scheduled", "failed"]);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { error: e?.message || "Failed to cancel" };
    }
  });

/**
 * Re-queue a failed X post so the cron worker will retry it.
 */
export const retryScheduledXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      scheduledFor: z.string().datetime().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const when = data.scheduledFor || new Date(Date.now() + 60_000).toISOString();
      const { error } = await supabase
        .from("scheduled_posts")
        .update({
          status: "scheduled",
          scheduled_for: when,
          publish_error: null,
        })
        .eq("id", data.id)
        .eq("user_id", userId)
        .eq("platform", "twitter")
        .in("status", ["failed", "publishing"]);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { error: e?.message || "Failed to retry" };
    }
  });

/**
 * Aggregate X publishing stats: recent posts, monthly counts, tier limits.
 * Used by XAnalyticsCard on the Publishing Center.
 */
export const getXPublishStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabase, userId } = context;

      const [profRes, acctRes] = await Promise.all([
        supabase.from("profiles").select("plan").eq("user_id", userId).maybeSingle(),
        supabase
          .from("social_accounts")
          .select("platform_username, token_expires_at")
          .eq("user_id", userId)
          .eq("platform", "twitter")
          .maybeSingle(),
      ]);

      const plan = (profRes.data?.plan || "free") as "free" | "pro" | "agency";
      const isPaid = plan === "pro" || plan === "agency";

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [publishedRes, scheduledRes, failedRes, recentRes] = await Promise.all([
        supabase
          .from("scheduled_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("platform", "twitter")
          .eq("status", "published")
          .gte("published_at", startOfMonth.toISOString()),
        supabase
          .from("scheduled_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("platform", "twitter")
          .eq("status", "scheduled"),
        supabase
          .from("scheduled_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("platform", "twitter")
          .eq("status", "failed"),
        supabase
          .from("scheduled_posts")
          .select("id, title, content, status, scheduled_for, published_at, platform_post_id, media_url, publish_error")
          .eq("user_id", userId)
          .eq("platform", "twitter")
          .order("scheduled_for", { ascending: false })
          .limit(10),
      ]);

      const monthlyPublished = publishedRes.count ?? 0;
      const monthlyLimit = isPaid ? null : 5;
      const remaining = monthlyLimit == null ? null : Math.max(0, monthlyLimit - monthlyPublished);

      // Rough spend estimate: $0.015/post + $0.20 per post that contains a URL.
      const urlRe = /https?:\/\//i;
      const recent = recentRes.data || [];
      let estimatedSpend = 0;
      for (const r of recent as any[]) {
        if (r.status !== "published") continue;
        estimatedSpend += urlRe.test(r.content || "") ? 0.2 : 0.015;
      }

      return {
        connected: !!acctRes.data,
        username: acctRes.data?.platform_username || null,
        tier: plan,
        monthlyPublished,
        monthlyLimit,
        remaining,
        scheduledCount: scheduledRes.count ?? 0,
        failedCount: failedRes.count ?? 0,
        recent,
        estimatedSpend: Math.round(estimatedSpend * 100) / 100,
      };
    } catch (e: any) {
      console.error("[getXPublishStats] error:", e);
      return {
        connected: false,
        username: null,
        tier: "free" as const,
        monthlyPublished: 0,
        monthlyLimit: 5,
        remaining: 5,
        scheduledCount: 0,
        failedCount: 0,
        recent: [] as any[],
        estimatedSpend: 0,
      };
    }
  });

/**
 * Split long-form content into a numbered X thread using Claude.
 * Returns an array of ≤280-char tweet segments.
 */
export const generateXThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(50).max(20000),
      maxTweets: z.number().int().min(2).max(25).default(10),
    }).parse,
  )
  .handler(async ({ data }) => {
    try {
      const { callClaude } = await import("@/lib/anthropic.server");
      const system =
        "You split long-form content into an engaging X (Twitter) thread. Rules: each tweet <= 270 chars (leave room for numbering). Preserve the author's voice. Never truncate mid-sentence. Return ONLY a JSON array of strings, no prose.";
      const user = `Split this into at most ${data.maxTweets} tweets. First tweet must be a strong hook. Do NOT add numbering yourself — plain tweet text only.\n\n---\n${data.text}\n---`;
      const res = await callClaude({ systemPrompt: system, userPrompt: user, maxTokens: 2000 });
      if (res.error) return { error: res.error };
      // Extract JSON array
      const match = res.text.match(/\[[\s\S]*\]/);
      let tweets: string[] = [];
      if (match) {
        try {
          tweets = JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
      if (!Array.isArray(tweets) || tweets.length === 0) {
        // Naive fallback: split on paragraphs and hard-cap 270 chars.
        tweets = data.text
          .split(/\n{2,}/)
          .flatMap((p) => p.match(/[\s\S]{1,270}(\s|$)/g) || [])
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, data.maxTweets);
      }
      // Clamp + number
      const total = tweets.length;
      const numbered = tweets.map((t, i) => {
        const suffix = ` ${i + 1}/${total}`;
        const room = 280 - suffix.length;
        const base = String(t).trim().slice(0, room);
        return `${base}${suffix}`;
      });
      return { tweets: numbered };
    } catch (e: any) {
      console.error("[generateXThread] error:", e);
      return { error: e?.message || "Could not generate thread" };
    }
  });

/**
 * Publish a full thread by chaining publishToX calls.
 * Each subsequent tweet replies to the previous one.
 */
export const publishXThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      tweets: z.array(z.string().min(1).max(280)).min(2).max(25),
      mediaUrls: z.array(z.string().url()).max(4).default([]),
      altTexts: z.array(z.string().max(1000)).max(4).default([]),
      repurposeJobId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      // Plan gating: threads are a Pro feature (chain of paid API calls).
      const { data: prof } = await supabase.from("profiles").select("plan").eq("user_id", userId).maybeSingle();
      const plan = (prof?.plan || "free") as string;
      if (plan !== "pro" && plan !== "agency") {
        return { error: "Auto-thread publishing is a Pro feature. Upgrade to post threads." };
      }

      const { accessToken, error: refreshErr } = await refreshXTokenIfNeeded(supabase, userId);
      if (!accessToken) return { error: refreshErr || "X not connected" };

      const { data: acctRow } = await supabase
        .from("social_accounts")
        .select("platform_username")
        .eq("user_id", userId)
        .eq("platform", "twitter")
        .maybeSingle();
      const uname = (acctRow?.platform_username || "i").replace(/^@/, "");

      // Upload media (attached to the FIRST tweet only).
      const mediaIds: string[] = [];
      for (let i = 0; i < data.mediaUrls.length; i++) {
        const r = await fetch(data.mediaUrls[i]);
        if (!r.ok) return { error: `Could not fetch media ${i + 1}` };
        const buf = await r.arrayBuffer();
        const mimeType = r.headers.get("content-type") || "image/jpeg";
        const up = await uploadMediaToX(accessToken, buf, mimeType);
        if (up.error || !up.mediaId) return { error: up.error || "X media upload failed" };
        mediaIds.push(up.mediaId);
        const alt = (data.altTexts?.[i] || "").trim();
        if (alt) {
          try {
            await fetch("https://api.x.com/2/media/metadata", {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ id: up.mediaId, metadata: { alt_text: { text: alt.slice(0, 1000) } } }),
            });
          } catch {
            /* non-fatal */
          }
        }
      }

      const postedIds: string[] = [];
      let replyTo: string | undefined;
      for (let i = 0; i < data.tweets.length; i++) {
        const body: any = { text: data.tweets[i].slice(0, 280) };
        if (i === 0 && mediaIds.length) body.media = { media_ids: mediaIds };
        if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };
        const r = await fetch("https://api.x.com/2/tweets", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j: any = await r.json().catch(() => ({}));
        if (!r.ok) {
          return {
            error: `Tweet ${i + 1}/${data.tweets.length} failed: ${j?.detail || j?.title || r.status}`,
            postedIds,
          };
        }
        const id = j?.data?.id as string;
        postedIds.push(id);
        replyTo = id;
      }

      // Log the head tweet only (thread head is what users share).
      const headUrl = postedIds[0] ? `https://x.com/${uname}/status/${postedIds[0]}` : null;
      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "twitter",
        status: "published",
        published_at: new Date().toISOString(),
        content: data.tweets.join("\n\n"),
        title: `Thread · ${data.tweets.length} tweets`,
        platform_post_id: postedIds[0],
        media_url: headUrl,
        media_type: mediaIds.length ? "image" : null,
        repurpose_job_id: data.repurposeJobId,
        scheduled_for: new Date().toISOString(),
        tool: "x_thread",
      } as any);

      return { ok: true, postedIds, url: headUrl };
    } catch (e: any) {
      console.error("[publishXThread] error:", e);
      return { error: e?.message || "Failed to publish thread" };
    }
  });

/**
 * Best-time-to-post suggestions. Uses the user's own post_metrics when
 * available (top-performing weekday × hour slots), otherwise falls back
 * to platform-wide defaults.
 */
export const getBestPostingTimes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      platform: z.enum(["twitter", "linkedin", "tiktok", "youtube"]).default("twitter"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      // Pull last 90 days of published posts on this platform + their metrics.
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: posts } = await supabase
        .from("scheduled_posts")
        .select("id, published_at, platform_post_id")
        .eq("user_id", userId)
        .eq("platform", data.platform)
        .eq("status", "published")
        .gte("published_at", since);

      const ids = (posts || []).map((p: any) => p.platform_post_id).filter(Boolean);
      let metrics: any[] = [];
      if (ids.length) {
        const { data: m } = await supabase
          .from("post_metrics")
          .select("platform_post_id, engagement_score, likes, replies, reposts")
          .in("platform_post_id", ids);
        metrics = m || [];
      }
      const scoreById = new Map<string, number>(
        metrics.map((m: any) => [
          m.platform_post_id,
          Number(m.engagement_score) ||
            (Number(m.likes) || 0) + 2 * (Number(m.replies) || 0) + 3 * (Number(m.reposts) || 0),
        ]),
      );

      // Bucket by (weekday, hour) → sum of scores.
      const buckets = new Map<string, { day: number; hour: number; score: number; count: number }>();
      for (const p of posts || []) {
        if (!p.published_at) continue;
        const d = new Date(p.published_at as string);
        const day = d.getUTCDay();
        const hour = d.getUTCHours();
        const key = `${day}-${hour}`;
        const s = scoreById.get(p.platform_post_id as string) ?? 1;
        const cur = buckets.get(key) || { day, hour, score: 0, count: 0 };
        cur.score += s;
        cur.count += 1;
        buckets.set(key, cur);
      }

      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const defaults: Record<string, Array<{ day: number; hour: number; label: string }>> = {
        twitter: [
          { day: 2, hour: 13, label: "Tue 1pm — peak engagement on X" },
          { day: 3, hour: 9, label: "Wed 9am — commute reading window" },
          { day: 4, hour: 17, label: "Thu 5pm — end-of-day scroll" },
        ],
        linkedin: [
          { day: 2, hour: 8, label: "Tue 8am — before the workday" },
          { day: 3, hour: 12, label: "Wed 12pm — lunch scroll" },
          { day: 4, hour: 16, label: "Thu 4pm — pre-close of day" },
        ],
        tiktok: [
          { day: 2, hour: 20, label: "Tue 8pm — prime evening scroll" },
          { day: 4, hour: 21, label: "Thu 9pm — algorithm sweet spot" },
          { day: 5, hour: 19, label: "Fri 7pm — weekend build-up" },
        ],
        youtube: [
          { day: 4, hour: 15, label: "Thu 3pm — pre-weekend upload" },
          { day: 6, hour: 10, label: "Sat 10am — weekend watch time" },
          { day: 0, hour: 11, label: "Sun 11am — leisure viewing" },
        ],
      };

      const top = [...buckets.values()]
        .filter((b) => b.count >= 2)
        .sort((a, b) => b.score / b.count - a.score / a.count)
        .slice(0, 3)
        .map((b) => ({
          day: b.day,
          hour: b.hour,
          label: `${DAYS[b.day]} ${b.hour % 12 || 12}${b.hour < 12 ? "am" : "pm"} — your best slot (${b.count} posts)`,
          source: "personal" as const,
        }));

      const source: "personal" | "default" = top.length ? "personal" : "default";
      const suggestions = top.length
        ? top
        : (defaults[data.platform] || defaults.twitter).map((s) => ({ ...s, source: "default" as const }));

      return { source, suggestions };
    } catch (e: any) {
      console.error("[getBestPostingTimes] error:", e);
      return { source: "default" as const, suggestions: [] as any[] };
    }
  });
