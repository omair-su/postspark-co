/**
 * Meta (Facebook / Instagram / Threads) publishing server functions.
 *
 * All OAuth/token/publishing logic lives here. The browser only ever calls
 * these server functions — access tokens NEVER leave the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CANONICAL_SITE_URL, getSafeExplicitUrl, getSafePublicBaseUrl } from "@/lib/siteUrls";

const META_GRAPH_VERSION = "v25.0";
const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const META_CANONICAL_BASE_URL = CANONICAL_SITE_URL;
const META_CALLBACK_PATH = "/auth/facebook/callback";
const META_CANONICAL_REDIRECT_URI = `${META_CANONICAL_BASE_URL}${META_CALLBACK_PATH}`;

const FB_SCOPES = [
  "public_profile",
  "email",
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

function readMetaRedirectUriConfig() {
  const explicitRedirectUri = getSafeExplicitUrl(process.env.META_OAUTH_REDIRECT_URI || process.env.META_REDIRECT_URI);

  if (explicitRedirectUri) {
    return {
      redirectUri: explicitRedirectUri,
      source: process.env.META_OAUTH_REDIRECT_URI ? "META_OAUTH_REDIRECT_URI" : "META_REDIRECT_URI",
    };
  }

  return {
    redirectUri: META_CANONICAL_REDIRECT_URI,
    source: "canonical postspark.co callback",
  };
}

function getMetaRedirectUri() {
  return readMetaRedirectUriConfig().redirectUri;
}

function getReturnBaseUrl() {
  return getSafePublicBaseUrl().replace(/\/$/, "");
}

function safeUrlParts(value: string) {
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol.replace(":", ""),
      host: url.host,
      hostname: url.hostname,
      pathname: url.pathname,
      hasWww: url.hostname.startsWith("www."),
      hasTrailingSlash: url.pathname.endsWith("/") && url.pathname !== "/",
    };
  } catch {
    return {
      protocol: "invalid",
      host: "invalid",
      hostname: "invalid",
      pathname: "invalid",
      hasWww: false,
      hasTrailingSlash: false,
    };
  }
}

function buildMetaOAuthDiagnostics(appId: string | undefined, state: string) {
  const config = readMetaRedirectUriConfig();
  const redirectUri = config.redirectUri;
  const oauthUrl = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
  oauthUrl.searchParams.set("client_id", appId || "META_APP_ID_NOT_SET");
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("response_type", "code");
  oauthUrl.searchParams.set("scope", FB_SCOPES);
  oauthUrl.searchParams.set("state", state);

  const actual = safeUrlParts(redirectUri);
  const expected = safeUrlParts(META_CANONICAL_REDIRECT_URI);
  const checks = {
    exactMatchToConfiguredMetaRedirect: redirectUri === META_CANONICAL_REDIRECT_URI,
    protocolMatches: actual.protocol === expected.protocol,
    hostMatches: actual.host === expected.host,
    pathMatches: actual.pathname === expected.pathname,
    wwwMatches: actual.hasWww === expected.hasWww,
    trailingSlashMatches: actual.hasTrailingSlash === expected.hasTrailingSlash,
    usesManagedAuthCallback: false,
    usesCustomCallback: actual.pathname === META_CALLBACK_PATH,
  };

  return {
    facebookAppId: appId || "META_APP_ID is not set",
    oauthUrl: oauthUrl.toString(),
    redirectUri,
    configuredMetaRedirectUri: META_CANONICAL_REDIRECT_URI,
    callbackUri: redirectUri,
    managedAuthCallbackUri: "Not used — Facebook is handled by the custom PostSpark callback route.",
    authProvider: "Custom Meta Graph OAuth",
    currentEnvironment: {
      graphApiVersion: META_GRAPH_VERSION,
      redirectUriSource: config.source,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || "not set",
      returnBaseUrl: getReturnBaseUrl(),
      explicitRedirectUriConfigured: Boolean(process.env.META_OAUTH_REDIRECT_URI || process.env.META_REDIRECT_URI),
    },
    checks,
    actualRedirectParts: actual,
    expectedRedirectParts: expected,
    scopes: FB_SCOPES.split(","),
  };
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

export async function verifyMetaOAuthState(state: string): Promise<{ userId: string } | null> {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [uid, ts, nonce, sig] = parts;
  const payload = `${uid}.${ts}.${nonce}`;
  const expected = await signState(payload);
  if (sig !== expected) return null;
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) return null;
  return { userId: uid };
}

/**
 * Kicks off the Facebook OAuth flow. Returns the URL to redirect the user to.
 */
