import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdmin, getAnon, makeSlug } from "@/lib/gallery.server";

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
    const sb = getAdmin();
    const { data, error } = await (sb as any)
      .from("repurpose_jobs")
      .select("id, public_slug, title, input_text, outputs, created_at, view_count, is_featured, user_id")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((data || []).map((j: any) => j.user_id).filter(Boolean)));
    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await (sb as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      for (const p of profs || []) {
        profileMap[p.user_id] = { name: p.display_name || "Anonymous", avatar: p.avatar_url || null };
      }
    }

    return (data || []).map((j: any) => ({
      id: j.id,
      slug: j.public_slug,
      title: j.title || j.input_text.slice(0, 80),
      preview: j.input_text.slice(0, 200),
      formats: j.outputs ? Object.keys(j.outputs) : [],
      createdAt: j.created_at,
      views: j.view_count || 0,
      featured: !!j.is_featured,
      author: profileMap[j.user_id] || { name: "Anonymous", avatar: null },
    }));
  });

export const getPublicPost = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(3).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const sb = getAdmin();
    const { data: row, error } = await (sb as any)
      .from("repurpose_jobs")
      .select("id, public_slug, title, input_text, outputs, created_at, view_count, user_id")
      .eq("public_slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    let author: { name: string; avatar: string | null } = { name: "Anonymous", avatar: null };
    if (row.user_id) {
      const { data: prof } = await (sb as any)
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", row.user_id)
        .maybeSingle();
      if (prof) author = { name: prof.display_name || "Anonymous", avatar: prof.avatar_url || null };
    }

    try {
      await (sb as any)
        .from("repurpose_jobs")
        .update({ view_count: (row.view_count || 0) + 1 })
        .eq("id", row.id);
    } catch {}

    return {
      slug: row.public_slug,
      title: row.title || row.input_text.slice(0, 80),
      input: row.input_text,
      outputs: (row.outputs || {}) as Record<string, string>,
      createdAt: row.created_at,
      author,
    };
  });