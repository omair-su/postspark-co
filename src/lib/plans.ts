// SINGLE SOURCE OF TRUTH for plans, prices, cadence and entitlements.
// The billing page renders directly from this file; server-side gates map
// through `planFromProductId` so UI and backend never disagree.

export type PlanId = "free" | "pro" | "agency";
export type Cadence = "monthly" | "annual";

export type PlanPrice = {
  /** Paddle human-readable price id (external_id). */
  priceId: string;
  cadence: Cadence;
  /** Effective monthly cost shown in the UI. */
  perMonth: number;
  /** What the customer is actually billed per cycle. */
  billed: number;
  trialDays: number;
};

export type PlanDef = {
  id: PlanId;
  /** Paddle product external_id — matches `subscriptions.product_id`. */
  productId: string | null;
  name: string;
  tagline: string;
  prices: Record<Cadence, PlanPrice | null>;
  features: string[];
};

export const TRIAL_DAYS = 14;
export const FREE_MONTHLY_REPURPOSES = 3;

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    productId: null,
    name: "Free",
    tagline: "Try the full workflow, 3 repurposes a month.",
    prices: { monthly: null, annual: null },
    features: [
      `${FREE_MONTHLY_REPURPOSES} repurposes per month`,
      "All output formats",
      "1 brand kit",
      "Manual copy & export",
    ],
  },
  pro: {
    id: "pro",
    productId: "pro_plan",
    name: "Pro",
    tagline: "Unlimited repurposing for solo creators.",
    prices: {
      monthly: { priceId: "pro_monthly_trial", cadence: "monthly", perMonth: 24, billed: 24, trialDays: TRIAL_DAYS },
      annual: { priceId: "pro_annual_trial", cadence: "annual", perMonth: 19, billed: 228, trialDays: TRIAL_DAYS },
    },
    features: [
      "Unlimited repurposes",
      "Brand Voice training",
      "Brand Kit (logo, colors, fonts)",
      "Image Studio & carousels",
      "Scheduling & publishing to all platforms",
      "Priority generation",
    ],
  },
  agency: {
    id: "agency",
    productId: "agency_plan",
    name: "Agency",
    tagline: "Multi-client workspaces, approvals and white-label.",
    prices: {
      monthly: { priceId: "agency_monthly_trial", cadence: "monthly", perMonth: 49, billed: 49, trialDays: TRIAL_DAYS },
      annual: { priceId: "agency_annual_trial", cadence: "annual", perMonth: 39, billed: 468, trialDays: TRIAL_DAYS },
    },
    features: [
      "Everything in Pro",
      "Team workspaces & seats",
      "Unlimited client brand profiles",
      "Client approval links",
      "Agency analytics rollup",
      "White-label exports",
      "Bulk CSV calendar import",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "agency"];

/** Maps a Paddle product external_id (as stored on `subscriptions`) to a plan. */
export function planFromProductId(productId?: string | null): PlanId {
  if (productId === "agency_plan") return "agency";
  if (productId === "pro_plan") return "pro";
  return "free";
}

/** Detects billing cadence from a stored price id, including legacy ids. */
export function cadenceFromPriceId(priceId?: string | null): Cadence | null {
  if (!priceId) return null;
  if (/annual|yearly/i.test(priceId)) return "annual";
  if (/monthly/i.test(priceId)) return "monthly";
  return null;
}

/** Lifetime deal buyers get Pro entitlements forever. */
export const LIFETIME_PRICE_ID = "founding_lifetime_97";

export function isLifetimePrice(priceId?: string | null): boolean {
  return priceId === LIFETIME_PRICE_ID;
}

export function priceFor(plan: PlanId, cadence: Cadence): PlanPrice | null {
  return PLANS[plan].prices[cadence];
}

// ---------------------------------------------------------------------------
// Entitlements — the one place that decides what a plan unlocks.
// Server gates key off `profiles.plan` (same PlanId values).
// ---------------------------------------------------------------------------

export type Capability =
  | "unlimited_repurposes"
  | "brand_voice"
  | "brand_kit"
  | "image_studio"
  | "scheduling"
  | "multi_brand_profiles"
  | "team_workspaces"
  | "client_approvals"
  | "agency_analytics"
  | "white_label"
  | "bulk_calendar_import";

const ENTITLEMENTS: Record<PlanId, Capability[]> = {
  free: ["brand_kit"],
  pro: [
    "unlimited_repurposes",
    "brand_voice",
    "brand_kit",
    "image_studio",
    "scheduling",
    "multi_brand_profiles",
  ],
  agency: [
    "unlimited_repurposes",
    "brand_voice",
    "brand_kit",
    "image_studio",
    "scheduling",
    "multi_brand_profiles",
    "team_workspaces",
    "client_approvals",
    "agency_analytics",
    "white_label",
    "bulk_calendar_import",
  ],
};

export function can(plan: PlanId, capability: Capability): boolean {
  return ENTITLEMENTS[plan].includes(capability);
}

/** The cheapest plan that unlocks a capability — used by upgrade prompts. */
export function requiredPlanFor(capability: Capability): PlanId {
  return PLAN_ORDER.find((p) => can(p, capability)) ?? "agency";
}

export const CAPABILITY_LABELS: Record<Capability, string> = {
  unlimited_repurposes: "Unlimited repurposes",
  brand_voice: "Brand Voice",
  brand_kit: "Brand Kit",
  image_studio: "Image Studio",
  scheduling: "Scheduling & publishing",
  multi_brand_profiles: "Multiple brand profiles",
  team_workspaces: "Team workspaces",
  client_approvals: "Client approvals",
  agency_analytics: "Agency analytics",
  white_label: "White-label exports",
  bulk_calendar_import: "Bulk CSV import",
};
