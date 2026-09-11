/**
 * Durable background image renders.
 *
 * A Replicate render can easily outlive the Worker's wall-clock budget, and a
 * user hitting Cancel used to throw the whole (already paid for) render away.
 * Every long render is now recorded in `image_jobs` with its provider poll URL
 * and full recipe, so the poll route — or the cron sweep — can finish it,
 * persist the image to the library, and settle the reserved credit exactly once.
 */
import { persistGeneratedImage, settleImageQuota } from "@/lib/imageQuota.server";

export type ImageJobRecipe = {
  userId: string;
  predictionId: string | null;
  pollUrl: string;
  model: string;
  prompt: string;
  fullPrompt?: string | null;
  style?: string | null;
  aspect?: string | null;
  template?: string | null;
  quality?: string | null;
  seed?: number | null;
  negativePrompt?: string | null;
  referenceUrl?: string | null;
  source?: string;
  reservationId?: string | null;
};

export async function createImageJob(recipe: ImageJobRecipe): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("image_jobs")
      .insert({
        user_id: recipe.userId,
        provider: "replicate",
        prediction_id: recipe.predictionId,
        poll_url: recipe.pollUrl,
        status: "pending",
        model: recipe.model,
        prompt: recipe.prompt,
        full_prompt: recipe.fullPrompt ?? null,
        style: recipe.style ?? null,
        aspect: recipe.aspect ?? null,
        template: recipe.template ?? null,
        quality: recipe.quality ?? null,
        seed: recipe.seed ?? null,
        negative_prompt: recipe.negativePrompt ?? null,
        reference_url: recipe.referenceUrl ?? null,
        source: recipe.source || "generate",
        reservation_id: recipe.reservationId ?? null,
      } as any)
      .select("id")
      .single();
    if (error) {
      console.error("createImageJob error:", error);
      return null;
    }
    return (data as any)?.id ?? null;
  } catch (e) {
    console.error("createImageJob threw:", e);
    return null;
  }
}

export type ImageJobState = {
  status: "pending" | "succeeded" | "failed";
  imageUrl?: string;
  seed?: number | null;
  error?: string;
};

/**
 * Advance one job: ask Replicate where it stands and, when it's done, persist the
 * image and settle the credit. Safe to call repeatedly and concurrently — the
 * terminal update only happens while the row is still `pending`.
 */
export async function advanceImageJob(jobId: string, userId?: string): Promise<ImageJobState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: job, error } = await supabaseAdmin
    .from("image_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !job) return { status: "failed", error: "Job not found" };
  const row: any = job;
  if (userId && row.user_id !== userId) return { status: "failed", error: "Job not found" };
  if (row.status === "succeeded")
    return { status: "succeeded", imageUrl: row.image_url, seed: row.seed };
  if (row.status === "failed" || row.status === "canceled")
    return { status: "failed", error: row.error || "Render failed" };

  // Safety valve: a job we can never finish must not hold its reserved credit
  // forever. After 30 minutes (or 60 poll attempts) it is failed and refunded.
  const ageMs = Date.now() - new Date(row.created_at).getTime();
  if (ageMs > 30 * 60 * 1000 || (row.attempts || 0) > 60) {
    return await failJob(jobId, row, "Render timed out — credit refunded");
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { status: "pending" };


  let prediction: any;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(row.poll_url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return { status: "pending" };
    prediction = await res.json();
  } catch {
    return { status: "pending" };
  }

  await supabaseAdmin
    .from("image_jobs")
    .update({ attempts: (row.attempts || 0) + 1 } as any)
    .eq("id", jobId);

  if (prediction?.status === "succeeded") {
    const out = prediction.output;
    const url = Array.isArray(out) ? out[0] : typeof out === "string" ? out : null;
    if (!url) return await failJob(jobId, row, "Render returned no image");
    const usedSeed =
      typeof prediction?.input?.seed === "number" ? prediction.input.seed : row.seed;
    const persisted = await persistGeneratedImage({
      userId: row.user_id,
      imageUrl: url,
      prompt: row.prompt,
      style: row.style || undefined,
      aspect: row.aspect || undefined,
      template: row.template || undefined,
      source: row.source || "generate",
      model: row.model,
      seed: usedSeed,
      negativePrompt: row.negative_prompt,
      referenceUrl: row.reference_url,
      quality: row.quality,
    });
    const finalUrl = persisted || url;
    const { data: claimed } = await supabaseAdmin
      .from("image_jobs")
      .update({ status: "succeeded", image_url: finalUrl, seed: usedSeed } as any)
      .eq("id", jobId)
      .eq("status", "pending")
      .select("id");
    // Only the call that flipped the row out of `pending` settles the credit,
    // so a concurrent poll + cron sweep can't double-count.
    if (claimed && claimed.length && row.reservation_id) {
      await settleImageQuota(row.reservation_id, true);
    }
    return { status: "succeeded", imageUrl: finalUrl, seed: usedSeed };
  }

  if (prediction?.status === "failed" || prediction?.status === "canceled") {
    return await failJob(jobId, row, prediction?.error || `Render ${prediction.status}`);
  }

  return { status: "pending" };
}

async function failJob(jobId: string, row: any, message: string): Promise<ImageJobState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: claimed } = await supabaseAdmin
    .from("image_jobs")
    .update({ status: "failed", error: message.slice(0, 500) } as any)
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id");
  if (claimed && claimed.length && row.reservation_id) {
    await settleImageQuota(row.reservation_id, false);
  }
  return { status: "failed", error: message };
}

/** Cron sweep: finish jobs whose browser tab was closed or cancelled. */
export async function sweepImageJobs(limit = 20): Promise<{ checked: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("image_jobs")
    .select("id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  const jobs = (data as any[]) || [];
  for (const j of jobs) {
    try {
      await advanceImageJob(j.id);
    } catch (e) {
      console.error("sweepImageJobs error", j.id, e);
    }
  }
  return { checked: jobs.length };
}
