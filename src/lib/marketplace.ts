/**
 * Marketplace pricing — single source of truth shared by the UI, the buy
 * server functions and the payment webhook.
 *
 * Card prices map to real Paddle prices (created in the payment provider with
 * these exact ids). Credit prices are spent from the buyer's purchased image
 * credit balance, so a pack can be sold for cash, for credits, or both.
 * Safe to import from client code — identifiers and copy only.
 */

export type PackTier = {
  priceId: string;
  price: number;
  label: string;
};

export const PACK_TIERS: PackTier[] = [
  { priceId: "pack_price_9", price: 9, label: "$9" },
  { priceId: "pack_price_19", price: 19, label: "$19" },
  { priceId: "pack_price_29", price: 29, label: "$29" },
  { priceId: "pack_price_49", price: 49, label: "$49" },
];

export function tierForPriceId(priceId?: string | null): PackTier | null {
  if (!priceId) return null;
  return PACK_TIERS.find((t) => t.priceId === priceId) ?? null;
}

export function isPackPriceId(priceId?: string | null): boolean {
  return !!tierForPriceId(priceId);
}

/** Credit prices a seller may choose (spent from purchased image credits). */
export const CREDIT_PRICE_OPTIONS = [10, 25, 50, 100] as const;

export const MAX_LISTING_TITLE = 90;
export const MAX_LISTING_DESCRIPTION = 400;

export type ListingSummary = {
  id: string;
  title: string;
  description: string | null;
  platforms: string[];
  priceId: string | null;
  creditPrice: number | null;
  salesCount: number;
  pieceCount: number;
  previewText: string | null;
  isMine: boolean;
  owned: boolean;
  createdAt: string;
};