export const getMetaAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const appId = process.env.META_APP_ID;
      if (!appId) {
        return {
          error:
            "Meta integration not configured yet — the workspace admin needs to add META_APP_ID and META_APP_SECRET.",
        };
      }
      const ts = Date.now();
      const nonce = Math.random().toString(36).slice(2, 10);
      const payload = `${context.userId}.${ts}.${nonce}`;
      const sig = await signState(payload);
      const state = `${payload}.${sig}`;

      const diagnostics = buildMetaOAuthDiagnostics(appId, state);
      console.info("[meta-oauth] complete OAuth URL before redirect", diagnostics.oauthUrl);
      console.info("[meta-oauth] redirect_uri", diagnostics.redirectUri);
      console.info("[meta-oauth] redirect checks", diagnostics.checks);
      return { url: diagnostics.oauthUrl, diagnostics };
    } catch (e: any) {
      console.error("[getMetaAuthUrl] error", e);
      return { error: e?.message || "Failed to build Meta auth URL" };
    }
  });

export const getFacebookAuthDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  const diagnostics = buildMetaOAuthDiagnostics(process.env.META_APP_ID, "debug_state_not_for_login");
  console.info("[meta-oauth-diagnostics] complete OAuth URL", diagnostics.oauthUrl);
  console.info("[meta-oauth-diagnostics] redirect_uri", diagnostics.redirectUri);
  console.info("[meta-oauth-diagnostics] checks", diagnostics.checks);
  return diagnostics;
});

/**
 * Exchange a code from the OAuth callback for a long-lived user access token,
 * then fetch and store the user's Pages + linked Instagram accounts.
 * Called from the /auth/facebook/callback server route.
 */
