/**
 * Meta (Facebook / Instagram / Threads) publishing server functions.
 *
 * All OAuth/token/publishing logic lives here. The browser only ever calls
 * these server functions — access tokens NEVER leave the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CANONICAL_SITE_URL, getCorrectedCanonicalUrl, getSafePublicBaseUrl } from "@/lib/siteUrls";

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
  const explicitRedirectUri = getCorrectedCanonicalUrl(process.env.META_OAUTH_REDIRECT_URI || process.env.META_REDIRECT_URI);

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

  // 4) Save social_accounts row (platform=facebook).
  // NOTE: the unique index is (user_id, platform, platform_user_id), so a
  // plain upsert on (user_id, platform) throws "no unique or exclusion
  // constraint matching the ON CONFLICT specification". Replace instead.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .delete()
    .eq("user_id", userId)
    .eq("platform", "facebook");
  await supabaseAdmin.from("social_accounts").insert({
    user_id: userId,
    platform: "facebook",
    platform_user_id: metaUserId,
    platform_username: me?.name || null,
    access_token: longToken,
    token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scopes: FB_SCOPES,
    metadata: { email: me?.email || null },
  });


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
      /** Extra images for a multi-slide carousel (mediaUrl is slide 1). */
      mediaUrls: z.array(z.string().url()).max(10).optional(),
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

      // Slide list for carousels: mediaUrl first, then any extra unique images.
      const slideUrls = Array.from(
        new Set([data.mediaUrl, ...(data.mediaUrls ?? [])].filter(Boolean)),
      ).slice(0, 10);
      const isCarousel = data.mediaType === "IMAGE" && slideUrls.length > 1;

      // 1) Create media container
      const containerBody = new URLSearchParams({
        caption: data.caption,
        access_token: page.page_access_token,
      });
      if (isCarousel) {
        // Each slide needs its own item container first.
        const childIds: string[] = [];
        for (const url of slideUrls) {
          const itemBody = new URLSearchParams({
            image_url: url,
            is_carousel_item: "true",
            access_token: page.page_access_token,
          });
          // eslint-disable-next-line no-await-in-loop
          const itemRes = await fetch(
            `${META_GRAPH}/${page.instagram_business_account_id}/media`,
            { method: "POST", body: itemBody },
          );
          // eslint-disable-next-line no-await-in-loop
          const itemJson: any = await itemRes.json().catch(() => ({}));
          if (!itemRes.ok || !itemJson?.id) {
            return {
              error:
                itemJson?.error?.message || `IG carousel slide failed (${itemRes.status})`,
            };
          }
          childIds.push(itemJson.id);
        }
        containerBody.set("media_type", "CAROUSEL");
        containerBody.set("children", childIds.join(","));
      } else if (data.mediaType === "IMAGE") {
        containerBody.set("image_url", data.mediaUrl);
      } else {
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
 * Threads publishing via the Threads Graph API. Requires threads_basic plus
 * threads_content_publish. Uses the 2-step container flow (create → publish),
 * polls the container until it is FINISHED for media posts, and supports
 * reply chaining so long content becomes a real thread.
 */
const THREADS_API = "https://graph.threads.net/v1.0";

const THREADS_UNAUTHORIZED_HINT =
  "Threads is rejecting this account's token (Meta error code 1). This happens when the Threads profile has no role on the Meta app while it is in Development mode. Add that Threads account under App roles → Threads Tester, accept the invite in Threads → Settings → Account → Website permissions → Invites, then reconnect Threads in Settings.";

function threadsErrorMessage(json: any, res: Response, fallback: string) {
  const e = json?.error;
  if (e?.code === 1 && !e?.error_subcode) return THREADS_UNAUTHORIZED_HINT;
  if (e?.message) {
    const code = e.code ?? e.error_subcode;
    return code ? `${e.message} (Threads error ${code})` : e.message;
  }
  if (json?.__raw) return `${fallback} — HTTP ${res.status}: ${String(json.__raw).slice(0, 180)}`;
  if (res.status >= 500) return THREADS_UNAUTHORIZED_HINT;
  return `${fallback} — HTTP ${res.status}`;
}


/**
 * Threads Graph API POST.
 * Params MUST go in a form-encoded body (query-string POSTs make the Threads
 * endpoint return an empty HTTP 500 for text containing newlines/emoji), and
 * the token is sent as a Bearer header rather than a URL param.
 */
async function threadsRequest(
  path: string,
  params: Record<string, string>,
  mode: "body" | "query",
) {
  const { access_token, ...rest } = params;
  let res: Response;
  if (mode === "body") {
    res = await fetch(`${THREADS_API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${access_token}`,
      },
      body: new URLSearchParams(rest).toString(),
    });
  } else {
    const url = new URL(`${THREADS_API}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    res = await fetch(url.toString(), { method: "POST" });
  }
  const raw = await res.text();
  let json: any = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { __raw: raw };
  }
  return { res, json };
}

async function threadsPost(path: string, params: Record<string, string>) {
  let out = await threadsRequest(path, params, "body");
  // Some Threads endpoints still only accept query-string params; retry once
  // on a server-side failure before surfacing the error.
  if (!out.res.ok && out.res.status >= 500) {
    console.warn("[threads] body POST failed", out.res.status, "— retrying with query params");
    out = await threadsRequest(path, params, "query");
  }
  return out;
}



async function waitForContainer(containerId: string, token: string) {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 1200 : 3000));
    const url = `${THREADS_API}/${containerId}?fields=status,error_message&access_token=${encodeURIComponent(token)}`;
    const json: any = await fetch(url).then((r) => r.json()).catch(() => ({}));
    const status = json?.status;
    if (status === "FINISHED" || status === undefined) return { ok: true as const };
    if (status === "ERROR" || status === "EXPIRED") {
      return { ok: false as const, error: json?.error_message || `Media processing ${status}` };
    }
  }
  return { ok: false as const, error: "Media is still processing on Threads — try again in a moment." };
}

export const publishToThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(1).max(500),
      mediaUrl: z.string().url().optional(),
      /** Extra images for a Threads carousel (mediaUrl is slide 1). */
      mediaUrls: z.array(z.string().url()).max(20).optional(),
      /** Storage path inside the private post-media bucket (preferred). */
      mediaPath: z.string().optional(),
      mediaType: z.enum(["TEXT", "IMAGE", "VIDEO"]).default("TEXT"),
      /** Thread chaining: id of the post this one replies to. */
      replyToId: z.string().optional(),
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

      // Resolve media: prefer a freshly-signed URL from our own bucket.
      let mediaUrl = data.mediaUrl;
      if (data.mediaPath) {
        if (!data.mediaPath.startsWith(`${userId}/`)) return { error: "Not allowed" };
        const { data: signed } = await supabase.storage
          .from("post-media")
          .createSignedUrl(data.mediaPath, 60 * 60);
        if (!signed?.signedUrl) return { error: "Could not read that uploaded file." };
        mediaUrl = signed.signedUrl;
      }
      const mediaType = mediaUrl ? data.mediaType : "TEXT";
      if (data.mediaType !== "TEXT" && !mediaUrl) {
        return { error: "Add an image or video (upload a file or paste a public URL) before publishing." };
      }

      const params: Record<string, string> = {
        media_type: mediaType,
        text: data.text,
        access_token: acct.access_token,
      };

      // Carousel: every image gets its own item container first.
      const slideUrls = Array.from(
        new Set([mediaUrl, ...(data.mediaUrls ?? [])].filter(Boolean) as string[]),
      ).slice(0, 20);
      const isCarousel = mediaType === "IMAGE" && slideUrls.length > 1;
      if (isCarousel) {
        const childIds: string[] = [];
        for (const url of slideUrls) {
          // eslint-disable-next-line no-await-in-loop
          const item = await threadsPost(`/${acct.platform_user_id}/threads`, {
            media_type: "IMAGE",
            image_url: url,
            is_carousel_item: "true",
            access_token: acct.access_token,
          });
          if (!item.res.ok || !item.json?.id) {
            return {
              error: threadsErrorMessage(item.json, item.res, "Threads carousel slide failed"),
            };
          }
          childIds.push(item.json.id);
        }
        params.media_type = "CAROUSEL";
        params.children = childIds.join(",");
      } else {
        if (mediaUrl && mediaType === "IMAGE") params.image_url = mediaUrl;
        if (mediaUrl && mediaType === "VIDEO") params.video_url = mediaUrl;
      }
      if (data.replyToId) params.reply_to_id = data.replyToId;

      const { res: containerRes, json: containerJson } = await threadsPost(
        `/${acct.platform_user_id}/threads`,
        params,
      );
      if (!containerRes.ok || !containerJson?.id) {
        const message = threadsErrorMessage(containerJson, containerRes, "Threads container failed");
        console.error("[publishToThreads] container failed", containerRes.status, containerJson);
        await supabase.from("publishing_logs").insert({
          user_id: userId,
          platform: "threads",
          action: "container",
          response_payload: containerJson,
          status: "error",
          error_message: message,
        });
        return { error: message };
      }

      // Always give Threads a moment to register the container — even TEXT
      // containers can be briefly unavailable, which makes /threads_publish
      // fail with subcode 4279009 "Media not found".
      const ready = await waitForContainer(containerJson.id, acct.access_token);
      if (!ready.ok) return { error: ready.error };

      let publishRes: Response | null = null;
      let publishJson: any = {};
      for (let attempt = 0; attempt < 5; attempt++) {
        const out = await threadsPost(
          `/${acct.platform_user_id}/threads_publish`,
          { creation_id: containerJson.id, access_token: acct.access_token },
        );
        publishRes = out.res;
        publishJson = out.json;
        if (publishRes.ok && publishJson?.id) break;
        const subcode = publishJson?.error?.error_subcode;
        // 4279009 = container not yet available; back off and retry.
        if (subcode !== 4279009 && publishRes.status < 500) break;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }


      const publishError = publishRes?.ok && publishJson?.id
        ? null
        : threadsErrorMessage(publishJson, publishRes ?? new Response(null, { status: 500 }), "Threads publish failed");

      await supabase.from("publishing_logs").insert({
        user_id: userId,
        platform: "threads",
        action: "publish",
        response_payload: publishJson,
        status: publishError ? "error" : "success",
        error_message: publishError,
      });

      if (publishError) {
        console.error("[publishToThreads] publish failed", publishRes?.status, publishJson);
        return { error: publishError };
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
        media_url: mediaUrl || null,
      } as any);

      return { ok: true, threadId: publishJson.id, id: publishJson.id };
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

// ============================================================================
// Threads OAuth (separate from Facebook Login — uses the Threads Graph API)
// ============================================================================

// Scope names for the dedicated Threads app (Threads API use case). These match
// the permissions approved in the Meta dashboard: basic profile/posts, publish,
// insights and reply reading.
const THREADS_SCOPES = [
  "threads_basic",
  "threads_content_publish",
  "threads_manage_insights",
  "threads_read_replies",
].join(",");
const THREADS_CALLBACK_PATH = "/auth/threads/callback";

function getThreadsRedirectUri() {
  const explicit = getCorrectedCanonicalUrl(process.env.THREADS_OAUTH_REDIRECT_URI);
  if (explicit) return explicit;
  return `${META_CANONICAL_BASE_URL}${THREADS_CALLBACK_PATH}`;
}

function getThreadsAppCredentials() {
  // Threads OAuth uses the *Threads App ID* from the Threads use case in the
  // Meta app dashboard — NOT the Facebook App ID. Falling back to META_APP_ID
  // makes threads.com reject the request with error_code 4476002
  // ("No app ID was sent with the request").
  const appId = process.env.META_THREADS_APP_ID;
  const appSecret = process.env.META_THREADS_APP_SECRET;
  return { appId, appSecret };
}


/**
 * Build the Threads consent URL. Threads OAuth is NOT part of Facebook Login —
 * it lives at threads.net/oauth/authorize and requires its own approved
 * redirect URI in the Meta app dashboard.
 */
export const getThreadsAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { appId } = getThreadsAppCredentials();
      if (!appId) {
        return {
          error:
            "Threads isn't configured yet. In the Meta app dashboard open the Threads use case → Settings and copy the Threads App ID + Threads App Secret (these are different from the Facebook App ID), then save them as META_THREADS_APP_ID and META_THREADS_APP_SECRET.",
        };
      }
      const ts = Date.now();
      const nonce = Math.random().toString(36).slice(2, 10);
      const payload = `${context.userId}.${ts}.${nonce}`;
      const sig = await signState(payload);
      const state = `${payload}.${sig}`;

      const redirectUri = getThreadsRedirectUri();
      // Canonical host: www.threads.net keeps query params through the login
      // redirect chain (bare threads.net/threads.com can drop client_id).
      const oauthUrl = new URL("https://www.threads.net/oauth/authorize");

      oauthUrl.searchParams.set("client_id", appId);
      oauthUrl.searchParams.set("redirect_uri", redirectUri);
      oauthUrl.searchParams.set("response_type", "code");
      oauthUrl.searchParams.set("scope", THREADS_SCOPES);
      oauthUrl.searchParams.set("state", state);

      console.info("[threads-oauth] URL", oauthUrl.toString());
      console.info("[threads-oauth] redirect_uri", redirectUri);
      return { url: oauthUrl.toString(), redirectUri };
    } catch (e: any) {
      console.error("[getThreadsAuthUrl] error", e);
      return { error: e?.message || "Failed to build Threads auth URL" };
    }
  });

/**
 * Exchange the ?code from Threads for a long-lived access token, then upsert
 * a platform=threads row in social_accounts.
 */
export async function completeThreadsOAuth(code: string, userId: string) {
  const { appId, appSecret } = getThreadsAppCredentials();
  const redirectUri = getThreadsRedirectUri();
  if (!appId || !appSecret) {
    console.error("[threads] OAuth callback failed: Threads app not configured", {
      hasAppId: Boolean(appId),
      hasAppSecret: Boolean(appSecret),
      redirectUri,
    });
    return { ok: false as const, error: "Threads app not configured" };
  }

  // 1) Exchange code -> short-lived token
  const tokenBody = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const tRes = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  if (!tRes.ok) {
    const txt = await tRes.text();
    console.error("[threads] token exchange failed", tRes.status, txt);
    return { ok: false as const, error: `Threads token exchange failed (${tRes.status})` };
  }
  const tJson: any = await tRes.json();
  const shortToken = tJson.access_token as string;
  const threadsUserId = tJson.user_id != null ? String(tJson.user_id) : undefined;
  if (!shortToken) {
    console.error("[threads] no access_token in response", tJson);
    return { ok: false as const, error: "No access_token from Threads" };
  }

  // 2) Exchange short-lived -> long-lived (~60 days)
  const llUrl = new URL("https://graph.threads.net/access_token");
  llUrl.searchParams.set("grant_type", "th_exchange_token");
  llUrl.searchParams.set("client_secret", appSecret);
  llUrl.searchParams.set("access_token", shortToken);
  const llRes = await fetch(llUrl.toString());
  const llJson: any = llRes.ok ? await llRes.json() : { access_token: shortToken };
  const longToken = (llJson.access_token as string) || shortToken;
  const expiresIn = (llJson.expires_in as number) || 60 * 24 * 60 * 60;

  // 3) Verify the token actually works against the Threads Graph API.
  //    OAuth can succeed and still hand back a token the API refuses (error
  //    code 1, "An unknown error occurred") when the Threads profile that
  //    logged in has no role on the Meta app while that app is still in
  //    development mode. Saving such a token makes every later publish fail
  //    with an opaque HTTP 500, so refuse the connection here instead.
  const meRes = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(longToken)}`,
  );
  const meRaw = await meRes.text();
  let me: any = {};
  try {
    me = meRaw ? JSON.parse(meRaw) : {};
  } catch {
    me = {};
  }
  if (!meRes.ok || !me?.id) {
    console.error("[threads] profile check failed", meRes.status, meRaw.slice(0, 300));
    if (me?.error?.code === 1 || meRes.status >= 500) {
      return {
        ok: false as const,
        error:
          "Threads accepted the login but rejects API calls for this profile. The Threads app is still in Development mode, so the Threads account you signed in with must have a role on it: Meta app dashboard → App roles → Roles → add that account as Threads Tester, then accept the invite in the Threads app under Settings → Account → Website permissions → Invites. Then connect again.",
      };
    }
    return {
      ok: false as const,
      error: me?.error?.message || `Could not read Threads profile (HTTP ${meRes.status})`,
    };
  }
  const platformUserId = String(me.id);


  // 4) Save social_accounts row (platform=threads). Unique index is
  // (user_id, platform, platform_user_id) — replace rather than upsert.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .delete()
    .eq("user_id", userId)
    .eq("platform", "threads");
  const { error: upsertErr } = await supabaseAdmin.from("social_accounts").insert({
    user_id: userId,
    platform: "threads",
    platform_user_id: platformUserId,
    platform_username: me?.username || null,
    access_token: longToken,
    token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scopes: THREADS_SCOPES,
    metadata: { oauth_user_id: threadsUserId ?? null },
  });
  if (upsertErr) {
    console.error("[threads] insert social_accounts failed", upsertErr);
    return { ok: false as const, error: upsertErr.message };

  }

  return { ok: true as const, username: me?.username || null };
}


