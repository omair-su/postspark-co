import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchInstagramReels, resolveReelsCapability } from "@/lib/reelsSearch.server";

export const getReelsCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const cap = await resolveReelsCapability(context.supabase, context.userId);
      return { mode: cap.mode, canSearch: cap.canSearch, username: (cap as any).username ?? null };
    } catch (e: any) {
      console.error("[reels-capability] error", e);
      return { mode: "none" as const, canSearch: false, username: null };
    }
  });

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
