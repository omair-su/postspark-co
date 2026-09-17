/**
 * Shared server-only helpers for image generation: storage persistence,
 * monthly quota accounting and history logging.
 *
 * Every persisted tile inserts exactly one row in `generated_images`, and the
 * monthly quota is derived from that table — so batches, streaming tiles,
 * edits, inpaints and outpaints all draw from the same allowance.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { refundCredits, spendCredits } from "@/lib/credits.server";
import { isSafePublicUrl, safeFetch } from "@/lib/safeFetch";

export const FREE_MONTHLY_LIMIT = 5; // free tier preview generations
export const PRO_MONTHLY_LIMIT = 500; // soft cap for Pro/Agency
export const FREE_REPURPOSE_LIMIT = 3;

export function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function isProPlan(plan: string) {
  return plan === "pro" || plan === "agency";
}

export async function getPlanFor(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  return profile?.plan || "free";
}

export async function countMonthlyGenerations(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("generated_images")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartIso());
  return count || 0;
}

export function monthlyImageLimit(plan: string) {
  return isProPlan(plan) ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
}

/**
 * Usage recorded in the durable ledger for this month (reserved + consumed).
 * The ledger — not a row count — is what enforcement is based on, so two
 * requests arriving together can no longer both pass the same check.
 */
export async function countLedgerUsage(userId: string, kind = "image"): Promise<number> {
  const monthStart = new Date();
  const period = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const { data } = await (supabaseAdmin as any)
    .from("usage_reservations")
    .select("units")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("period_start", period)
    .in("state", ["reserved", "consumed"]);
  return ((data as Array<{ units: number }>) || []).reduce((n, r) => n + (r.units || 1), 0);
}

/** How many renders the user may still start this month (indicative; reserve is authoritative). */
export async function imageQuotaRemaining(userId: string, plan: string): Promise<number> {
  const used = await countLedgerUsage(userId);
  return Math.max(0, monthlyImageLimit(plan) - used);
}

export type ImageReservation = { ok: true; id: string | null } | { ok: false };

/** Ledger kind used for renders paid for out of a purchased top-up pack. */
const WALLET_KIND = "image_wallet";

/**
 * Atomically reserves one render. The monthly plan allowance is spent first;
 * when it is exhausted, a purchased top-up credit is spent instead so a paid
 * pack actually unlocks more renders. Settle it afterwards: success keeps the
 * credit, failure gives it back (plan credit or purchased credit alike).
 */
export async function reserveImageQuota(
  userId: string,
  plan: string,
  units = 1,
  idempotencyKey?: string,
): Promise<ImageReservation> {
  const { data, error } = await (supabaseAdmin as any).rpc("reserve_usage", {
    _user_id: userId,
    _kind: "image",
    _limit: monthlyImageLimit(plan),
    _idempotency_key: idempotencyKey ?? null,
    _units: units,
  });
  if (error) {
    console.error("reserve_usage error:", error);
    // Fail closed: a ledger outage must not become free unlimited generation.
    return { ok: false };
  }
  const status = (data as any)?.status;
  if (status === "allowed" || status === "duplicate") {
    return { ok: true, id: ((data as any)?.reservation_id as string) ?? null };
  }
  return reserveFromWallet(userId, units, idempotencyKey);
}

/**
 * Plan allowance is gone — spend a purchased credit and mirror it in the ledger
 * so every existing settle path keeps working unchanged. The mirrored row uses
 * a separate kind (and an uncapped limit) so purchased renders never count
 * against next month's plan allowance.
 */
async function reserveFromWallet(
  userId: string,
  units: number,
  idempotencyKey?: string,
): Promise<ImageReservation> {
  const spent = await spendCredits(userId, "image", units);
  if (!spent) return { ok: false };

  const { data, error } = await (supabaseAdmin as any).rpc("reserve_usage", {
    _user_id: userId,
    _kind: WALLET_KIND,
    _limit: -1,
    _idempotency_key: idempotencyKey ?? null,
    _units: units,
  });
  const status = (data as any)?.status;
  if (error || (status !== "allowed" && status !== "duplicate")) {
    if (error) console.error("reserve_usage (wallet) error:", error);
    await refundCredits(userId, "image", units);
    return { ok: false };
  }
  return { ok: true, id: ((data as any)?.reservation_id as string) ?? null };
}

