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

/** Creates the pack row if it isn't there yet. Safe to call from every format. */
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
) {
  const { data: existing } = await supabase
    .from("repurpose_jobs")
    .select("id")
    .eq("id", opts.packId)
    .eq("user_id", opts.userId)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase.from("repurpose_jobs").insert({
    id: opts.packId,
    user_id: opts.userId,
    input_text: opts.inputText,
    title: opts.title,
    outputs: {},
    brand_kit_id: opts.brandKitId,
    workspace_id: opts.workspaceId,
    tool: "repurpose",
  } as any);
  // A duplicate-key error just means a sibling format won the race — fine.
  if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
    console.error("repurpose pack insert error:", error);
  }
}
