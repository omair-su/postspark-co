import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeBrandVoice } from "@/lib/brandVoice.server";

export const listBrandVoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("brand_voices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("List brand voices error:", error);
      return { voices: [] };
    }
    return { voices: data || [] };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const getActiveBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("brand_voices")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    return { voice: data || null };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const trainBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(1).max(80),
      samples: z.array(z.string().min(20).max(5000)).min(3).max(5),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;

    // Pro/Agency gate
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    if (plan !== "pro" && plan !== "agency") {
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
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert brand voice error:", error);
      return { success: false, error: "Failed to save voice." };
    }
    return { success: true, voice: inserted };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const setActiveBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ id: z.string().uuid().nullable() }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;

    // Deactivate all first
    const { error: clearErr } = await supabase
      .from("brand_voices")
      .update({ is_active: false })
      .eq("user_id", userId);
    if (clearErr) {
      console.error("Clear active voice error:", clearErr);
      return { success: false };
    }

    if (data.id) {
      const { error } = await supabase
        .from("brand_voices")
        .update({ is_active: true })
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) {
        console.error("Set active voice error:", error);
        return { success: false };
      }
    }
    return { success: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const deleteBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("brand_voices")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) {
      console.error("Delete brand voice error:", error);
      return { success: false };
    }
    return { success: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
