const GRAPH = "https://graph.facebook.com/v25.0";

export async function searchInstagramReels(
  supabase: any,
  userId: string,
  input: { hashtag: string; type: "top" | "recent" },
) {
  const { data: pages } = await supabase
    .from("social_pages")
    .select("instagram_business_account_id")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .not("instagram_business_account_id", "is", null)
    .limit(1);
  const igId = pages?.[0]?.instagram_business_account_id;

  const { data: facebookAccount } = await supabase
    .from("social_accounts")
    .select("access_token")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .maybeSingle();

  if (!igId || !facebookAccount?.access_token) {
    const { data: standalone } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "instagram")
      .maybeSingle();
    return {
      success: false as const,
      error: standalone ? "IG_STANDALONE_ONLY" : "NO_IG_ACCOUNT",
      results: [],
    };
  }

  const tag = input.hashtag.replace(/^#/, "").trim();
  const lookup = new URL(`${GRAPH}/ig_hashtag_search`);
  lookup.searchParams.set("user_id", igId);
  lookup.searchParams.set("q", tag);
  lookup.searchParams.set("access_token", facebookAccount.access_token);
  const idRes = await fetch(lookup);
  const idData: any = await idRes.json();
  if (!idRes.ok) {
    return { success: false as const, error: idData?.error?.message || `HTTP ${idRes.status}`, results: [] };
  }
  const hashtagId = idData?.data?.[0]?.id;
  if (!hashtagId) return { success: false as const, error: "HASHTAG_NOT_FOUND", results: [] };

  const edge = input.type === "top" ? "top_media" : "recent_media";
  const mediaUrl = new URL(`${GRAPH}/${hashtagId}/${edge}`);
  mediaUrl.searchParams.set("user_id", igId);
  mediaUrl.searchParams.set("fields", "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp");
  mediaUrl.searchParams.set("access_token", facebookAccount.access_token);
  const mediaRes = await fetch(mediaUrl);
  const mediaData: any = await mediaRes.json();
  if (!mediaRes.ok) {
    return { success: false as const, error: mediaData?.error?.message || `HTTP ${mediaRes.status}`, results: [] };
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
  return { success: true as const, results, hashtagId };
}