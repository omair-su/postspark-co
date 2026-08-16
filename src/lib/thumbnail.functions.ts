import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildThumbnailConcept } from "@/lib/thumbnail.server";

export const analyzeThumbnailSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      mode: z.enum(["youtube", "idea"]),
      url: z.string().max(2000).optional(),
      idea: z.string().max(4000).optional(),
      preset: z.string().max(40).default("youtube"),
    }).parse,
  )
  .handler(async ({ data }) => {
    try {
      return await buildThumbnailConcept(data);
    } catch (e: any) {
      console.error("[thumbnail] analyze error:", e);
      return {
        headlines: [],
        subheads: [],
        style: "mrbeast" as const,
        visualPrompt: "",
        topic: "",
        error: e?.message || "Analysis failed. Please try again.",
      };
    }
  });

export const listRecentThumbnails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generated_images")
      .select("id, image_url, prompt, aspect, template, created_at")
      .eq("user_id", userId)
      .in("template", ["thumbnail", "blog-cover"])
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) return { items: [] as any[] };
    return { items: data ?? [] };
  });
