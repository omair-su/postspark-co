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
  .inputValidator(z.object({ platform: z.enum(["youtube", "tiktok", "linkedin"]) }).parse)
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
