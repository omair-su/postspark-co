/**
 * Purchased-credit wallet: read, spend and refund.
 *
 * Purchased credits are separate from the monthly plan allowance — the plan
 * allowance resets every month, purchased balances never expire. Every mutation
 * goes through a service-role RPC so a client can never mint credits.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CreditKind } from "@/lib/credits";

export type WalletBalance = { imageCredits: number; scheduleSlots: number };

export async function getWallet(userId: string): Promise<WalletBalance> {
  const { data } = await (supabaseAdmin as any)
    .from("credit_wallets")
    .select("image_credits, schedule_slots")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    imageCredits: data?.image_credits ?? 0,
    scheduleSlots: data?.schedule_slots ?? 0,
  };
}

/** Atomically spends purchased credits. False when the balance is short. */
export async function spendCredits(userId: string, kind: CreditKind, units = 1): Promise<boolean> {
  const { data, error } = await (supabaseAdmin as any).rpc("spend_credits", {
    _user_id: userId,
    _kind: kind,
    _units: units,
  });
  if (error) {
    console.error("spend_credits error:", error);
    return false;
  }
  return data === true;
}

/** Gives purchased credits back after a failed render or schedule. */
export async function refundCredits(userId: string, kind: CreditKind, units = 1): Promise<void> {
  const { error } = await (supabaseAdmin as any).rpc("refund_credits", {
    _user_id: userId,
    _kind: kind,
    _units: units,
  });
  if (error) console.error("refund_credits error:", error);
}
