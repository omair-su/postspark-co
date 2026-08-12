import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SwipeItem {
  id: string;
  title: string;
  content: string;
  platform: string | null;
  type: string;
  created_at: string;
  metadata: any;
}

export const listSwipeItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      type: z.string().max(40).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("swipe_file")
      .select("id, title, content, platform, type, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.type) q = q.eq("type", data.type);
    const { data: rows, error } = await q;
    if (error) {
      console.error("swipe list error", error);
      return { items: [] as SwipeItem[] };
    }
    return { items: (rows || []) as SwipeItem[] };
  });

export const addSwipeItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(20000),
      platform: z.string().max(40).optional(),
      type: z.string().max(40).default("hook"),
      metadata: z.record(z.string(), z.any()).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("swipe_file")
      .insert({
        user_id: userId,
        title: data.title,
        content: data.content,
        platform: data.platform || null,
        type: data.type,
        metadata: (data.metadata || null) as any,
      } as any)
      .select("id, title, content, platform, type, created_at, metadata")
      .single();
    if (error) {
      console.error("swipe insert error", error);
      return { success: false, item: null as SwipeItem | null };
    }
    return { success: true, item: row as SwipeItem };
  });

export const removeSwipeItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("swipe_file")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) {
      console.error("swipe delete error", error);
      return { success: false };
    }
    return { success: true };
  });