export async function completeMetaOAuth(
  code: string,
  userId: string,
): Promise<{ ok: boolean; error?: string; pageCount?: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    console.error("[meta] OAuth callback failed: Meta app not configured", {
      hasAppId: Boolean(appId),
      hasAppSecret: Boolean(appSecret),
      redirectUri: getMetaRedirectUri(),
    });
    return { ok: false, error: "Meta app not configured" };
  }

  // 1) Exchange code -> short-lived token
  const tokenUrl = new URL(`${META_GRAPH}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", getMetaRedirectUri());
  tokenUrl.searchParams.set("code", code);
  const tRes = await fetch(tokenUrl.toString());
  if (!tRes.ok) {
    const txt = await tRes.text();
    console.error("[meta] token exchange failed", tRes.status, txt);
    return { ok: false, error: `Token exchange failed (${tRes.status})` };
  }
  const tJson: any = await tRes.json();
  const shortToken = tJson.access_token as string;
  if (!shortToken) {
    console.error("[meta] token exchange response did not include access_token", tJson);
    return { ok: false, error: "No access_token from Meta" };
  }

  // 2) Exchange short-lived -> long-lived (~60 days)
  const llUrl = new URL(`${META_GRAPH}/oauth/access_token`);
  llUrl.searchParams.set("grant_type", "fb_exchange_token");
  llUrl.searchParams.set("client_id", appId);
  llUrl.searchParams.set("client_secret", appSecret);
  llUrl.searchParams.set("fb_exchange_token", shortToken);
  const llRes = await fetch(llUrl.toString());
  const llJson: any = llRes.ok ? await llRes.json() : { access_token: shortToken };
  const longToken = llJson.access_token as string;
  const expiresIn = (llJson.expires_in as number) || 60 * 24 * 60 * 60;

  // 3) Fetch profile
  const meRes = await fetch(
    `${META_GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(longToken)}`,
  );
  const me: any = meRes.ok ? await meRes.json() : {};
  const metaUserId = me?.id as string | undefined;
  if (!metaUserId) {
    console.error("[meta] could not read Meta profile", me);
    return { ok: false, error: "Could not read Meta profile" };
  }

  // 4) Upsert social_accounts row (platform=facebook)
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .upsert(
      {
        user_id: userId,
        platform: "facebook",
        platform_user_id: metaUserId,
        platform_username: me?.name || null,
        access_token: longToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        scopes: FB_SCOPES,
        metadata: { email: me?.email || null },
      },
      { onConflict: "user_id,platform" as any },
    );

  // 5) Fetch pages the user manages
  const pagesRes = await fetch(
    `${META_GRAPH}/me/accounts?fields=id,name,category,fan_count,picture,access_token,instagram_business_account&access_token=${encodeURIComponent(longToken)}`,
  );
  const pagesJson: any = pagesRes.ok ? await pagesRes.json() : { data: [] };
  const pages: any[] = pagesJson?.data || [];

  if (pages.length) {
    const { data: acctRow } = await supabaseAdmin
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "facebook")
      .maybeSingle();

    const rows = pages.map((p, idx) => ({
      user_id: userId,
      social_account_id: acctRow?.id || null,
      platform: "facebook",
      page_id: String(p.id),
      page_name: p.name || null,
      page_category: p.category || null,
      page_picture_url: p?.picture?.data?.url || null,
      page_followers_count: p.fan_count || 0,
      page_access_token: p.access_token || null,
      instagram_business_account_id: p?.instagram_business_account?.id || null,
      is_default: idx === 0,
    }));
    await supabaseAdmin
      .from("social_pages")
      .upsert(rows, { onConflict: "user_id,platform,page_id" as any });
  }

  // 6) Record permissions granted (best-effort)
  try {
    const permRes = await fetch(
      `${META_GRAPH}/me/permissions?access_token=${encodeURIComponent(longToken)}`,
    );
    const permJson: any = permRes.ok ? await permRes.json() : { data: [] };
    for (const p of permJson?.data || []) {
      await supabaseAdmin
        .from("account_permissions")
        .upsert(
          {
            user_id: userId,
            platform: "facebook",
            permission: p.permission,
            granted: p.status === "granted",
          },
          { onConflict: "user_id,platform,permission" as any },
        );
    }
  } catch (e) {
    console.warn("[meta] could not record permissions", e);
  }

  return { ok: true, pageCount: pages.length };
}

/**
 * Get the list of Facebook Pages this user has connected.
 */
export const listFacebookPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("social_pages")
      .select("id, page_id, page_name, page_category, page_picture_url, page_followers_count, is_default, instagram_business_account_id")
      .eq("user_id", context.userId)
      .eq("platform", "facebook")
      .order("is_default", { ascending: false });
    if (error) return { pages: [], error: error.message };
    return { pages: data || [] };
  });

/**
 * Set which Facebook Page is the default publishing target.
 */
export const setDefaultFacebookPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageRowId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("social_pages")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("platform", "facebook");
    const { error } = await supabase
      .from("social_pages")
      .update({ is_default: true })
      .eq("id", data.pageRowId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    return { ok: true };
  });

/**
 * Disconnect Meta: deletes Facebook + Instagram + Threads tokens and pages
 * for this user. The user can reconnect any time.
 */
export const disconnectMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", userId)
      .in("platform", ["facebook", "instagram", "threads"]);
    await supabase.from("social_pages").delete().eq("user_id", userId);
    return { ok: true };
  });

/**
 * Publish a text (+ optional single image) post to a Facebook Page.
 * Uses the Page access token (not the user token) as required by Meta.
 */
export const publishToFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pageRowId: z.string().uuid().optional(),
      message: z.string().min(1).max(63206),
      imageUrl: z.string().url().optional(),
      linkUrl: z.string().url().optional(),
      scheduledFor: z.string().datetime().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      // Pick page: explicit -> default -> first
      let query = supabase
        .from("social_pages")
        .select("id, page_id, page_access_token, page_name")
        .eq("user_id", userId)
        .eq("platform", "facebook");
      if (data.pageRowId) query = query.eq("id", data.pageRowId);
      else query = query.order("is_default", { ascending: false });
      const { data: pages } = await query.limit(1);
      const page = pages?.[0];
      if (!page?.page_access_token) return { error: "No Facebook Page connected. Connect in Settings first." };

      const endpoint = data.imageUrl
        ? `${META_GRAPH}/${page.page_id}/photos`
        : `${META_GRAPH}/${page.page_id}/feed`;

      const body: Record<string, string> = {
        access_token: page.page_access_token,
      };
      if (data.imageUrl) {
        body.url = data.imageUrl;
        body.caption = data.message;
      } else {
        body.message = data.message;
        if (data.linkUrl) body.link = data.linkUrl;
      }
      if (data.scheduledFor) {
        body.published = "false";
        body.scheduled_publish_time = String(Math.floor(new Date(data.scheduledFor).getTime() / 1000));
      }

      const form = new URLSearchParams(body);
      const res = await fetch(endpoint, { method: "POST", body: form });
      const json: any = await res.json().catch(() => ({}));

      // Log to publishing_logs (best effort)
      await supabase.from("publishing_logs").insert({
        user_id: userId,
        platform: "facebook",
        action: data.scheduledFor ? "schedule" : "publish",
        request_payload: { pageId: page.page_id, hasImage: !!data.imageUrl },
        response_payload: json,
        status: res.ok ? "success" : "error",
        error_message: res.ok ? null : json?.error?.message || `HTTP ${res.status}`,
      });

      if (!res.ok) {
        const msg = json?.error?.message || `Facebook publish failed (${res.status})`;
        return { error: msg };
      }

      const postId = (json?.post_id || json?.id) as string | undefined;
      const postUrl = postId ? `https://facebook.com/${postId}` : null;

      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "facebook",
        status: data.scheduledFor ? "scheduled" : "published",
        published_at: data.scheduledFor ? null : new Date().toISOString(),
        scheduled_for: data.scheduledFor || new Date().toISOString(),
        content: data.message.slice(0, 3000),
        title: data.message.slice(0, 80),
        platform_post_id: postId || null,
        media_url: postUrl || data.imageUrl || null,
        media_type: data.imageUrl ? "image" : null,
      } as any);

      return { ok: true, postId, url: postUrl };
    } catch (e: any) {
      console.error("[publishToFacebook] error", e);
      return { error: e?.message || "Failed to publish to Facebook" };
    }
  });

