import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  author: { name: string; slug: string; avatar_url: string | null } | null;
  category: { name: string; slug: string } | null;
};

export type BlogPostFull = BlogPostListItem & {
  content_md: string;
  meta_title: string | null;
  meta_description: string | null;
  author: { name: string; slug: string; avatar_url: string | null; bio: string | null; twitter_handle: string | null; linkedin_url: string | null } | null;
};

export type BlogCategory = { id: string; slug: string; name: string; description: string | null };
export type BlogAuthor = { id: string; slug: string; name: string; bio: string | null; avatar_url: string | null; twitter_handle: string | null; linkedin_url: string | null };

const POST_SELECT = `id, slug, title, excerpt, cover_image_url, published_at, reading_time_minutes,
  author:blog_authors(name, slug, avatar_url),
  category:blog_categories(name, slug)`;

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      categorySlug: z.string().optional(),
      authorSlug: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).parse(input ?? {})
  )
  .handler(async ({ data }): Promise<BlogPostListItem[]> => {
    let query = supabaseAdmin
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(data.limit);

    if (data.categorySlug) {
      const { data: cat } = await supabaseAdmin.from("blog_categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (!cat) return [];
      query = query.eq("category_id", cat.id);
    }
    if (data.authorSlug) {
      const { data: author } = await supabaseAdmin.from("blog_authors").select("id").eq("slug", data.authorSlug).maybeSingle();
      if (!author) return [];
      query = query.eq("author_id", author.id);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as BlogPostListItem[];
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<(BlogPostFull & { html: string }) | null> => {
    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .select(`id, slug, title, excerpt, content_md, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description,
        author:blog_authors(name, slug, avatar_url, bio, twitter_handle, linkedin_url),
        category:blog_categories(name, slug)`)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const { renderMarkdown } = await import("./markdown.server");
    const html = renderMarkdown((row as any).content_md || "");
    return { ...(row as any), html } as BlogPostFull & { html: string };
  });


export const listCategories = createServerFn({ method: "GET" }).handler(async (): Promise<BlogCategory[]> => {
  const { data, error } = await supabaseAdmin.from("blog_categories").select("id, slug, name, description").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<BlogCategory | null> => {
    const { data: row, error } = await supabaseAdmin.from("blog_categories").select("id, slug, name, description").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

export const getAuthorBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<BlogAuthor | null> => {
    const { data: row, error } = await supabaseAdmin
      .from("blog_authors")
      .select("id, slug, name, bio, avatar_url, twitter_handle, linkedin_url")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });
