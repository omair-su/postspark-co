import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getCorrectedCanonicalUrl, getSafePublicBaseUrl } from "@/lib/siteUrls";
const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

function getRedirectUri() {
  const base = getSafePublicBaseUrl();
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
    const sig = await signState(payload);
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
  const base = getSafePublicBaseUrl();
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
  const base = getSafePublicBaseUrl();
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
 * Supports text, single image, multi-image (up to 9), video, PDF document
 * and article/link posts, plus scheduling and an optional first comment.
 */
const LI_MEDIA_ITEM = z.object({
  /** Either a storage path inside the private post-media bucket… */
  path: z.string().max(300).optional(),
  /** …or a directly reachable URL. */
  url: z.string().url().optional(),
  altText: z.string().max(300).optional(),
  title: z.string().max(200).optional(),
});

export const publishToLinkedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      commentary: z.string().min(1).max(3000),
      visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
      /** New structured media input */
      mediaKind: z.enum(["none", "images", "video", "document", "article"]).default("none"),
      mediaItems: z.array(LI_MEDIA_ITEM).max(9).default([]),
      /** Legacy single-image / link inputs (still used by PostToLinkedInButton) */
      mediaUrl: z.string().url().optional(),
      mediaTitle: z.string().max(200).optional(),
      mediaAltText: z.string().max(300).optional(),
      linkUrl: z.string().url().optional(),
      firstComment: z.string().max(1250).optional(),
      /** ISO timestamp — when set with status "scheduled", queue it instead. */
      scheduledFor: z.string().optional(),
      status: z.enum(["published", "draft", "scheduled"]).default("published"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const {
      uploadLinkedInImage,
      uploadLinkedInVideo,
      uploadLinkedInDocument,
      commentOnLinkedInPost,
      linkedInHeaders,
      humanizeLinkedInError,
      isLinkedInError,
    } = await import("@/lib/linkedinMedia.server");
    const { POST_MEDIA_BUCKET } = await import("@/lib/media.functions");

    // Normalize legacy inputs into the structured shape
    let mediaKind = data.mediaKind;
    let mediaItems = [...data.mediaItems];
    if (mediaKind === "none") {
      if (data.mediaUrl) {
        mediaKind = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(data.mediaUrl)
          ? "video"
          : /\.pdf(\?|$)/i.test(data.mediaUrl)
            ? "document"
            : "images";
        mediaItems = [{ url: data.mediaUrl, altText: data.mediaAltText, title: data.mediaTitle }];
      } else if (data.linkUrl) {
        mediaKind = "article";
        mediaItems = [{ url: data.linkUrl, title: data.mediaTitle }];
      }
    }

    const mediaUrlsForRow = mediaItems.map((m) => m.path || m.url).filter(Boolean) as string[];

    // Draft / scheduled: persist only, the cron worker publishes later
    if (data.status === "draft" || data.status === "scheduled") {
      const when =
        data.status === "scheduled" && data.scheduledFor
          ? new Date(data.scheduledFor).toISOString()
          : new Date().toISOString();
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "linkedin",
        status: data.status === "scheduled" ? "scheduled" : "draft",
        title: data.commentary.slice(0, 80),
        content: data.commentary.slice(0, 3000),
        media_url: mediaUrlsForRow[0] || null,
        media_urls: mediaUrlsForRow,
        media_type: mediaKind,
        first_comment: data.firstComment || null,
        scheduled_for: when,
      } as any);
      if (error) return { error: error.message };
      return { ok: true, draft: data.status === "draft", scheduled: data.status === "scheduled" };
    }

    const { data: acct } = await supabase
      .from("social_accounts")
      .select("access_token, token_expires_at, platform_user_id, platform_username")
      .eq("user_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();
    if (!acct?.access_token) return { error: "LinkedIn not connected. Connect in Settings first." };
    if (acct.token_expires_at && new Date(acct.token_expires_at) < new Date()) {
      return { error: "LinkedIn access expired. Please reconnect in Settings → Integrations." };
    }
    if (!acct.platform_user_id) return { error: "LinkedIn member id missing. Please reconnect." };

    const token = acct.access_token;
    const authorUrn = acct.platform_user_id.startsWith("urn:")
      ? acct.platform_user_id
      : `urn:li:person:${acct.platform_user_id}`;
    const headers = linkedInHeaders(token);

    // Resolve each media item to raw bytes (storage download or remote fetch)
    async function readBytes(item: { path?: string; url?: string }): Promise<ArrayBuffer | null> {
      if (item.path) {
        const { data: blob, error } = await supabase.storage.from(POST_MEDIA_BUCKET).download(item.path);
        if (error || !blob) return null;
        return await blob.arrayBuffer();
      }
      if (item.url) {
        const res = await fetch(item.url);
        if (!res.ok) return null;
        return await res.arrayBuffer();
      }
      return null;
    }

    let content: any = undefined;

    if (mediaKind === "images" && mediaItems.length > 0) {
      const urns: { id: string; altText: string }[] = [];
      for (const item of mediaItems.slice(0, 9)) {
        const bytes = await readBytes(item);
        if (!bytes) return { error: "Could not read one of the images. Try re-uploading it." };
        const up = await uploadLinkedInImage(token, authorUrn, bytes);
        if (isLinkedInError(up)) return { error: up.error };
        urns.push({ id: up.urn, altText: item.altText || "" });
      }
      content =
        urns.length === 1
          ? { media: { id: urns[0].id, altText: urns[0].altText } }
          : { multiImage: { images: urns } };
    } else if (mediaKind === "video" && mediaItems[0]) {
      const bytes = await readBytes(mediaItems[0]);
      if (!bytes) return { error: "Could not read the video file. Try re-uploading it." };
      const up = await uploadLinkedInVideo(token, authorUrn, bytes);
      if (isLinkedInError(up)) return { error: up.error };
      content = { media: { id: up.urn, title: mediaItems[0].title || "Video" } };
    } else if (mediaKind === "document" && mediaItems[0]) {
      const bytes = await readBytes(mediaItems[0]);
      if (!bytes) return { error: "Could not read the PDF. Try re-uploading it." };
      const up = await uploadLinkedInDocument(token, authorUrn, bytes);
      if (isLinkedInError(up)) return { error: up.error };
      content = { media: { id: up.urn, title: mediaItems[0].title || "Document" } };
    } else if (mediaKind === "article" && mediaItems[0]?.url) {
      content = {
        article: {
          source: mediaItems[0].url,
          title: mediaItems[0].title || "",
          description: mediaItems[0].altText || "",
        },
      };
    }

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
      return { error: humanizeLinkedInError(postRes.status, txt) };
    }
    const postId = postRes.headers.get("x-restli-id") || postRes.headers.get("x-linkedin-id") || null;
    const postUrl = postId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/` : null;

    let firstCommentError: string | null = null;
    if (data.firstComment?.trim() && postId) {
      const c = await commentOnLinkedInPost(token, authorUrn, postId, data.firstComment.trim());
      if (isLinkedInError(c)) firstCommentError = c.error;
    }


    await supabase.from("scheduled_posts").insert({
      user_id: userId,
      platform: "linkedin",
      status: "published",
      published_at: new Date().toISOString(),
      title: data.commentary.slice(0, 80),
      content: data.commentary.slice(0, 3000),
      platform_post_id: postId,
      media_url: postUrl || mediaUrlsForRow[0] || null,
      media_urls: mediaUrlsForRow,
      media_type: mediaKind,
      first_comment: data.firstComment || null,
      scheduled_for: new Date().toISOString(),
    } as any);

    return { ok: true, postId, url: postUrl, firstCommentError };

  });

// ============================================================================
// X (Twitter) OAuth 2.0 with PKCE + Direct posting
// ============================================================================

const X_REQUIRED_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"] as const;
const X_SCOPES = X_REQUIRED_SCOPES.join(" ");
const X_PERMISSION_DENIED_MESSAGE =
  "Your X account is connected but does not currently have write permission. Please reconnect X and grant posting access.";
const X_RECONNECT_INSTRUCTIONS =
  "X permission denied. Please go to Settings -> Integrations, disconnect X, and reconnect your account to grant write permissions.";
const X_RECONNECT_ERROR = `${X_PERMISSION_DENIED_MESSAGE} ${X_RECONNECT_INSTRUCTIONS}`;
const FREE_X_MONTHLY_LIMIT = 5;

function getXRedirectUri() {
  const explicit = getCorrectedCanonicalUrl(process.env.X_REDIRECT_URI);
  if (explicit) return explicit;
  const base = getSafePublicBaseUrl();
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
  const message = getXProviderMessage(status, body);
  const code = getXProviderCode(body);
  return status === 403 || code === "261" || /not permitted|permission denied|forbidden/i.test(message);
}

async function logXPublishAttempt(
  supabase: any,
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
      action: args.action || "publish_tweet",
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
    console.warn("[x] publish log skipped", error);
  }
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

export const getXAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const clientId = process.env.X_CLIENT_ID;
      if (!clientId) return { error: "X integration not configured (missing X_CLIENT_ID)." };
      const verifierBytes = new Uint8Array(48);
      crypto.getRandomValues(verifierBytes);
      const codeVerifier = b64url(verifierBytes);
      const codeChallenge = await sha256b64url(codeVerifier);
      const state = await signXState(context.userId, Date.now(), codeVerifier);
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

async function refreshXTokenIfNeeded(
  supabase: any,
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
    console.error("X refresh failed", r.status, txt);
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

async function uploadMediaToX(
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
    return { error: `X media INIT failed (${initRes.status}): ${txt.slice(0, 200)}` };
  }
  const initJson: any = await initRes.json();
  const mediaId = initJson?.data?.id || initJson?.media_id_string;
  if (!mediaId) return { error: "X media INIT: no media_id" };

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
  let info = finJson?.data?.processing_info || finJson?.processing_info;
  let tries = 0;
  while (info && info.state && info.state !== "succeeded" && tries < 20) {
    if (info.state === "failed") return { error: `X media processing failed: ${info?.error?.message || "unknown"}` };
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

async function publishXBody(
  supabase: any,
  userId: string,
  args: { body: any; text: string; scheduledPostId?: string | null; action?: string },
) {
  const token = await refreshXTokenIfNeeded(supabase, userId);
  if (token.error || !token.accessToken) {
    return { error: token.error === "NOT_CONNECTED" ? "X not connected. Connect in Settings." : token.error, code: token.code };
  }

  let postResult = await postTweetWithToken(token.accessToken, args.body);
  if (!postResult.ok && postResult.status === 401) {
    const refreshed = await refreshXTokenIfNeeded(supabase, userId, { force: true, validateScopes: false });
    if (refreshed.accessToken) postResult = await postTweetWithToken(refreshed.accessToken, args.body);
  }

  if (!postResult.ok) {
    const denied = isXPermissionDenied(postResult.status, postResult.json);
    const error = denied ? X_RECONNECT_ERROR : getXProviderMessage(postResult.status, postResult.json);
    await logXPublishAttempt(supabase, userId, {
      status: "failed",
      action: args.action,
      text: args.text,
      scheduledPostId: args.scheduledPostId,
      responseStatus: postResult.status,
      responseBody: postResult.json,
      errorMessage: error,
    });
    return { error, code: denied ? "X_PERMISSION_DENIED" : getXProviderCode(postResult.json) || "X_PUBLISH_FAILED" };
  }

  const tweetId = postResult.json?.data?.id as string | undefined;
  await logXPublishAttempt(supabase, userId, {
    status: "success",
    action: args.action,
    text: args.text,
    scheduledPostId: args.scheduledPostId,
    responseStatus: postResult.status,
    responseBody: postResult.json,
    tweetId: tweetId || null,
  });
  return { tweetId };
}

export const publishToX = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(4000),
      mediaUrls: z.array(z.string().url()).max(4).default([]),
      inReplyToTweetId: z.string().max(40).optional(),
      repurposeJobId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      if (!data.inReplyToTweetId) {
        const gate = await checkFreeTierXLimit(supabase, userId);
        if (gate.blocked) {
          return {
            error: `Free plan limit reached (${gate.used}/${gate.limit} X posts this month). Upgrade to Pro for unlimited posting.`,
            code: "LIMIT_REACHED",
          };
        }
      }

      const token = await refreshXTokenIfNeeded(supabase, userId);
      if (token.error || !token.accessToken) {
        return { error: token.error === "NOT_CONNECTED" ? "X not connected. Connect in Settings." : token.error, code: token.code };
      }

      const mediaIds: string[] = [];
      for (const url of data.mediaUrls) {
        const r = await fetch(url);
        if (!r.ok) return { error: `Could not fetch media at ${url.slice(0, 80)}` };
        const buf = await r.arrayBuffer();
        const mimeType = r.headers.get("content-type") || "image/jpeg";
        if (buf.byteLength > 15 * 1024 * 1024) return { error: "Media exceeds 15MB limit" };
        const up = await uploadMediaToX(token.accessToken, buf, mimeType);
        if (up.error || !up.mediaId) return { error: up.error || "X media upload failed" };
        mediaIds.push(up.mediaId);
      }

      const body: any = { text: data.text.slice(0, 4000) };
      if (mediaIds.length) body.media = { media_ids: mediaIds };
      if (data.inReplyToTweetId) body.reply = { in_reply_to_tweet_id: data.inReplyToTweetId };

      const out = await publishXBody(supabase, userId, { body, text: data.text });
      if (out.error || !out.tweetId) return out.error ? out : { error: "X publish failed" };

      const { data: acctRow } = await supabase
        .from("social_accounts")
        .select("platform_username")
        .eq("user_id", userId)
        .eq("platform", "twitter")
        .maybeSingle();
      const uname = (acctRow?.platform_username || "i").replace(/^@/, "");
      const tweetUrl = `https://x.com/${uname}/status/${out.tweetId}`;

      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "twitter",
        status: "published",
        published_at: new Date().toISOString(),
        content: data.text.slice(0, 3000),
        title: data.text.slice(0, 80),
        platform_post_id: out.tweetId,
        media_url: tweetUrl || data.mediaUrls[0] || null,
        media_type: data.mediaUrls[0] ? "image" : null,
        repurpose_job_id: data.repurposeJobId,
        scheduled_for: new Date().toISOString(),
      } as any);

      return { ok: true, tweetId: out.tweetId, url: tweetUrl };
    } catch (e: any) {
      console.error("[publishToX] error:", e);
      return { error: e?.message || "Failed to publish to X" };
    }
  });

