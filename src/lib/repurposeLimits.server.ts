import { z } from "zod";

export const FREE_MONTHLY_LIMIT = 3;

// Per-instance rate limiter: max 10 AI calls / minute / user
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

export function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    RATE_BUCKET.set(userId, arr);
    return true;
  }
  arr.push(now);
  RATE_BUCKET.set(userId, arr);
  return false;
}

export const FORMAT_ID = z.enum([
  "tweets","linkedin","instagram","facebook","thread","email","video","tiktok","podcast","seo","carousel",
]);

export type PackBrandKit = { id: string; name: string | null; preferred_tone: string | null } | null;

const EMPTY_PACK_TTL_MS = 15 * 60 * 1000;

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Counts this month's repurpose jobs that actually produced output.
 * Packs whose generation fully failed (outputs = {}) must NOT burn a free credit;
 * stale empty packs are cleaned up opportunistically.
 */
export async function countMonthlyUsedJobs(supabase: any, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("repurpose_jobs")
    .select("id, outputs, created_at")
    .eq("user_id", userId)
    .gte("created_at", startOfMonthISO());

  if (error) {
    console.error("countMonthlyUsedJobs error:", error);
    // Fail closed so a read error cannot be used to skip the free-tier cap.
    return FREE_MONTHLY_LIMIT;
  }

  const rows = (data || []) as Array<{ id: string; outputs: unknown; created_at: string }>;
  const now = Date.now();
  const stale: string[] = [];
  let used = 0;

  for (const row of rows) {
    const o = row.outputs;
    const hasOutput = !!o && typeof o === "object" && Object.keys(o as object).length > 0;
    if (hasOutput) {
      used += 1;
    } else if (now - new Date(row.created_at).getTime() > EMPTY_PACK_TTL_MS) {
      stale.push(row.id);
    }
  }

  if (stale.length) {
    await supabase.from("repurpose_jobs").delete().in("id", stale).eq("user_id", userId);
  }

  return used;
}

export type ClaimPackResult = { ok: true } | { ok: false; error: "LIMIT_REACHED" | string };

/**
 * Atomically reserves a monthly free-tier slot (or no-ops if the pack exists).
 * Quota is enforced in Postgres under an advisory lock — never from client flags.
 */
export async function claimRepurposePack(
  supabase: any,
  opts: {
    packId: string;
    userId: string;
    inputText: string;
    title: string;
    brandKitId: string | null;
    workspaceId: string | null;
  },
): Promise<ClaimPackResult> {
  const { data, error } = await supabase.rpc("claim_repurpose_pack", {
    _pack_id: opts.packId,
    _user_id: opts.userId,
    _input_text: opts.inputText,
    _title: opts.title,
    _brand_kit_id: opts.brandKitId,
    _workspace_id: opts.workspaceId,
  });

  if (error) {
    console.error("claim_repurpose_pack RPC error:", error);
    return { ok: false, error: "Could not start this pack" };
  }

  if (data === "limit_reached") {
    return { ok: false, error: "LIMIT_REACHED" };
  }

  return { ok: true };
}

/** @deprecated Use claimRepurposePack — kept as an alias for pack reservation. */
export async function ensurePackRow(
  supabase: any,
  opts: {
    packId: string;
    userId: string;
    inputText: string;
    title: string;
    brandKitId: string | null;
    workspaceId: string | null;
  },
): Promise<ClaimPackResult> {
  return claimRepurposePack(supabase, opts);
}
