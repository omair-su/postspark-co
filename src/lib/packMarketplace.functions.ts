/**
 * Marketplace: list packs for sale, browse them, and buy with credits or card.
 *
 * A listing snapshots the pack's outputs at listing time (`payload`), so the
 * seller can keep editing their own copy without changing what buyers get.
 * Card purchases are granted by the payment webhook after the provider
 * confirms the transaction; credit purchases settle here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toReadableError } from "@/lib/serverErrors";
import { refundCredits, spendCredits } from "@/lib/credits.server";
import {
  CREDIT_PRICE_OPTIONS,
  MAX_LISTING_DESCRIPTION,
  MAX_LISTING_TITLE,
  isPackPriceId,
  type ListingSummary,
} from "@/lib/marketplace";
import { copyListingToLibrary } from "@/lib/marketplace.server";

function previewFrom(outputs: unknown): { pieceCount: number; previewText: string | null } {
  const obj = (outputs && typeof outputs === "object" ? outputs : {}) as Record<string, unknown>;
  const texts: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === "string") texts.push(value);
    else if (Array.isArray(value)) for (const v of value) if (typeof v === "string") texts.push(v);
  }
  return {
    pieceCount: texts.length,
    previewText: texts[0] ? texts[0].slice(0, 220) : null,
  };
}

/** Everything the marketplace grid needs, including what the viewer owns. */
export const listMarketplace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mine: z.boolean().optional() }).parse)
  .handler(async ({ data, context }): Promise<ListingSummary[]> => {
    try {
      const { supabase, userId } = context;

      let query = supabase
        .from("marketplace_listings")
        .select("id, seller_id, title, description, platforms, preview, price_id, credit_price, sales_count, created_at, status")
        .order("created_at", { ascending: false })
        .limit(60);
      query = data.mine ? query.eq("seller_id", userId) : query.eq("status", "published");

      const { data: rows, error } = await query;
      if (error) throw error;

      const ids = (rows ?? []).map((r) => r.id);
      const ownedIds = new Set<string>();
      if (ids.length) {
        const { data: owned } = await supabase
          .from("marketplace_purchases")
          .select("listing_id")
          .eq("buyer_id", userId)
          .in("listing_id", ids);
        for (const row of owned ?? []) ownedIds.add(row.listing_id as string);
      }

      return (rows ?? []).map((row) => {
        const preview = (row.preview ?? {}) as { pieceCount?: number; previewText?: string | null };
        return {
          id: row.id as string,
          title: row.title as string,
          description: (row.description as string | null) ?? null,
          platforms: (row.platforms as string[]) ?? [],
          priceId: (row.price_id as string | null) ?? null,
          creditPrice: (row.credit_price as number | null) ?? null,
          salesCount: (row.sales_count as number) ?? 0,
          pieceCount: preview.pieceCount ?? 0,
          previewText: preview.previewText ?? null,
          isMine: row.seller_id === userId,
          owned: ownedIds.has(row.id as string),
          createdAt: String(row.created_at),
        };
      });
    } catch (thrown) {
      throw await toReadableError(thrown, "marketplace");
    }
  });

