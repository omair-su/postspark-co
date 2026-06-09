import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateViralHooks } from "@/server/hookLab.server";

export const generateHooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      platform: z.enum(["twitter", "linkedin", "instagram", "tiktok", "youtube", "threads", "facebook"]),
      niche: z.string().max(80).optional(),
      audience: z.string().max(200).optional(),
      format: z.enum(["text", "spoken", "both"]).optional(),
      frameworks: z.array(z.string()).max(15).optional(),
      tone: z.string().max(50).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) {
      return { hooks: [], error: "Viral Hook Lab is a Pro feature. Upgrade to unlock." };
    }

    let brandVoiceSummary = "";
    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    brandVoiceSummary = voice?.style_summary || "";

    const result = await generateViralHooks(data.topic, data.platform, brandVoiceSummary, {
      niche: data.niche,
      audience: data.audience,
      format: data.format,
      frameworks: data.frameworks,
      tone: data.tone,
    });

    if (!result.error && result.hooks?.length) {
      const outputs: Record<string, string> = {};
      result.hooks.slice(0, 20).forEach((h: any, i: number) => {
        const txt = typeof h === "string" ? h : (h.text || h.hook || JSON.stringify(h));
        outputs[`hook_${i + 1}`] = txt;
      });
      try {
        await supabase.from("repurpose_jobs").insert({
          user_id: userId,
          tool: "hook_lab",
          input_text: data.topic,
          title: `Hooks for ${data.platform}: ${data.topic.slice(0, 80)}`,
          outputs,
        } as any);
      } catch (e) {
        console.error("hook_lab history insert error:", e);
      }
    }

    return result;
  });
