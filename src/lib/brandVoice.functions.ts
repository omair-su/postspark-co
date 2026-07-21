import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  summarizeBrandVoice,
  scrapeUrlSamples,
  generateVoicePreviews,
  scoreVoiceMatch,
} from "@/lib/brandVoice.server";

function wrap<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((e: unknown) => {
    console.error("[brandVoice] error:", e);
    if (e instanceof Response) {
      throw new Error(e.statusText || "Request failed");
    }
    throw new Error((e as { message?: string })?.message || "Something went wrong. Please try again.");
  });
}

async function requirePro(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  const plan = profile?.plan || "free";
  return plan === "pro" || plan === "agency";
}

export const listBrandVoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("brand_voices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("List brand voices:", error);
      return { voices: [] };
    }
    return { voices: data || [] };
  }));

export const getActiveBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("brand_voices")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    return { voice: data || null };
  }));

export const trainBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(1).max(80),
      samples: z.array(z.string().min(20).max(5000)).min(3).max(5),
      source_url: z.string().url().optional().nullable(),
    }).parse,
  )
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    if (!(await requirePro(supabase, userId))) {
      return { success: false, error: "Brand Voice training is a Pro feature. Upgrade to unlock." };
    }

    const result = await summarizeBrandVoice(data.samples);
    if (result.error || !result.summary) {
      return { success: false, error: result.error || "Failed to train voice." };
    }

    const { data: inserted, error } = await supabase
      .from("brand_voices")
      .insert({
        user_id: userId,
        name: data.name,
        samples: data.samples,
        style_summary: result.summary,
        quality_score: result.score,
        source_url: data.source_url ?? null,
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert brand voice:", error);
      return { success: false, error: "Failed to save voice." };
    }
    return { success: true, voice: inserted };
  }));

export const setActiveBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid().nullable() }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    await supabase.from("brand_voices").update({ is_active: false }).eq("user_id", userId);
    if (data.id) {
      const { error } = await supabase
        .from("brand_voices")
        .update({ is_active: true })
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) return { success: false };
    }
    return { success: true };
  }));

export const deleteBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("brand_voices")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) return { success: false };
    return { success: true };
  }));

// ---------- Phase 1 new endpoints ----------

const UpdateVoiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(80).optional(),
  style_override: z.string().max(4000).optional().nullable(),
  dos: z.array(z.string().max(120)).max(50).optional(),
  donts: z.array(z.string().max(120)).max(50).optional(),
  tone_sliders: z.object({
    formality: z.number().min(0).max(100),
    humor: z.number().min(0).max(100),
    enthusiasm: z.number().min(0).max(100),
    complexity: z.number().min(0).max(100),
  }).optional(),
  emoji_density: z.enum(["none", "minimal", "heavy"]).optional(),
  sentence_length: z.enum(["short", "balanced", "long"]).optional(),
  cta_style: z.enum(["soft", "direct"]).optional(),
});

export const updateBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(UpdateVoiceSchema.parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { id, ...fields } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) patch[k] = v;
    const { error } = await supabase
      .from("brand_voices")
      .update(patch as any)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }));

export const analyzeBrandVoiceFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    url: z.string().url(),
    name: z.string().min(1).max(80),
  }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    if (!(await requirePro(supabase, userId))) {
      return { success: false, error: "URL analysis is a Pro feature. Upgrade to unlock." };
    }
    const scraped = await scrapeUrlSamples(data.url);
    if (scraped.error || scraped.samples.length < 1) {
      return { success: false, error: scraped.error || "No samples found." };
    }
    const result = await summarizeBrandVoice(scraped.samples);
    if (result.error || !result.summary) {
      return { success: false, error: result.error || "Failed to analyze." };
    }
    const { data: inserted, error } = await supabase
      .from("brand_voices")
      .insert({
        user_id: userId,
        name: data.name,
        samples: scraped.samples,
        style_summary: result.summary,
        quality_score: result.score,
        source_url: data.url,
        is_active: false,
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, voice: inserted, sampleCount: scraped.samples.length };
  }));

export const generateVoiceSamples = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ voiceId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary, style_override")
      .eq("id", data.voiceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!voice?.style_summary && !voice?.style_override) {
      return { success: false, error: "Voice not trained yet." };
    }
    const summary = (voice.style_override as string) || (voice.style_summary as string);
    const result = await generateVoicePreviews(summary);
    if (result.error || !result.previews) {
      return { success: false, error: result.error || "Preview generation failed." };
    }
    return { success: true, previews: result.previews };
  }));

export const scoreContentAgainstVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    voiceId: z.string().uuid(),
    content: z.string().min(10).max(6000),
  }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary, style_override")
      .eq("id", data.voiceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!voice) return { success: false, error: "Voice not found." };
    const summary = (voice.style_override as string) || (voice.style_summary as string) || "";
    if (!summary) return { success: false, error: "Voice has no profile yet." };
    const result = await scoreVoiceMatch(summary, data.content);
    if (result.error) return { success: false, error: result.error };
    return { success: true, score: result.score };
  }));