/** Packs the signed-in user could put up for sale. */
export const listSellablePacks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabase, userId } = context;
      const { data: rows, error } = await supabase
        .from("repurpose_jobs")
        .select("id, title, input_text, outputs, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      return (rows ?? [])
        .map((row) => {
          const { pieceCount } = previewFrom(row.outputs);
          return {
            id: row.id as string,
            title: (row.title as string) || (row.input_text as string)?.slice(0, 60) || "Untitled pack",
            pieceCount,
          };
        })
        .filter((row) => row.pieceCount > 0);
    } catch (thrown) {
      throw await toReadableError(thrown, "marketplace");
    }
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      title: z.string().min(3).max(MAX_LISTING_TITLE),
      description: z.string().max(MAX_LISTING_DESCRIPTION).optional(),
      priceId: z.string().max(60).optional().nullable(),
      creditPrice: z.number().int().min(1).max(1000).optional().nullable(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      if (data.priceId && !isPackPriceId(data.priceId)) {
        return { success: false, error: "That price isn't available." };
      }
      if (data.creditPrice && !CREDIT_PRICE_OPTIONS.includes(data.creditPrice as never)) {
        return { success: false, error: "Pick one of the listed credit prices." };
      }
      if (!data.priceId && !data.creditPrice) {
        return { success: false, error: "Set a card price, a credit price, or both." };
      }

      const { data: job, error: jobError } = await supabase
        .from("repurpose_jobs")
        .select("id, outputs, input_text")
        .eq("id", data.jobId)
        .eq("user_id", userId)
        .maybeSingle();
      if (jobError) throw jobError;
      if (!job) return { success: false, error: "We couldn't find that pack." };

      const preview = previewFrom(job.outputs);
      if (!preview.pieceCount) return { success: false, error: "That pack has no posts to sell yet." };

      const platforms = Object.keys((job.outputs ?? {}) as Record<string, unknown>).slice(0, 12);

      const { error } = await supabase.from("marketplace_listings").insert({
        seller_id: userId,
        job_id: data.jobId,
        title: data.title,
        description: data.description || null,
        platforms,
        preview: preview as never,
        payload: { outputs: job.outputs, input_text: job.input_text } as never,
        price_id: data.priceId || null,
        credit_price: data.creditPrice || null,
      });
      if (error) throw error;

      return { success: true };
    } catch (thrown) {
      throw await toReadableError(thrown, "marketplace");
    }
  });

export const unlistListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ listingId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const { error } = await supabase
        .from("marketplace_listings")
        .update({ status: "unlisted" })
        .eq("id", data.listingId)
        .eq("seller_id", userId);
      if (error) throw error;
      return { success: true };
    } catch (thrown) {
      throw await toReadableError(thrown, "marketplace");
    }
  });

/** Buys with purchased credits and copies the pack into the buyer's library. */
export const buyListingWithCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ listingId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      const { data: listing, error } = await supabase
        .from("marketplace_listings")
        .select("id, seller_id, credit_price, status")
        .eq("id", data.listingId)
        .maybeSingle();
      if (error) throw error;
      if (!listing || listing.status !== "published") {
        return { success: false, error: "That pack isn't available anymore." };
      }
      if (listing.seller_id === userId) {
        return { success: false, error: "This is your own pack." };
      }
      const creditPrice = listing.credit_price as number | null;
      if (!creditPrice) return { success: false, error: "This pack isn't sold for credits." };

      const { data: already } = await supabase
        .from("marketplace_purchases")
        .select("id")
        .eq("listing_id", data.listingId)
        .eq("buyer_id", userId)
        .maybeSingle();
      if (already) return { success: false, error: "You already own this pack." };

      const paid = await spendCredits(userId, "image", creditPrice);
      if (!paid) {
        return { success: false, error: "NOT_ENOUGH_CREDITS" };
      }

      const result = await copyListingToLibrary({
        listingId: data.listingId,
        buyerId: userId,
        method: "credits",
        creditsSpent: creditPrice,
      });
      if (!result.success) {
        await refundCredits(userId, "image", creditPrice);
        return { success: false, error: "We couldn't add the pack to your library. Your credits were returned." };
      }

      return { success: true, jobId: result.jobId };
    } catch (thrown) {
      throw await toReadableError(thrown, "marketplace");
    }
  });

export const listMyPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabase, userId } = context;
      const { data: rows, error } = await supabase
        .from("marketplace_purchases")
        .select("id, listing_id, method, credits_spent, amount_cents, copied_job_id, created_at")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (rows ?? []).map((row) => ({
        id: row.id as string,
        listingId: row.listing_id as string,
        method: String(row.method),
        creditsSpent: (row.credits_spent as number | null) ?? null,
        amountCents: (row.amount_cents as number | null) ?? null,
        jobId: (row.copied_job_id as string | null) ?? null,
        createdAt: String(row.created_at),
      }));
    } catch (thrown) {
      throw await toReadableError(thrown, "marketplace");
    }
  });
