/**
 * Canva account storage + token lifecycle (server-only).
 */
import { refreshCanvaToken, type CanvaTokens } from "./canva.server";

export interface CanvaAccount {
  id: string;
  platform_user_id: string;
  platform_username: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  metadata: Record<string, any>;
}

export async function getCanvaAccount(userId: string): Promise<CanvaAccount | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("social_accounts")
    .select("id, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, metadata")
    .eq("user_id", userId)
    .eq("platform", "canva")
    .maybeSingle();
  return (data as CanvaAccount | null) ?? null;
}

export async function saveCanvaAccount(
  userId: string,
  tokens: CanvaTokens,
  profile: { userId: string; displayName?: string | null; avatarUrl?: string | null },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("social_accounts").delete().eq("user_id", userId).eq("platform", "canva");
  const { error } = await supabaseAdmin.from("social_accounts").insert({
    user_id: userId,
    platform: "canva",
    platform_user_id: profile.userId,
    platform_username: profile.displayName ?? null,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    scopes: null,
    metadata: { avatar_url: profile.avatarUrl ?? null },
  });
  if (error) throw new Error(error.message);
}

async function updateCanvaTokens(userId: string, tokens: CanvaTokens) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("social_accounts")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
    })
    .eq("user_id", userId)
    .eq("platform", "canva");
}

/** Returns a valid access token, refreshing it when it is close to expiry. */
export async function getCanvaAccessToken(
  userId: string,
): Promise<{ token?: string; account?: CanvaAccount; error?: string }> {
  const account = await getCanvaAccount(userId);
  if (!account) return { error: "CANVA_NOT_CONNECTED" };

  const expiresAt = account.token_expires_at ? Date.parse(account.token_expires_at) : 0;
  const needsRefresh = expiresAt > 0 && expiresAt - Date.now() < 5 * 60 * 1000;

  if (needsRefresh && account.refresh_token) {
    const refreshed = await refreshCanvaToken(account.refresh_token);
    if (refreshed.tokens?.access_token) {
      await updateCanvaTokens(userId, refreshed.tokens);
      return { token: refreshed.tokens.access_token, account };
    }
    return { error: refreshed.error || "Canva session expired — please reconnect Canva." };
  }

  return { token: account.access_token, account };
}

/** Force a refresh (used after a 401 from the Canva API). */
export async function forceRefreshCanvaToken(
  userId: string,
): Promise<{ token?: string; error?: string }> {
  const account = await getCanvaAccount(userId);
  if (!account?.refresh_token) return { error: "Canva session expired — please reconnect Canva." };
  const refreshed = await refreshCanvaToken(account.refresh_token);
  if (!refreshed.tokens?.access_token) {
    return { error: refreshed.error || "Canva session expired — please reconnect Canva." };
  }
  await updateCanvaTokens(userId, refreshed.tokens);
  return { token: refreshed.tokens.access_token };
}

export async function deleteCanvaAccount(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("social_accounts").delete().eq("user_id", userId).eq("platform", "canva");
}
