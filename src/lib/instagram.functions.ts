/**
 * Instagram server functions (Instagram Login flow — no Facebook required).
 * Thin wrappers only: all logic lives in instagram.server.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildInstagramAuthUrl,
  createInstagramState,
  createIgContainer,
  forceRefreshIgToken,
  publishIgFlow,
  callInstagramDeauthorizeCallback,
  checkInstagramWebhookVerification,
  fetchInstagramProfile,
  getIgAccount,
  getInstagramCredentials,
  getInstagramRedirectUri,
  igErrorMessage,
  igGet,
  igPost,
  isAuthError,
  publishIgContainer,
  refreshIgTokenIfNeeded,
  waitForContainer,
} from "@/lib/instagram.server";

export const getInstagramAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { appId } = getInstagramCredentials();
    if (!appId) {
      return {
        error:
          "Instagram isn't configured yet. Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET (from your PostSpark-IG app in the Meta dashboard).",
      };
    }
    const state = await createInstagramState(context.userId);
    return { url: buildInstagramAuthUrl(state), redirectUri: getInstagramRedirectUri() };
  });

export const getInstagramConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { connected: false as const, redirectUri: getInstagramRedirectUri() };
    const meta = acct.metadata || {};
    return {
      connected: true as const,
      username: acct.platform_username,
      displayName: meta.display_name ?? null,
      avatarUrl: meta.avatar_url ?? null,
      followersCount: meta.followers_count ?? null,
      followsCount: meta.follows_count ?? null,
      mediaCount: meta.media_count ?? null,
      accountType: meta.account_type ?? null,
      tokenExpiresAt: acct.token_expires_at,
      redirectUri: getInstagramRedirectUri(),
    };
  });

export const refreshInstagramProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);
    const profile = await fetchInstagramProfile(acct.access_token);
    if (!profile.ok) return { error: profile.error };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("social_accounts")
      .update({
        platform_username: profile.profile.username ?? acct.platform_username,
        metadata: {
          ...(acct.metadata || {}),
          display_name: profile.profile.name ?? null,
          avatar_url: profile.profile.profile_picture_url ?? null,
          followers_count: profile.profile.followers_count ?? null,
          follows_count: profile.profile.follows_count ?? null,
          media_count: profile.profile.media_count ?? null,
          account_type: profile.profile.account_type ?? null,
        },
      })
      .eq("id", acct.id);
    return { ok: true as const };
  });

export const disconnectInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("platform", "instagram");
    if (error) return { error: error.message };
    return { ok: true as const };
  });

export const publishInstagramPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      type: z.enum(["IMAGE", "CAROUSEL", "REELS", "STORIES"]).default("IMAGE"),
      caption: z.string().max(2200).optional(),
      mediaUrl: z.string().url().optional(),
      mediaUrls: z.array(z.string().url()).max(10).optional(),
      shareToFeed: z.boolean().optional(),
      firstComment: z.string().max(2200).optional(),
      scheduledFor: z.string().datetime().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let acct = await getIgAccount(supabase, userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);

    // Scheduled: queue it, the publisher cron/Publishing Center picks it up.
    if (data.scheduledFor) {
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: userId,
        platform: "instagram",
        status: "scheduled",
        scheduled_for: data.scheduledFor,
        content: (data.caption || "").slice(0, 3000),
        title: (data.caption || "Instagram post").slice(0, 80),
        media_url: data.mediaUrl || data.mediaUrls?.[0] || null,
        media_urls: data.mediaUrls || null,
        media_type: data.type.toLowerCase(),
        first_comment: data.firstComment || null,
      } as any);
      if (error) return { error: error.message };
      return { ok: true as const, scheduled: true as const };
    }

    const input = {
      type: data.type,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      mediaUrls: data.mediaUrls,
      shareToFeed: data.shareToFeed,
    };

    let result = await publishIgFlow(acct, input);
    let refreshed = false;

    // Token trouble mid-publish: force a token refresh and retry once.
    if (!result.ok && result.authError) {
      const r = await forceRefreshIgToken(acct);
      if (r.ok) {
        acct = r.account;
        refreshed = true;
        result = await publishIgFlow(acct, input);
      }
    }

    if (!result.ok) {
      await supabase.from("publishing_logs").insert({
        user_id: userId,
        platform: "instagram",
        action: result.stage,
        status: "error",
        request_payload: { type: data.type, retried_after_refresh: refreshed },
        response_payload: (result as any).json ?? null,
        error_message: result.error,
      });
      return {
        error: result.error,
        stage: result.stage,
        needsReconnect: result.authError,
        errorCode: (result as any).json?.error?.code ?? null,
      };
    }

    const published = { mediaId: result.mediaId, json: result.json };
    await supabase.from("publishing_logs").insert({
      user_id: userId,
      platform: "instagram",
      action: "publish",
      status: "success",
      request_payload: { type: data.type, retried_after_refresh: refreshed },
      response_payload: published.json ?? null,
    });

    if (data.firstComment?.trim()) {
      await igPost(`${published.mediaId}/comments`, acct!.access_token, { message: data.firstComment.trim() });
    }


    await supabase.from("scheduled_posts").insert({
      user_id: userId,
      platform: "instagram",
      status: "published",
      published_at: new Date().toISOString(),
      scheduled_for: new Date().toISOString(),
      content: (data.caption || "").slice(0, 3000),
      title: (data.caption || "Instagram post").slice(0, 80),
      platform_post_id: published.mediaId,
      media_url: data.mediaUrl || data.mediaUrls?.[0] || null,
      media_urls: data.mediaUrls || null,
      media_type: data.type.toLowerCase(),
      first_comment: data.firstComment || null,
    } as any);

    return { ok: true as const, mediaId: published.mediaId };
  });

export const listInstagramMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(25).default(12) }).parse)
  .handler(async ({ data, context }) => {
    let acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);
    const { res, json } = await igGet(`${acct.platform_user_id}/media`, acct.access_token, {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
      limit: String(data.limit),
    });
    if (!res.ok) return { error: igErrorMessage(json, res), needsReconnect: isAuthError(json) };
    return { media: json?.data || [] };
  });

export const listInstagramComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mediaId: z.string().min(1) }).parse)
  .handler(async ({ data, context }) => {
    let acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);
    const { res, json } = await igGet(`${data.mediaId}/comments`, acct.access_token, {
      fields: "id,text,username,timestamp,like_count,hidden,replies{id,text,username,timestamp}",
      limit: "50",
    });
    if (!res.ok) return { error: igErrorMessage(json, res), needsReconnect: isAuthError(json) };
    return { comments: json?.data || [] };
  });

export const replyToInstagramComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ commentId: z.string().min(1), message: z.string().min(1).max(2200) }).parse)
  .handler(async ({ data, context }) => {
    let acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);
    const { res, json } = await igPost(`${data.commentId}/replies`, acct.access_token, { message: data.message });
    if (!res.ok) return { error: igErrorMessage(json, res, "Reply failed"), needsReconnect: isAuthError(json) };
    return { ok: true as const, id: json?.id };
  });

export const moderateInstagramComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ commentId: z.string().min(1), action: z.enum(["hide", "unhide", "delete"]) }).parse)
  .handler(async ({ data, context }) => {
    let acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);
    if (data.action === "delete") {
      const res = await fetch(
        `https://graph.instagram.com/v21.0/${data.commentId}?access_token=${encodeURIComponent(acct.access_token)}`,
        { method: "DELETE" },
      );
      if (!res.ok) return { error: `Delete failed — HTTP ${res.status}` };
      return { ok: true as const };
    }
    const { res, json } = await igPost(data.commentId, acct.access_token, {
      hide: String(data.action === "hide"),
    });
    if (!res.ok) return { error: igErrorMessage(json, res, "Could not update the comment") };
    return { ok: true as const };
  });

export const getInstagramInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30) }).parse)
  .handler(async ({ data, context }) => {
    let acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { error: "Instagram not connected" };
    acct = await refreshIgTokenIfNeeded(acct);

    const until = Math.floor(Date.now() / 1000);
    const since = until - data.days * 24 * 60 * 60;
    const daily = await igGet(`${acct.platform_user_id}/insights`, acct.access_token, {
      metric: "reach,profile_views,follower_count",
      period: "day",
      since: String(since),
      until: String(until),
    });
    const totals = await igGet(`${acct.platform_user_id}/insights`, acct.access_token, {
      metric: "views,accounts_engaged,total_interactions",
      metric_type: "total_value",
      period: "day",
      since: String(since),
      until: String(until),
    });
    const media = await igGet(`${acct.platform_user_id}/media`, acct.access_token, {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
      limit: "12",
    });

    return {
      daily: daily.res.ok ? daily.json?.data || [] : [],
      totals: totals.res.ok ? totals.json?.data || [] : [],
      media: media.res.ok ? media.json?.data || [] : [],
      warning: daily.res.ok ? null : igErrorMessage(daily.json, daily.res, "Insights unavailable"),
      profile: {
        followers: acct.metadata?.followers_count ?? null,
        follows: acct.metadata?.follows_count ?? null,
        mediaCount: acct.metadata?.media_count ?? null,
      },
    };
  });

/**
 * User-facing disconnect: calls our deauthorize/data-deletion callback the way
 * Meta would (so cleanup runs through one code path), then clears the local
 * connection row even if the callback could not be reached.
 */