// ============================================================================
// Threads insights + replies (threads_manage_insights, threads_read_replies)
// ============================================================================

async function getThreadsAccount(supabase: any, userId: string) {
  const { data } = await supabase
    .from("social_accounts")
    .select("access_token, platform_user_id")
    .eq("user_id", userId)
    .eq("platform", "threads")
    .maybeSingle();
  return data as { access_token: string; platform_user_id: string } | null;
}

/** Account-level Threads insights (views, likes, replies, quotes, reposts, followers). */
export const getThreadsInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const acct = await getThreadsAccount(context.supabase, context.userId);
    if (!acct?.access_token) return { error: "Threads not connected" };
    const metrics = "views,likes,replies,reposts,quotes,followers_count";
    const url = `https://graph.threads.net/v1.0/${acct.platform_user_id}/threads_insights?metric=${metrics}&access_token=${encodeURIComponent(acct.access_token)}`;
    const res = await fetch(url);
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json?.error?.message || `HTTP ${res.status}` };
    return { metrics: json?.data || [] };
  });

/** Recent Threads posts for the connected account, with per-post metrics. */
export const listThreadsPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(25).default(10) }).parse)
  .handler(async ({ data, context }) => {
    const acct = await getThreadsAccount(context.supabase, context.userId);
    if (!acct?.access_token) return { error: "Threads not connected" };
    const fields = "id,text,media_type,permalink,timestamp";
    const url = `https://graph.threads.net/v1.0/${acct.platform_user_id}/threads?fields=${fields}&limit=${data.limit}&access_token=${encodeURIComponent(acct.access_token)}`;
    const res = await fetch(url);
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json?.error?.message || `HTTP ${res.status}` };
    return { posts: json?.data || [] };
  });

/** Replies to one of the user's Threads posts. */
export const listThreadsReplies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ threadId: z.string().min(1) }).parse)
  .handler(async ({ data, context }) => {
    const acct = await getThreadsAccount(context.supabase, context.userId);
    if (!acct?.access_token) return { error: "Threads not connected" };
    const fields = "id,text,username,timestamp,permalink,has_replies";
    const url = `https://graph.threads.net/v1.0/${data.threadId}/replies?fields=${fields}&access_token=${encodeURIComponent(acct.access_token)}`;
    const res = await fetch(url);
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json?.error?.message || `HTTP ${res.status}` };
    return { replies: json?.data || [] };
  });