/**
 * Publish a photo or Reel to Instagram. Uses the 2-step container flow
 * required by the IG Graph API.
 */
export const publishToInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      caption: z.string().min(1).max(2200),
      mediaUrl: z.string().url(),
      mediaType: z.enum(["IMAGE", "REELS", "VIDEO"]).default("IMAGE"),
      pageRowId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      let query = supabase
        .from("social_pages")
        .select("id, page_access_token, instagram_business_account_id")
        .eq("user_id", userId)
        .eq("platform", "facebook")
        .not("instagram_business_account_id", "is", null);
      if (data.pageRowId) query = query.eq("id", data.pageRowId);
      else query = query.order("is_default", { ascending: false });
      const { data: pages } = await query.limit(1);
      const page = pages?.[0];
      if (!page?.instagram_business_account_id || !page?.page_access_token) {
        return { error: "No Instagram Business account connected. Link one to a Facebook Page first." };
      }

      // 1) Create media container
      const containerBody = new URLSearchParams({
        caption: data.caption,
        access_token: page.page_access_token,
      });
      if (data.mediaType === "IMAGE") containerBody.set("image_url", data.mediaUrl);
      else {
        containerBody.set("video_url", data.mediaUrl);
        containerBody.set("media_type", data.mediaType);
      }
      const containerRes = await fetch(
        `${META_GRAPH}/${page.instagram_business_account_id}/media`,
        { method: "POST", body: containerBody },
      );
      const containerJson: any = await containerRes.json().catch(() => ({}));
      if (!containerRes.ok || !containerJson?.id) {
        const msg = containerJson?.error?.message || `IG container failed (${containerRes.status})`;
        return { error: msg };
      }
      const containerId = containerJson.id;

      // 2) Publish
      const publishRes = await fetch(
        `${META_GRAPH}/${page.instagram_business_account_id}/media_publish`,
        {
          method: "POST",
          body: new URLSearchParams({
            creation_id: containerId,
            access_token: page.page_access_token,
          }),
        },
      );
      const publishJson: any = await publishRes.json().catch(() => ({}));

      await supabase.from("publishing_logs").insert({
        user_id: userId,
        platform: "instagram",
        action: "publish",
        request_payload: { mediaType: data.mediaType },
        response_payload: publishJson,
        status: publishRes.ok ? "success" : "error",
        error_message: publishRes.ok ? null : publishJson?.error?.message || `HTTP ${publishRes.status}`,
      });

      if (!publishRes.ok || !publishJson?.id) {
        return { error: publishJson?.error?.message || "Instagram publish failed" };
      }

      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "instagram",
        status: "published",
        published_at: new Date().toISOString(),
        scheduled_for: new Date().toISOString(),
        content: data.caption.slice(0, 3000),
        title: data.caption.slice(0, 80),
        platform_post_id: publishJson.id,
        media_url: data.mediaUrl,
        media_type: data.mediaType.toLowerCase(),
      } as any);

      return { ok: true, mediaId: publishJson.id };
    } catch (e: any) {
      console.error("[publishToInstagram] error", e);
      return { error: e?.message || "Failed to publish to Instagram" };
    }
  });

