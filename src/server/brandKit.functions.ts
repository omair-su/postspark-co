import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HEX = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const getBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return { kit: data || null };
  });

export const upsertBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      brand_name: z.string().max(100).optional().nullable(),
      brand_handle: z.string().max(50).optional().nullable(),
      logo_url: z.string().url().max(500).optional().nullable(),
      primary_color: HEX.optional(),
      secondary_color: HEX.optional(),
      accent_color: HEX.optional(),
      font_heading: z.string().max(50).optional(),
      font_body: z.string().max(50).optional(),
      tagline: z.string().max(200).optional().nullable(),
      preferred_tone: z.string().max(50).optional().nullable(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) payload[k] = v;
    }

    const { data: existing } = await supabase
      .from("brand_kits")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("brand_kits")
        .update(payload as any)
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("brand_kits")
        .insert({ user_id: userId, ...(payload as any) });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  });
