import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: posts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_for", data.from)
      .lte("scheduled_for", data.to)
      .order("scheduled_for", { ascending: true });
    if (error) {
      console.error("List scheduled posts error:", error);
      return { posts: [] };
    }
    return { posts: posts || [] };
  });

export const createScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(10000),
      platform: z.enum(["twitter", "linkedin", "instagram", "facebook", "tiktok", "youtube", "blog", "email"]),
      scheduled_for: z.string().datetime(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: inserted, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: userId,
        title: data.title,
        content: data.content,
        platform: data.platform,
        scheduled_for: data.scheduled_for,
      })
      .select()
      .single();
    if (error) {
      console.error("Create scheduled post error:", error);
      return { success: false, error: "Failed to schedule post." };
    }
    return { success: true, post: inserted };
  });

export const updateScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(1).max(10000).optional(),
      platform: z.enum(["twitter", "linkedin", "instagram", "facebook", "tiktok", "youtube", "blog", "email"]).optional(),
      scheduled_for: z.string().datetime().optional(),
      status: z.enum(["scheduled", "published", "draft"]).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("scheduled_posts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("Update scheduled post error:", error);
      return { success: false };
    }
    return { success: true };
  });

export const deleteScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("scheduled_posts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) {
      console.error("Delete scheduled post error:", error);
      return { success: false };
    }
    return { success: true };
  });

export const bulkImportScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      posts: z.array(
        z.object({
          title: z.string().min(1).max(200),
          content: z.string().min(1).max(10000),
          platform: z.enum(["twitter","linkedin","instagram","facebook","tiktok","youtube","blog","email"]),
          scheduled_for: z.string().datetime(),
        })
      ).min(1).max(200),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Agency gate
    const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", userId).single();
    if (profile?.plan !== "agency") {
      return { success: false, error: "AGENCY_REQUIRED", inserted: 0 };
    }

    const rows = data.posts.map((p) => ({ ...p, user_id: userId }));
    const { error, count } = await supabase
      .from("scheduled_posts")
      .insert(rows, { count: "exact" });
    if (error) {
      console.error("Bulk import error:", error);
      return { success: false, error: error.message, inserted: 0 };
    }
    return { success: true, inserted: count ?? rows.length };
  });
