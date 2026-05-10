import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function readingTime(md: string) {
  const words = md.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, status, published_at, scheduled_at, updated_at, cover_image_url, category:blog_categories(name, slug), author:blog_authors(name, slug)",
      )
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data || [];
  });

export const adminListMeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [cats, authors] = await Promise.all([
      context.supabase.from("blog_categories").select("id, slug, name").order("name"),
      context.supabase.from("blog_authors").select("id, slug, name").order("name"),
    ]);
    return { categories: cats.data || [], authors: authors.data || [] };
  });

export const adminGetPost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: post, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return post;
  });

const PostInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(120).optional(),
  excerpt: z.string().min(10).max(400),
  content_md: z.string().min(50),
  cover_image_url: z.string().url().nullable().optional(),
  author_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  meta_title: z.string().max(80).nullable().optional(),
  meta_description: z.string().max(180).nullable().optional(),
  status: z.enum(["draft", "scheduled", "published"]),
  scheduled_at: z.string().datetime().nullable().optional(),
});

export const adminUpsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => PostInput.parse(v))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    let slug = (data.slug || slugify(data.title)).toLowerCase();
    // Ensure uniqueness
    const { data: existing } = await context.supabase
      .from("blog_posts")
      .select("id, slug")
      .ilike("slug", `${slug}%`);
    const taken = new Set((existing || []).filter((r: any) => r.id !== data.id).map((r: any) => r.slug));
    let final = slug;
    let i = 2;
    while (taken.has(final)) final = `${slug}-${i++}`;
    slug = final;

    const payload: any = {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content_md: data.content_md,
      cover_image_url: data.cover_image_url ?? null,
      author_id: data.author_id ?? null,
      category_id: data.category_id ?? null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      status: data.status,
      scheduled_at: data.status === "scheduled" ? data.scheduled_at : null,
      reading_time_minutes: readingTime(data.content_md),
    };
    if (data.status === "published") {
      payload.published_at = new Date().toISOString();
    }

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("blog_posts")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
