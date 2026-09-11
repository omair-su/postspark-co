import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateLimitedDurable } from "@/lib/rateLimit.server";
import { smartPackTitle } from "@/lib/packTitle";

/* ---------------------------------------------------------------------------
 * Recent packs rail — reopen, duplicate (re-run from the same source), compare.
 * ------------------------------------------------------------------------ */

export const listRecentPacks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(24).optional() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("repurpose_jobs")
      .select("id, title, created_at, outputs, is_favorite, input_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 12);

    if (error) {
      console.error("listRecentPacks error", error);
      return { packs: [] as Array<never> };
    }

    const packs = (rows || []).map((r: any) => {
      const outputs = (r.outputs && typeof r.outputs === "object" ? r.outputs : {}) as Record<string, string>;
      const formats = Object.keys(outputs).filter((k) => typeof outputs[k] === "string" && outputs[k]?.trim());
      return {
        id: r.id as string,
        title: (r.title as string | null)?.trim() || smartPackTitle(r.input_text || ""),
        createdAt: r.created_at as string,
        isFavorite: !!r.is_favorite,
        formats,
        preview: String(r.input_text || "").replace(/\s+/g, " ").slice(0, 160),
      };
    });
    return { packs };
  });

export const getPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ jobId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("repurpose_jobs")
      .select("id, title, created_at, outputs, input_text")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !row) return { pack: null };
    const outputs = ((row as any).outputs && typeof (row as any).outputs === "object"
      ? (row as any).outputs
      : {}) as Record<string, string>;
    return {
      pack: {
        id: row.id as string,
        title: ((row as any).title as string | null) || smartPackTitle((row as any).input_text || ""),
        createdAt: (row as any).created_at as string,
        inputText: String((row as any).input_text || ""),
        outputs,
      },
    };
  });

export const renamePack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ jobId: z.string().uuid(), title: z.string().min(1).max(120) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("repurpose_jobs")
      .update({ title: data.title.trim() })
      .eq("id", data.jobId)
      .eq("user_id", userId);
    return { success: !error };
  });

/* ---------------------------------------------------------------------------
 * Evergreen recycling — fresh angles on a past winner.
 * ------------------------------------------------------------------------ */

export const evergreenAngles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ jobId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (await rateLimitedDurable(userId, "repurpose")) {
      return { angles: [], error: "Rate limit: please wait a minute and try again." };
    }

    const { data: row } = await supabase
      .from("repurpose_jobs")
      .select("input_text, outputs")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) return { angles: [], error: "Pack not found" };

    const outputs = ((row as any).outputs || {}) as Record<string, string>;
    const sample = Object.values(outputs).filter(Boolean).slice(0, 2).join("\n\n").slice(0, 3000);
    const source = String((row as any).input_text || "").slice(0, 6000);

    const { callClaude } = await import("@/lib/anthropic.server");
    const res = await callClaude({
      systemPrompt:
        "You are a senior content strategist. You find genuinely NEW angles on material that already performed, " +
        "so it can be posted again without repeating itself. Reply with JSON only.",
      userPrompt:
        `Original source:\n${source}\n\nPreviously published from it:\n${sample}\n\n` +
        `Give 5 fresh angles that reuse this material without repeating the earlier posts. ` +
        `Each angle needs a different entry point (contrarian take, mistake story, data cut, ` +
        `beginner explainer, behind-the-scenes...).\n` +
        `Return JSON: {"angles":[{"title":"short label","angle":"one sentence brief","hook":"opening line"}]}`,
      maxTokens: 1400,
    });

    if (res.error || !res.text) return { angles: [], error: res.error || "Could not find new angles" };

    try {
      const json = res.text.slice(res.text.indexOf("{"), res.text.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json) as { angles?: Array<{ title?: string; angle?: string; hook?: string }> };
      const angles = (parsed.angles || [])
        .filter((a) => a?.title && a?.angle)
        .slice(0, 5)
        .map((a) => ({ title: String(a.title).slice(0, 90), angle: String(a.angle).slice(0, 400), hook: String(a.hook || "").slice(0, 300) }));
      if (!angles.length) return { angles: [], error: "Could not find new angles" };
      return { angles, error: undefined as string | undefined, source };
    } catch {
      return { angles: [], error: "Could not read the angle suggestions" };
    }
  });

/* ---------------------------------------------------------------------------
 * Bulk mode (Pro) — many URLs or one RSS/Atom feed in, sources out.
 * The client then runs one pack per source through the normal engine,
 * so quota, Brand Voice, and Brand Kit behave exactly as usual.
 * ------------------------------------------------------------------------ */

export const bulkExtractSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      urls: z.array(z.string().url().max(2000)).max(10).optional(),
      feedUrl: z.string().url().max(2000).optional(),
      max: z.number().int().min(1).max(10).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).maybeSingle();
    const plan = profile?.plan || "free";
    if (plan !== "pro" && plan !== "agency") {
      return { sources: [], error: "Bulk mode is a Pro feature. Upgrade to unlock." };
    }
    if (await rateLimitedDurable(userId, "repurpose")) {
      return { sources: [], error: "Rate limit: please wait a minute and try again." };
    }

    const max = data.max ?? 5;
    const { scrapeUrl, safeFetch } = await import("@/lib/import.server");

    let urls = (data.urls || []).map((u) => u.trim()).filter(Boolean);

    if (data.feedUrl) {
      try {
        const res = await safeFetch(data.feedUrl, { headers: { "User-Agent": "PostSpark/1.0" } });
        const xml = await res.text();
        const found: string[] = [];
        const rx = /<link[^>]*?(?:href="([^"]+)"[^>]*?\/?>|>\s*([^<]+?)\s*<\/link>)/gi;
        let m: RegExpExecArray | null;
        while ((m = rx.exec(xml)) && found.length < max * 3) {
          const href = (m[1] || m[2] || "").trim();
          if (/^https?:\/\//i.test(href) && !/\.(xml|rss|atom)(\?|$)/i.test(href)) found.push(href);
        }
        urls = [...new Set([...urls, ...found])];
      } catch (e: any) {
        return { sources: [], error: e?.message || "Could not read that feed" };
      }
    }

    urls = [...new Set(urls)].slice(0, max);
    if (!urls.length) return { sources: [], error: "No usable links found" };

    const out: Array<{ url: string; title: string; text: string; words: number; error?: string }> = [];
    const queue = [...urls];
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      for (;;) {
        const url = queue.shift();
        if (!url) return;
        try {
          const r = await scrapeUrl(url);
          const text = (r.text || "").slice(0, 50000);
          out.push({
            url,
            title: (r.title || smartPackTitle(text) || url).slice(0, 120),
            text,
            words: text.trim() ? text.trim().split(/\s+/).length : 0,
            ...(r.error || !text ? { error: r.error || "Nothing readable at this URL" } : {}),
          });
        } catch (e: any) {
          out.push({ url, title: url, text: "", words: 0, error: e?.message || "Fetch failed" });
        }
      }
    });
    await Promise.all(workers);

    // Preserve the requested order.
    out.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));
    return { sources: out, error: undefined as string | undefined };
  });
