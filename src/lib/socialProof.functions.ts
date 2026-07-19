import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPostsThisWeek = createServerFn({ method: "GET" }).handler(async () => {
    try {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("repurpose_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  return { count: count ?? 0 };
} catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });

export const getPublishedTestimonials = createServerFn({ method: "GET" }).handler(async () => {
    try {
  const { data } = await supabaseAdmin
    .from("testimonials")
    .select("id,name,handle,role,avatar_initials,avatar_url,quote,rating")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .limit(12);
  return { testimonials: data ?? [] };
} catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });
