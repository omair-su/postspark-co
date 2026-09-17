/**
 * Delivery side of a marketplace sale: copy the listing's snapshot into the
 * buyer's own library and record the purchase.
 *
 * Runs with service role because it writes a row owned by the buyer on behalf
 * of a verified payment (webhook) or a settled credit spend.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function copyListingToLibrary(args: {
  listingId: string;
  buyerId: string;
  method: "credits" | "card";
  creditsSpent?: number;
  amountCents?: number;
  transactionId?: string;
}): Promise<{ success: boolean; jobId?: string }> {
  const admin = supabaseAdmin as any;

  const { data: listing, error } = await admin
    .from("marketplace_listings")
    .select("id, title, payload, sales_count")
    .eq("id", args.listingId)
    .maybeSingle();
  if (error || !listing) {
    console.error("marketplace: listing not found", args.listingId, error);
    return { success: false };
  }

  // Card purchases can be delivered twice if the provider retries the webhook.
  if (args.transactionId) {
    const { data: existing } = await admin
      .from("marketplace_purchases")
      .select("id, copied_job_id")
      .eq("listing_id", args.listingId)
      .eq("transaction_id", args.transactionId)
      .maybeSingle();
    if (existing) return { success: true, jobId: existing.copied_job_id ?? undefined };
  }

  const payload = (listing.payload ?? {}) as { outputs?: unknown; input_text?: string };

  const { data: job, error: jobError } = await admin
    .from("repurpose_jobs")
    .insert({
      user_id: args.buyerId,
      title: listing.title,
      input_text: payload.input_text || listing.title,
      outputs: payload.outputs ?? {},
      tool: "marketplace",
    })
    .select("id")
    .single();
  if (jobError) {
    console.error("marketplace: copy failed", jobError);
    return { success: false };
  }

  const { error: purchaseError } = await admin.from("marketplace_purchases").insert({
    listing_id: args.listingId,
    buyer_id: args.buyerId,
    method: args.method,
    credits_spent: args.creditsSpent ?? null,
    amount_cents: args.amountCents ?? null,
    transaction_id: args.transactionId ?? null,
    copied_job_id: job.id,
  });
  if (purchaseError) {
    console.error("marketplace: purchase record failed", purchaseError);
    return { success: false };
  }

  await admin
    .from("marketplace_listings")
    .update({ sales_count: (listing.sales_count ?? 0) + 1 })
    .eq("id", args.listingId);

  return { success: true, jobId: job.id as string };
}