async function checkFreeTierXLimit(
  supabase: any,
  userId: string,
): Promise<{ blocked: boolean; used: number; limit: number; plan: string }> {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", userId).maybeSingle();
  const plan = profile?.plan || "free";
  if (plan === "pro" || plan === "agency") return { blocked: false, used: 0, limit: -1, plan };
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("platform", "twitter")
    .in("status", ["scheduled", "publishing", "published"])
    .gte("created_at", startOfMonth.toISOString());
  const used = count ?? 0;
  return { blocked: used >= FREE_X_MONTHLY_LIMIT, used, limit: FREE_X_MONTHLY_LIMIT, plan };
}

export const getXUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => checkFreeTierXLimit(context.supabase, context.userId));

export const getXIntegrationDebug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: account } = await context.supabase
      .from("social_accounts")
      .select("platform_username, platform_user_id, scopes, token_expires_at, updated_at")
      .eq("user_id", context.userId)
      .eq("platform", "twitter")
      .maybeSingle();
    const { data: lastLog } = await context.supabase
      .from("publishing_logs")
      .select("action, status, error_message, response_payload, created_at")
      .eq("user_id", context.userId)
      .eq("platform", "twitter")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const missingScopes = getMissingXScopes(account?.scopes);
    return {
      connected: !!account,
      username: account?.platform_username || null,
      accountId: account?.platform_user_id || null,
      scopes: splitOAuthScopes(account?.scopes),
      missingScopes,
      scopeStatus: account ? (missingScopes.length ? "missing" : "ok") : "not_connected",
      tokenExpiresAt: account?.token_expires_at || null,
      connectionUpdatedAt: account?.updated_at || null,
      lastPublishAttempt: lastLog || null,
      lastApiResponse: (lastLog?.response_payload as any) || null,
      lastErrorCode: getXProviderCode((lastLog?.response_payload as any)?.body),
      lastErrorMessage: lastLog?.error_message || null,
    };
  });

