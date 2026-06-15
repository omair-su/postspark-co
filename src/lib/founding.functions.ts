import { createServerFn } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Returns how many founding-lifetime spots remain out of 50.
// Counts subscriptions with the founding_lifetime price_id (set via webhook).
export const getFoundingSpots = createServerFn({ method: "GET" }).handler(async () => {
  const TOTAL = 50;
  try {
    const { count } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("price_id", "founding_lifetime_97");
    const claimed = count ?? 0;
    return {
      total: TOTAL,
      claimed,
      remaining: Math.max(0, TOTAL - claimed),
    };
  } catch {
    return { total: TOTAL, claimed: 0, remaining: TOTAL };
  }
});