/**
 * Threads publishing via the Threads Graph API. Requires threads_business_basic
 * plus threads_content_publish. Uses the same 2-step container flow as IG.
 */
export const publishToThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(500),
      mediaUrl: z.string().url().optional(),
      mediaType: z.enum(["TEXT", "IMAGE", "VIDEO"]).default("TEXT"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const { data: acct } = await supabase
        .from("social_accounts")
        .select("access_token, platform_user_id")
        .eq("user_id", userId)
        .eq("platform", "threads")
        .maybeSingle();
      if (!acct?.access_token || !acct?.platform_user_id) {
        return { error: "Threads not connected. Connect in Settings first." };
      }

      const containerBody = new URLSearchParams({
        media_type: data.mediaType,
        text: data.text,
        access_token: acct.access_token,
      });
      if (data.mediaUrl && data.mediaType === "IMAGE") containerBody.set("image_url", data.mediaUrl);
      if (data.mediaUrl && data.mediaType === "VIDEO") containerBody.set("video_url", data.mediaUrl);

      const containerRes = await fetch(
        `https://graph.threads.net/v1.0/${acct.platform_user_id}/threads`,
        { method: "POST", body: containerBody },
      );
      const containerJson: any = await containerRes.json().catch(() => ({}));
      if (!containerRes.ok || !containerJson?.id) {
        return { error: containerJson?.error?.message || "Threads container failed" };
      }

      const publishRes = await fetch(
        `https://graph.threads.net/v1.0/${acct.platform_user_id}/threads_publish`,
        {
          method: "POST",
          body: new URLSearchParams({
            creation_id: containerJson.id,
            access_token: acct.access_token,
          }),
        },
      );
      const publishJson: any = await publishRes.json().catch(() => ({}));

      await supabase.from("publishing_logs").insert({
        user_id: userId,
        platform: "threads",
        action: "publish",
        response_payload: publishJson,
        status: publishRes.ok ? "success" : "error",
        error_message: publishRes.ok ? null : publishJson?.error?.message || `HTTP ${publishRes.status}`,
      });

      if (!publishRes.ok || !publishJson?.id) {
        return { error: publishJson?.error?.message || "Threads publish failed" };
      }

      await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "threads",
        status: "published",
        published_at: new Date().toISOString(),
        scheduled_for: new Date().toISOString(),
        content: data.text,
        title: data.text.slice(0, 80),
        platform_post_id: publishJson.id,
        media_url: data.mediaUrl || null,
      } as any);

      return { ok: true, threadId: publishJson.id };
    } catch (e: any) {
      console.error("[publishToThreads] error", e);
      return { error: e?.message || "Failed to publish to Threads" };
    }
  });

/**
 * Read recent publishing logs for the current user (any Meta platform).
 * Used by /admin/meta-review and the Analytics activity table.
 */
export const listPublishingLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).default(50) }).parse)
  .handler(async ({ data, context }) => {
    const { data: logs, error } = await context.supabase
      .from("publishing_logs")
      .select("id, platform, action, status, error_message, created_at, response_payload")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) return { logs: [], error: error.message };
    return { logs: logs || [] };
  });
