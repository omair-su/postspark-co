const GRAPH = "https://graph.facebook.com/v25.0";

export type ReelsCapability =
  | { mode: "facebook_linked"; canSearch: true; igId: string; token: string; username?: string | null }
  | { mode: "standalone_instagram"; canSearch: false; reason: "IG_STANDALONE_ONLY"; username?: string | null }
  | { mode: "facebook_no_ig"; canSearch: false; reason: "NO_IG_BUSINESS_ON_PAGE" }
  | { mode: "none"; canSearch: false; reason: "NO_IG_ACCOUNT" };

/**
 * Resolves hashtag-discovery capability from BOTH supported connection models:
 *  - Instagram Business account linked through a Facebook Page  -> can search
 *  - Standalone Instagram Login connection (publishing only)    -> cannot search
 */
export async function resolveReelsCapability(
  supabase: any,
  userId: string,
): Promise<ReelsCapability> {
  const [{ data: pages }, { data: fbAccount }, { data: standalone }] = await Promise.all([
    supabase
      .from("social_pages")
      .select("instagram_business_account_id,page_name")
      .eq("user_id", userId)
      .eq("platform", "facebook")
      .not("instagram_business_account_id", "is", null)
      .limit(1),
    supabase
      .from("social_accounts")
      .select("access_token,platform_username")
      .eq("user_id", userId)
      .eq("platform", "facebook")
      .maybeSingle(),
    supabase
      .from("social_accounts")
      .select("platform_username")
      .eq("user_id", userId)
      .eq("platform", "instagram")
      .maybeSingle(),
  ]);

  const igId = pages?.[0]?.instagram_business_account_id;
  if (igId && fbAccount?.access_token) {
    return {
      mode: "facebook_linked",
      canSearch: true,
      igId,
      token: fbAccount.access_token,
      username: standalone?.platform_username ?? fbAccount?.platform_username ?? null,
    };
  }

  if (standalone) {
    return {
      mode: "standalone_instagram",
      canSearch: false,
      reason: "IG_STANDALONE_ONLY",
      username: standalone.platform_username ?? null,
    };
  }

  if (fbAccount?.access_token) {
    return { mode: "facebook_no_ig", canSearch: false, reason: "NO_IG_BUSINESS_ON_PAGE" };
  }

  return { mode: "none", canSearch: false, reason: "NO_IG_ACCOUNT" };
}

export async function searchInstagramReels(
  supabase: any,
  userId: string,
  input: { hashtag: string; type: "top" | "recent" },
) {
  const cap = await resolveReelsCapability(supabase, userId);
  if (!cap.canSearch) {
    return { success: false as const, error: cap.reason, capability: cap.mode, results: [] };
  }

  const tag = input.hashtag.replace(/^#/, "").trim();
  const lookup = new URL(`${GRAPH}/ig_hashtag_search`);
  lookup.searchParams.set("user_id", cap.igId);
  lookup.searchParams.set("q", tag);
  lookup.searchParams.set("access_token", cap.token);
  const idRes = await fetch(lookup);
  const idData: any = await idRes.json();
  if (!idRes.ok) {
    return { success: false as const, error: idData?.error?.message || `HTTP ${idRes.status}`, capability: cap.mode, results: [] };
  }
  const hashtagId = idData?.data?.[0]?.id;
  if (!hashtagId) return { success: false as const, error: "HASHTAG_NOT_FOUND", capability: cap.mode, results: [] };

  const edge = input.type === "top" ? "top_media" : "recent_media";
  const mediaUrl = new URL(`${GRAPH}/${hashtagId}/${edge}`);
  mediaUrl.searchParams.set("user_id", cap.igId);
  mediaUrl.searchParams.set("fields", "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp");
  mediaUrl.searchParams.set("access_token", cap.token);
  const mediaRes = await fetch(mediaUrl);
  const mediaData: any = await mediaRes.json();
  if (!mediaRes.ok) {
    return { success: false as const, error: mediaData?.error?.message || `HTTP ${mediaRes.status}`, capability: cap.mode, results: [] };
  }

  const results = (mediaData?.data || [])
    .filter((media: any) => media.media_type === "VIDEO")
    .map((media: any) => ({
      id: media.id,
      videoUrl: media.media_url,
      thumbnailUrl: media.thumbnail_url,
      permalink: media.permalink,
      caption: media.caption || "",
      timestamp: media.timestamp,
    }));
  return { success: true as const, results, hashtagId, capability: cap.mode };
}
