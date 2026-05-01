import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!;

function getAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}
function getUserClient(authHeader: string) {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}
async function getUserId(authHeader: string | undefined) {
  if (!authHeader) throw new Error("Unauthorized");
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user.id;
}

function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50) || "post";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

export const togglePublic = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      jobId: z.string().uuid(),
      isPublic: z.boolean(),
      title: z.string().min(1).max(120).optional(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const auth = getRequestHeader("authorization");
    if (!auth) throw new Error("Unauthorized");
    const userId = await getUserId(auth);
    const sb = getUserClient(auth);

    const { data: existing } = await (sb as any)
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

    const update: Record<string, unknown> = { is_public: data.isPublic };
    if (data.isPublic) update.public_slug = slug;
    if (data.title) update.title = data.title;

    const { error } = await (sb as any)
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