/** Settles a reservation. `success: false` releases the credit. */
export async function settleImageQuota(id: string | null, success: boolean): Promise<void> {
  if (!id) return;
  let walletRow: { user_id: string; units: number } | null = null;
  if (!success) {
    const { data } = await (supabaseAdmin as any)
      .from("usage_reservations")
      .select("user_id, units, kind, state")
      .eq("id", id)
      .maybeSingle();
    if (data?.kind === WALLET_KIND && data?.state === "reserved") {
      walletRow = { user_id: data.user_id as string, units: (data.units as number) || 1 };
    }
  }
  const { error } = await (supabaseAdmin as any).rpc("settle_usage", {
    _reservation_id: id,
    _success: success,
  });
  if (error) {
    console.error("settle_usage error:", error);
    return;
  }
  // A released purchased render must return to the wallet, not vanish.
  if (walletRow) await refundCredits(walletRow.user_id, "image", walletRow.units);
}


export async function checkRepurposeQuota(userId: string, plan: string): Promise<boolean> {
  if (isProPlan(plan)) return true;
  const { count } = await supabaseAdmin
    .from("repurpose_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartIso());
  return (count ?? 0) < FREE_REPURPOSE_LIMIT;
}

export async function logToHistory(opts: {
  userId: string;
  tool: string;
  title: string;
  inputText: string;
  outputs: Record<string, any>;
}) {
  try {
    await supabaseAdmin.from("repurpose_jobs").insert({
      user_id: opts.userId,
      tool: opts.tool,
      title: opts.title.slice(0, 200),
      input_text: opts.inputText.slice(0, 5000),
      outputs: opts.outputs,
    } as any);
  } catch (e) {
    console.error("logToHistory error:", e);
  }
}

/**
 * Persist a generated image (data: URL or remote http(s) URL) to storage and
 * insert a row in generated_images. Returns the public storage URL on success.
 */
export async function persistGeneratedImage(opts: {
  userId: string;
  imageUrl: string;
  prompt: string;
  style?: string;
  aspect?: string;
  template?: string;
  source?: string;
  model?: string | null;
  seed?: number | null;
  negativePrompt?: string | null;
  referenceUrl?: string | null;
  quality?: string | null;
}): Promise<string | null> {
  try {
    let bytes: Uint8Array | null = null;
    let mime = "image/png";

    if (opts.imageUrl.startsWith("data:")) {
      const m = opts.imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!m) return null;
      mime = m[1];
      bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    } else if (/^https?:\/\//i.test(opts.imageUrl)) {
      if (!isSafePublicUrl(opts.imageUrl)) return null;
      const r = await safeFetch(opts.imageUrl);
      if (!r.ok) return null;
      mime = (r.headers.get("content-type") || "image/png").split(";")[0];
      bytes = new Uint8Array(await r.arrayBuffer());
    } else {
      return null;
    }
    if (!bytes) return null;

    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    const path = `${opts.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) {
      console.error("persistGeneratedImage upload error:", upErr);
      return null;
    }
    const { data: pub } = supabaseAdmin.storage.from("generated-images").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const baseRow = {
      user_id: opts.userId,
      image_url: publicUrl,
      prompt: opts.prompt,
      style: opts.style,
      aspect: opts.aspect,
      template: opts.template,
      source: opts.source || "generate",
    };
    // Recipe columns are additive; if the migration hasn't been applied yet the
    // insert is retried without them so a render is never lost.
    const recipeRow = {
      ...baseRow,
      model: opts.model ?? null,
      seed: opts.seed ?? null,
      negative_prompt: opts.negativePrompt ?? null,
      reference_url: opts.referenceUrl ?? null,
      quality: opts.quality ?? null,
    };
    let { error: insErr } = await supabaseAdmin
      .from("generated_images")
      .insert(recipeRow as any);
    if (insErr) {
      const retry = await supabaseAdmin.from("generated_images").insert(baseRow as any);
      insErr = retry.error;
    }
    if (insErr) console.error("persistGeneratedImage insert error:", insErr);
    return publicUrl;
  } catch (e) {
    console.error("persistGeneratedImage error:", e);
    return null;
  }
}