export const deauthorizeInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const acct = await getIgAccount(context.supabase, context.userId);
    if (!acct) return { ok: true as const, alreadyDisconnected: true as const };

    const callback = await callInstagramDeauthorizeCallback(acct.platform_user_id);

    // Safety net: always clear this user's own Instagram data.
    await context.supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("platform", "instagram");

    const still = await getIgAccount(context.supabase, context.userId);
    if (still) return { error: "Could not clear the Instagram connection. Please try again." };

    return {
      ok: true as const,
      callbackOk: callback.ok,
      confirmationCode: callback.ok ? callback.confirmationCode : null,
      callbackError: callback.ok ? null : callback.error,
    };
  });

async function assertIgAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const getInstagramWebhookHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertIgAdmin(context.supabase, context.userId);
    const verification = await checkInstagramWebhookVerification();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: events } = await supabaseAdmin
      .from("webhook_events")
      .select("id, event_type, payload, processed, error_message, created_at")
      .eq("platform", "instagram")
      .order("created_at", { ascending: false })
      .limit(25);
    const { count } = await supabaseAdmin
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("platform", "instagram");
    return {
      verification,
      events: events || [],
      totalEvents: count ?? 0,
      appConfigured: !!getInstagramCredentials().appId && !!getInstagramCredentials().appSecret,
    };
  });

export const triggerInstagramWebhookTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertIgAdmin(context.supabase, context.userId);
    const verification = await checkInstagramWebhookVerification();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("webhook_events").insert({
      platform: "instagram",
      event_type: "manual_test",
      payload: {
        triggered_by: context.userId,
        handshake_ok: verification.ok,
        handshake_detail: verification.detail,
        at: new Date().toISOString(),
      },
      processed: true,
    });
    if (error) return { error: error.message };
    return { ok: true as const, verification };
  });
