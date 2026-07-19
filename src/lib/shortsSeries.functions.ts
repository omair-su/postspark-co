import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ShortsScript } from "@/lib/shorts.server";

export const listShortsSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("repurpose_jobs")
      .select("id, series_id, series_index, title, created_at, outputs")
      .eq("user_id", userId)
      .eq("tool", "shorts_studio")
      .not("series_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { series: [] as Array<{ series_id: string; created_at: string; first_title: string; episode_count: number }> };
    const groups = new Map<string, { series_id: string; created_at: string; first_title: string; episode_count: number }>();
    for (const row of (data || []) as any[]) {
      const id = row.series_id as string;
      const g = groups.get(id);
      if (!g) {
        groups.set(id, {
          series_id: id,
          created_at: row.created_at,
          first_title: (row.title || "Untitled series").replace(/\s*—\s*Ep\s*\d+$/i, ""),
          episode_count: 1,
        });
      } else {
        g.episode_count += 1;
        if (new Date(row.created_at) < new Date(g.created_at)) g.created_at = row.created_at;
      }
    }
    return { series: Array.from(groups.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)) };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const loadShortsSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ seriesId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("repurpose_jobs")
      .select("id, series_index, title, outputs, input_text")
      .eq("user_id", userId)
      .eq("series_id", data.seriesId)
      .order("series_index", { ascending: true });
    if (error || !rows?.length) return { scripts: [] as ShortsScript[], inputText: "" };
    return {
      scripts: (rows as any[]).map((r) => r.outputs as ShortsScript),
      inputText: (rows[0] as any).input_text as string,
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const deleteShortsSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ seriesId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    await supabase.from("repurpose_jobs").delete().eq("user_id", userId).eq("series_id", data.seriesId);
    return { ok: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
