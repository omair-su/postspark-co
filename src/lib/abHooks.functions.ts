import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateHookVariants } from "@/lib/abHooks.server";

export const generateJobHookVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid().optional(),
      inputText: z.string().min(10).max(20000),
      platform: z.enum(["twitter", "linkedin", "instagram", "tiktok", "youtube"]).default("twitter"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    if (plan !== "pro" && plan !== "agency") {
      return { variants: [], error: "A/B hook variants are a Pro feature." };
    }

    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const result = await generateHookVariants(
      data.inputText,
      data.platform,
      voice?.style_summary || "",
    );
    if (result.error) return { variants: [], error: result.error };

    if (data.jobId) {
      await supabase
        .from("repurpose_jobs")
        .update({ hook_variants: result.variants as any, winning_hook_index: null })
        .eq("id", data.jobId)
        .eq("user_id", userId);
    }

    return { variants: result.variants };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const setWinningHook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      index: z.number().int().min(0).max(2),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("repurpose_jobs")
      .update({ winning_hook_index: data.index })
      .eq("id", data.jobId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
