import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase as anonClient } from "@/integrations/supabase/client";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Public listing — no auth required (uses anon key client; RLS allows is_public=true). */
export const listPublicTemplates = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      category: z.string().max(50).optional(),
      search: z.string().max(100).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    let q = (anonClient as any)
      .from("templates")
      .select("id, name, slug, description, category, tone, selected_types, custom_instructions, use_count, created_at")
      .eq("is_public", true)
      .order("use_count", { ascending: false })
      .limit(60);
    if (data.category) q = q.eq("category", data.category);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) {
      console.error("listPublicTemplates error", error);
      return { templates: [] };
    }
    return { templates: rows || [] };
  });

export const getPublicTemplateBySlug = createServerFn({ method: "POST" })
  .inputValidator(z.object({ slug: z.string().min(1).max(80) }).parse)
  .handler(async ({ data }) => {
    const { data: row } = await (anonClient as any)
      .from("templates")
      .select("id, name, slug, description, category, tone, selected_types, custom_instructions, use_count, created_at")
      .eq("is_public", true)
      .eq("slug", data.slug)
      .maybeSingle();
    return { template: row || null };
  });

export const togglePublishTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      isPublic: z.boolean(),
      category: z.string().max(50).optional(),
      description: z.string().max(280).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: tpl } = await supabase
      .from("templates")
      .select("name, slug")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!tpl) return { success: false, error: "Not found" };

    let slug = (tpl as any).slug as string | null;
    if (data.isPublic && !slug) {
      const base = slugify((tpl as any).name || "template");
      slug = `${base}-${data.id.slice(0, 6)}`;
    }

    const { error } = await supabase
      .from("templates")
      .update({
        is_public: data.isPublic,
        category: data.category ?? null,
        description: data.description ?? null,
        slug,
      } as any)
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) {
      console.error("togglePublishTemplate", error);
      return { success: false, error: error.message };
    }
    return { success: true, slug };
  });

/** Clone a public template into the caller's account. */
export const cloneTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ sourceId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Read public source via anon (RLS bypasses the user's "view own" policy via the public policy)
    const { data: source, error: srcErr } = await (anonClient as any)
      .from("templates")
      .select("name, tone, custom_instructions, selected_types, category, description")
      .eq("id", data.sourceId)
      .eq("is_public", true)
      .maybeSingle();
    if (srcErr || !source) {
      return { success: false, error: "Template not found or not public" };
    }

    const { data: inserted, error } = await supabase
      .from("templates")
      .insert({
        user_id: userId,
        name: `${(source as any).name} (copy)`,
        tone: (source as any).tone,
        custom_instructions: (source as any).custom_instructions || "",
        selected_types: (source as any).selected_types || ["tweets", "linkedin"],
      } as any)
      .select("id")
      .single();
    if (error) {
      console.error("cloneTemplate insert", error);
      return { success: false, error: error.message };
    }

    // bump use_count on source (ignore failure — might not have UPDATE permission for non-owners)
    try {
      await (anonClient as any).rpc; // no-op safe access
      // Best-effort increment via direct update; will silently no-op under RLS
      await (anonClient as any)
        .from("templates")
        .update({ use_count: ((source as any).use_count ?? 0) + 1 } as any)
        .eq("id", data.sourceId);
    } catch {}

    return { success: true, newId: (inserted as any).id };
  });
