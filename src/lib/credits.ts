/**
 * Top-up packs (one-time purchases) — single source of truth for the UI and
 * for the payment webhook that grants the balance.
 *
 * `priceId` values are the human-readable Paddle price ids; changing one here
 * without creating the matching price silently breaks checkout.
 * Safe to import from client and server — identifiers and copy only.
 */

export type CreditKind = "image" | "schedule";

export type CreditPack = {
  priceId: string;
  kind: CreditKind;
  units: number;
  /** Price in USD, must match the Paddle price. */
  price: number;
  name: string;
  blurb: string;
  highlight?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    priceId: "image_credits_100",
    kind: "image",
    units: 100,
    price: 9,
    name: "100 image credits",
    blurb: "A week of heavy Image Studio work.",
  },
  {
    priceId: "image_credits_300",
    kind: "image",
    units: 300,
    price: 19,
    name: "300 image credits",
    blurb: "Best value for a full content month.",
    highlight: true,
  },
  {
    priceId: "image_credits_1000",
    kind: "image",
    units: 1000,
    price: 49,
    name: "1,000 image credits",
    blurb: "For agencies running several brands.",
  },
  {
    priceId: "schedule_slots_50",
    kind: "schedule",
    units: 50,
    price: 9,
    name: "50 schedule slots",
    blurb: "Extra scheduled posts on your calendar.",
  },
];

export function packForPriceId(priceId?: string | null): CreditPack | null {
  if (!priceId) return null;
  return CREDIT_PACKS.find((p) => p.priceId === priceId) ?? null;
}

/** Scheduled posts a free plan may keep on the calendar each month. */
export const FREE_MONTHLY_SCHEDULE_SLOTS = 10;

export function creditsPerImage(weight: number) {
  return Math.max(1, weight);
}
