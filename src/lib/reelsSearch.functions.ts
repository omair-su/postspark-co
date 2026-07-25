import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Meta Instagram hashtag search — requires an IG Business account linked to a
// connected Facebook Page (already available on this project via `social_pages`).
// Docs: https://developers.facebook.com/docs/instagram-api/guides/hashtag-search

const GRAPH = "https://graph.facebook.com/v25.0";

async function findIgAccount(supabase: any, userId: string) {
  const { data } = await supabase
    .from("social_pages")
    .select("instagram_business_account_id, page_id")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .not("instagram_business_account_id", "is", null)
    .limit(1);
  const row = (data || [])[0];
  if (!row?.instagram_business_account_id) return null;
  const { data: acct } = await supabase
    .from("social_accounts")
    .select("access_token")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .maybeSingle();
  if (!acct?.access_token) return null;
  return { igId: row.instagram_business_account_id, token: acct.access_token };
}

export const searchReelsByHashtag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      hashtag: z.string().min(1).max(60),
      type: z.enum(["top", "recent"]).default("top"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const acct = await findIgAccount(supabase, userId);
      if (!acct) {
        return { success: false, error: "NO_IG_ACCOUNT", results: [] as any[] };
      }

      const tag = data.hashtag.replace(/^#/, "").trim();
      // 1. hashtag ID lookup
      const idRes = await fetch(
        `${GRAPH}/ig_hashtag_search?user_id=${acct.igId}&q=${encodeURIComponent(
          tag,
        )}&access_token=${acct.token}`,
      );
      const idData: any = await idRes.json();
      const hashtagId = idData?.data?.[0]?.id;
      if (!hashtagId) return { success: false, error: "HASHTAG_NOT_FOUND", results: [] };

      // 2. top/recent media for that hashtag (VIDEO only for Reels).
      const edge = data.type === "top" ? "top_media" : "recent_media";
      const fields = "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp";
      const mediaRes = await fetch(
        `${GRAPH}/${hashtagId}/${edge}?user_id=${acct.igId}&fields=${fields}&access_token=${acct.token}`,
      );
      const mediaData: any = await mediaRes.json();
      if (!mediaRes.ok) {
        return {
          success: false,
          error: mediaData?.error?.message || `HTTP ${mediaRes.status}`,
          results: [],
        };
      }
      const results = (mediaData?.data || [])
        .filter((m: any) => m.media_type === "VIDEO")
        .map((m: any) => ({
          id: m.id,
          videoUrl: m.media_url,
          thumbnailUrl: m.thumbnail_url,
          permalink: m.permalink,
          caption: m.caption || "",
          timestamp: m.timestamp,
        }));
      return { success: true, results, hashtagId };
    } catch (e: any) {
      console.error("[reels-search] error", e);
      return { success: false, error: e?.message || "Search failed", results: [] };
    }
  });
