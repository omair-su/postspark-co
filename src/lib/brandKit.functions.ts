import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HEX = z.string().regex(/^#[0-9a-fA-F]{6}$/);

function wrap<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((e: unknown) => {
    console.error("[brandKit] error:", e);
    if (e instanceof Response) {
      throw new Error(e.statusText || "Request failed");
    }
    throw new Error((e as { message?: string })?.message || "Something went wrong. Please try again.");
  });
}

// ---------- Multi-profile: list / create / switch / delete ----------

export const listBrandKits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("List brand kits:", error);
      return { kits: [] };
    }
    return { kits: data || [] };
  }));

export const createBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().min(1).max(80) }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    // Deactivate others so the new one becomes the sole active kit
    await supabase.from("brand_kits").update({ is_active: false } as any).eq("user_id", userId);
    const { data: inserted, error } = await supabase
      .from("brand_kits")
      .insert({ user_id: userId, name: data.name, is_active: true } as any)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, kit: inserted };
  }));

export const setActiveBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    // Two-step: clear all, then set target
    await supabase.from("brand_kits").update({ is_active: false } as any).eq("user_id", userId);
    const { error } = await supabase
      .from("brand_kits")
      .update({ is_active: true } as any)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }));

export const deleteBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    // Prevent deleting the last kit
    const { data: all } = await supabase.from("brand_kits").select("id, is_active").eq("user_id", userId);
    if ((all?.length ?? 0) <= 1) {
      return { success: false, error: "You need at least one brand profile." };
    }
    const target = all!.find((k: any) => k.id === data.id);
    const { error } = await supabase.from("brand_kits").delete().eq("id", data.id).eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    // If we deleted the active one, activate the first remaining
    if (target?.is_active) {
      const next = all!.find((k: any) => k.id !== data.id);
      if (next) {
        await supabase.from("brand_kits").update({ is_active: true } as any).eq("id", next.id);
      }
    }
    return { success: true };
  }));

// ---------- Backwards-compatible active-kit fetch (used by repurpose) ----------

export const getBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => wrap(async () => {
    const { supabase, userId } = context;
    // Prefer active kit; fall back to any
    const { data: active } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (active) return { kit: active };
    const { data: any1 } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return { kit: any1 || null };
  }));

// ---------- Update fields on a specific (or the active) kit ----------

const UpsertSchema = z.object({
  id: z.string().uuid().optional(), // if omitted, targets active kit
  name: z.string().max(80).optional(),
  brand_name: z.string().max(100).optional().nullable(),
  brand_handle: z.string().max(50).optional().nullable(),
  logo_url: z.string().url().max(500).optional().nullable(),
  logo_variants: z.record(z.string(), z.string().max(500)).optional(),
  primary_color: HEX.optional(),
  secondary_color: HEX.optional(),
  accent_color: HEX.optional(),
  neutral_color: HEX.optional().nullable(),
  background_color: HEX.optional().nullable(),
  colors: z.record(z.string(), z.any()).optional(),
  saved_swatches: z.array(z.string()).optional(),
  font_heading: z.string().max(80).optional(),
  font_body: z.string().max(80).optional(),
  custom_fonts: z.array(z.object({
    family: z.string().max(80),
    url: z.string().url().max(500),
    format: z.string().max(20).optional(),
  })).optional(),
  tagline: z.string().max(200).optional().nullable(),
  preferred_tone: z.string().max(50).optional().nullable(),
  watermark_settings: z.record(z.string(), z.any()).optional(),
});

export const upsertBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(UpsertSchema.parse)
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { id, ...fields } = data;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) payload[k] = v;

    let targetId = id;
    if (!targetId) {
      const { data: active } = await supabase
        .from("brand_kits")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      targetId = active?.id;
    }

    if (targetId) {
      const { error } = await supabase
        .from("brand_kits")
        .update(payload as any)
        .eq("id", targetId)
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("brand_kits")
        .insert({ user_id: userId, is_active: true, ...(payload as any) });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  }));

export const deleteBrandLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid().optional(), slot: z.string().max(30).optional() }).parse(raw ?? {}))
  .handler(async ({ data, context }) => wrap(async () => {
    const { supabase, userId } = context;
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("id, logo_url, logo_variants")
      .eq("user_id", userId)
      .eq(data.id ? "id" : "is_active", data.id || (true as any))
      .maybeSingle();
    if (!kit) return { success: true };

    const slot = data.slot;
    const patch: Record<string, unknown> = {};
    if (!slot || slot === "primary") {
      patch.logo_url = null;
    }
    if (slot) {
      const variants = { ...(kit.logo_variants as Record<string, string> || {}) };
      delete variants[slot];
      patch.logo_variants = variants;
    }
    await supabase.from("brand_kits").update(patch as any).eq("id", kit.id);
    return { success: true };
  }));