export const testXPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const text = `PostSpark X connection test — ${new Date().toISOString().slice(0, 16)} UTC`;
    const out = await publishXBody(supabase, userId, { body: { text }, text, action: "test_publish_tweet" });
    if (out.error || !out.tweetId) return out.error ? out : { error: "X test publish failed" };
    const { data: acctRow } = await supabase
      .from("social_accounts")
      .select("platform_username")
      .eq("user_id", userId)
      .eq("platform", "twitter")
      .maybeSingle();
    const username = (acctRow?.platform_username || "i").replace(/^@/, "");
    const url = `https://x.com/${username}/status/${out.tweetId}`;
    await supabase.from("scheduled_posts").insert({
      user_id: userId,
      platform: "twitter",
      status: "published",
      published_at: new Date().toISOString(),
      content: text,
      title: "X connection test",
      platform_post_id: out.tweetId,
      media_url: url,
      scheduled_for: new Date().toISOString(),
      tool: "x_test_publish",
    } as any);
    return { ok: true, tweetId: out.tweetId, url };
  });

export const scheduleXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(4000),
      replyText: z.string().min(1).max(4000).optional(),
      mediaUrls: z.array(z.string().url()).max(4).default([]),
      scheduledFor: z.string().datetime(),
      repurposeJobId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const gate = await checkFreeTierXLimit(supabase, userId);
      if (gate.blocked) {
        return {
          error: `Free plan limit reached (${gate.used}/${gate.limit} X posts this month). Upgrade to Pro for unlimited scheduling.`,
          code: "LIMIT_REACHED",
        };
      }

      const { data: inserted, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: userId,
          platform: "twitter",
          status: "scheduled",
          content: data.text.slice(0, 4000),
          reply_text: data.replyText ? data.replyText.slice(0, 4000) : null,
          title: data.text.slice(0, 80),
          media_url: data.mediaUrls[0] || null,
          media_urls: data.mediaUrls.length ? data.mediaUrls : null,
          media_type: data.mediaUrls[0] ? "image" : null,
          scheduled_for: data.scheduledFor,
          repurpose_job_id: data.repurposeJobId,
          tool: "x_publish",
        } as any)
        .select()
        .single();
      if (error) return { error: error.message };
      return { ok: true, post: inserted };
    } catch (e: any) {
      console.error("[scheduleXPost] error:", e);
      return { error: e?.message || "Failed to schedule X post" };
    }
  });

export const deleteXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tweetId: z.string().min(1).max(40) }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const token = await refreshXTokenIfNeeded(supabase, userId, { validateScopes: false });
      if (token.error || !token.accessToken) return { error: token.error || "Not connected", code: token.code };
      const r = await fetch(`https://api.x.com/2/tweets/${encodeURIComponent(data.tweetId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token.accessToken}` },
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

export const cancelScheduledXPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { error } = await context.supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .eq("platform", "twitter")
        .in("status", ["scheduled", "failed"]);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { error: e?.message || "Failed to cancel" };
    }
  });

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
      const when = data.scheduledFor || new Date(Date.now() + 60_000).toISOString();
      const { error } = await context.supabase
        .from("scheduled_posts")
        .update({ status: "scheduled", scheduled_for: when, publish_error: null })
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .eq("platform", "twitter")
        .in("status", ["failed", "publishing"]);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { error: e?.message || "Failed to retry" };
    }
  });
