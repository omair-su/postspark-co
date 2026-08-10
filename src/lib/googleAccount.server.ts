/**
 * Google account storage + access-token lifecycle (server-only).
 * Tokens live in `social_accounts` with platform = 'google'.
 */
import { refreshGoogleToken, revokeGoogleToken, type GoogleTokens } from "./google.server";

export interface GoogleAccount {
  id: string;
  platform_user_id: string;
  platform_username: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string | null;
  metadata: Record<string, any>;
}

export async function getGoogleAccount(userId: string): Promise<GoogleAccount | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("social_accounts")
    .select(
      "id, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, scopes, metadata",
    )
    .eq("user_id", userId)
    .eq("platform", "google")
    .maybeSingle();
  return (data as GoogleAccount | null) ?? null;
}

export async function saveGoogleAccount(
  userId: string,
  tokens: GoogleTokens,
  profile: { id: string; email?: string | null; name?: string | null; picture?: string | null },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Keep the previous refresh token when Google omits it on re-consent.
  const existing = await getGoogleAccount(userId);
  const refresh = tokens.refresh_token ?? existing?.refresh_token ?? null;

  await supabaseAdmin.from("social_accounts").delete().eq("user_id", userId).eq("platform", "google");
  const { error } = await supabaseAdmin.from("social_accounts").insert({
    user_id: userId,
    platform: "google",
    platform_user_id: profile.id,
    platform_username: profile.email ?? null,
    access_token: tokens.access_token,
    refresh_token: refresh,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    scopes: tokens.scope ?? null,
    metadata: {
      display_name: profile.name ?? null,
      avatar_url: profile.picture ?? null,
      email: profile.email ?? null,
    },
  });
  if (error) throw new Error(error.message);
}

async function persistTokens(userId: string, tokens: GoogleTokens) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .update({
      access_token: tokens.access_token,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    })
    .eq("user_id", userId)
    .eq("platform", "google");
}

export const GOOGLE_NOT_CONNECTED = "GOOGLE_NOT_CONNECTED";
export const GOOGLE_REAUTH_REQUIRED = "GOOGLE_REAUTH_REQUIRED";

/** Valid access token, auto-refreshed when it expires within 5 minutes. */
export async function getGoogleAccessToken(
  userId: string,
): Promise<{ token?: string; account?: GoogleAccount; error?: string }> {
  const account = await getGoogleAccount(userId);
  if (!account) return { error: GOOGLE_NOT_CONNECTED };

  const expiresAt = account.token_expires_at ? Date.parse(account.token_expires_at) : 0;
  const stale = expiresAt > 0 && expiresAt - Date.now() < 5 * 60 * 1000;

  if (stale) {
    if (!account.refresh_token) return { error: GOOGLE_REAUTH_REQUIRED };
    const refreshed = await refreshGoogleToken(account.refresh_token);
    if (!refreshed.tokens?.access_token) return { error: GOOGLE_REAUTH_REQUIRED };
    await persistTokens(userId, refreshed.tokens);
    return { token: refreshed.tokens.access_token, account };
  }
  return { token: account.access_token, account };
}

/** Force a refresh — used after Google answers 401 (user revoked access). */
export async function forceRefreshGoogleToken(
  userId: string,
): Promise<{ token?: string; error?: string }> {
  const account = await getGoogleAccount(userId);
  if (!account?.refresh_token) return { error: GOOGLE_REAUTH_REQUIRED };
  const refreshed = await refreshGoogleToken(account.refresh_token);
  if (!refreshed.tokens?.access_token) return { error: GOOGLE_REAUTH_REQUIRED };
  await persistTokens(userId, refreshed.tokens);
  return { token: refreshed.tokens.access_token };
}

export async function deleteGoogleAccount(userId: string) {
  const account = await getGoogleAccount(userId);
  if (account?.refresh_token) await revokeGoogleToken(account.refresh_token);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("social_accounts").delete().eq("user_id", userId).eq("platform", "google");
}
