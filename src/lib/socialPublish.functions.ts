import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHmac } from "crypto";

const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

function getRedirectUri() {
  // Public OAuth callback. Override per-env via PUBLIC_BASE_URL if needed.
  const base = process.env.PUBLIC_BASE_URL || "https://postspark.co";
  return `${base.replace(/\/$/, "")}/api/public/oauth/youtube/callback`;
}

function signState(payload: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-state-secret";
  return createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
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
    const { data } = await context.supabase
      .from("social_accounts")
      .select("platform, platform_username, token_expires_at")
      .eq("user_id", context.userId);
    return { accounts: data || [] };
  });

export const disconnectSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ platform: z.enum(["youtube", "tiktok"]) }).parse)
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
export function verifyOAuthState(state: string): { userId: string } | null {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [uid, ts, nonce, sig] = parts;
  const payload = `${uid}.${ts}.${nonce}`;
  const expected = signState(payload);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) return null;
  return { userId: uid };
}
