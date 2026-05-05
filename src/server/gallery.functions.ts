import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdmin, getAnon, makeSlug } from "./gallery.server";

export const togglePublic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      jobId: z.string().uuid(),
      isPublic: z.boolean(),
      title: z.string().min(1).max(120).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("repurpose_jobs")
      .select("public_slug, title, input_text")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) throw new Error("Not found");

    let slug = existing.public_slug;
    if (data.isPublic && !slug) {
      slug = makeSlug(data.title || existing.input_text.slice(0, 40));
    }

    const update: { is_public: boolean; public_slug?: string | null; title?: string } = { is_public: data.isPublic };
    if (data.isPublic) update.public_slug = slug;
    if (data.title) update.title = data.title;

    const { error } = await supabase
      .from("repurpose_jobs")
      .update(update)
      .eq("id", data.jobId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { ok: true, slug };
  });

export const getGalleryFeed = createServerFn({ method: "GET" })
  .handler(async () => {
    // Public read: use anon client to leverage RLS public policy
    const sb = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await (sb as any)
      .from("repurpose_jobs")
      .select("id, public_slug, title, input_text, outputs, created_at, view_count")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return (data || []).map((j: any) => ({
      id: j.id,
      slug: j.public_slug,
      title: j.title || j.input_text.slice(0, 80),
      preview: j.input_text.slice(0, 200),
      formats: j.outputs ? Object.keys(j.outputs) : [],
      createdAt: j.created_at,
      views: j.view_count || 0,
    }));
  });

export const getPublicPost = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(3).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const sb = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: row, error } = await (sb as any)
      .from("repurpose_jobs")
      .select("id, public_slug, title, input_text, outputs, created_at")
      .eq("public_slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    // Fire-and-forget view increment via service role
    try {
      await (getAdmin() as any)
        .from("repurpose_jobs")
        .update({ view_count: ((row as any).view_count || 0) + 1 })
        .eq("id", row.id);
    } catch {}

    return {
      slug: row.public_slug,
      title: row.title || row.input_text.slice(0, 80),
      input: row.input_text,
      outputs: (row.outputs || {}) as Record<string, string>,
      createdAt: row.created_at,
    };
  });
