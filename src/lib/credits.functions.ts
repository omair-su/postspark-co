import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toReadableError } from "@/lib/serverErrors";
import { getWallet } from "@/lib/credits.server";
import {
  countLedgerUsage,
  monthlyImageLimit,
  getPlanFor,
  isProPlan,
} from "@/lib/imageQuota.server";
import { FREE_MONTHLY_SCHEDULE_SLOTS } from "@/lib/credits";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Everything the credits dashboard needs: this month's plan allowance, the
 * purchased balance that carries over, and scheduling headroom.
 */
export const getCreditSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabase, userId } = context;
      const plan = await getPlanFor(supabase, userId);
      const planLimit = monthlyImageLimit(plan);
      const planUsed = await countLedgerUsage(userId);
      const wallet = await getWallet(userId);

      const monthStart = new Date();
      const periodStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).toISOString();
      const { count: scheduledThisMonth } = await (supabaseAdmin as any)
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", periodStart);

      const { data: purchases } = await (supabaseAdmin as any)
        .from("credit_purchases")
        .select("kind, units, price_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      const scheduleAllowance = isProPlan(plan) ? -1 : FREE_MONTHLY_SCHEDULE_SLOTS;

      return {
        plan,
        image: {
          planLimit,
          planUsed,
          planRemaining: Math.max(0, planLimit - planUsed),
          purchased: wallet.imageCredits,
          total: Math.max(0, planLimit - planUsed) + wallet.imageCredits,
        },
        schedule: {
          allowance: scheduleAllowance,
          used: scheduledThisMonth ?? 0,
          purchased: wallet.scheduleSlots,
        },
        purchases: (purchases as Array<Record<string, unknown>>) ?? [],
      };
    } catch (thrown) {
      throw await toReadableError(thrown, "credits");
    }
  });
