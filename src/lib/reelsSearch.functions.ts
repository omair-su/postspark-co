import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchInstagramReels } from "@/lib/reelsSearch.server";

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
      return await searchInstagramReels(context.supabase, context.userId, data);
    } catch (e: any) {
      console.error("[reels-search] error", e);
      return { success: false, error: e?.message || "Search failed", results: [] };
    }
  });
