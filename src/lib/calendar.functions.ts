import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateContentPlan } from "@/lib/calendar.server";

export const listScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
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
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const createScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(10000),
      platform: z.enum(["twitter", "threads", "linkedin", "instagram", "facebook", "tiktok", "youtube", "blog", "email"]),
      scheduled_for: z.string().datetime(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
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
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const updateScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(1).max(10000).optional(),
      platform: z.enum(["twitter", "threads", "linkedin", "instagram", "facebook", "tiktok", "youtube", "blog", "email"]).optional(),
      scheduled_for: z.string().datetime().optional(),
      status: z.enum(["scheduled", "published", "draft"]).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
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
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const deleteScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
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
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const bulkImportScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      posts: z.array(
        z.object({
          title: z.string().min(1).max(200),
          content: z.string().min(1).max(10000),
          platform: z.enum(["twitter","threads","linkedin","instagram","facebook","tiktok","youtube","blog","email"]),
          scheduled_for: z.string().datetime(),
        })
      ).min(1).max(200),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
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
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const generateAIPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      niche: z.string().min(3).max(500),
      platforms: z.array(z.enum(["twitter", "threads", "linkedin", "instagram", "facebook", "tiktok", "youtube", "blog", "email"])).min(1).max(5),
      cadence: z.enum(["daily", "3x", "weekly"]),
      days: z.number().int().min(7).max(30).default(30),
      startDate: z.string().datetime().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;

    // Free monthly cap: count toward repurpose_jobs (1 plan = 1 credit)
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());
      if ((count ?? 0) >= 10) {
        return { success: false, error: "LIMIT_REACHED", inserted: 0 };
      }
    }

    // Pull active brand voice + tone
    const [voiceRes, kitRes] = await Promise.all([
      supabase.from("brand_voices").select("style_summary").eq("user_id", userId).eq("is_active", true).maybeSingle(),
      supabase.from("brand_kits").select("preferred_tone").eq("user_id", userId).maybeSingle(),
    ]);

    const result = await generateContentPlan(
      data.niche,
      data.platforms,
      data.cadence,
      data.days,
      voiceRes.data?.style_summary || "",
      (kitRes.data as any)?.preferred_tone || "professional",
    );

    if (result.error || result.posts.length === 0) {
      return { success: false, error: result.error || "No plan returned.", inserted: 0 };
    }

    // Spread posts across days starting from startDate (default: today + 1)
    const start = data.startDate ? new Date(data.startDate) : new Date();
    if (!data.startDate) start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);

    const rows = result.posts.map((p) => {
      const when = new Date(start);
      when.setDate(when.getDate() + (p.day - 1));
      return {
        user_id: userId,
        title: p.title.slice(0, 200),
        content: p.content.slice(0, 10000),
        platform: p.platform,
        scheduled_for: when.toISOString(),
        status: "draft",
      };
    });

    const { error, count } = await supabase
      .from("scheduled_posts")
      .insert(rows, { count: "exact" });
    if (error) {
      console.error("AI plan insert error:", error);
      return { success: false, error: error.message, inserted: 0 };
    }

    // Log as a repurpose_job for usage tracking (1 credit)
    await supabase.from("repurpose_jobs").insert({
      user_id: userId,
      tool: "repurpose",
      input_text: `[AI Calendar Plan] ${data.niche}`,
      outputs: { plan_count: rows.length, cadence: data.cadence, days: data.days },
    } as any);

    return { success: true, inserted: count ?? rows.length };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });