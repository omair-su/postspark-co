import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateRepurposedContent, generateOneFormat } from "@/lib/repurpose.server";

const FREE_MONTHLY_LIMIT = 3;

// Per-instance rate limiter: max 10 AI calls / minute / user
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    RATE_BUCKET.set(userId, arr);
    return true;
  }
  arr.push(now);
  RATE_BUCKET.set(userId, arr);
  return false;
}

export const getMonthlyUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    if (isPro) {
      return { used: 0, limit: -1, plan };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("repurpose_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) {
      console.error("Usage count error:", error);
      return { used: 0, limit: FREE_MONTHLY_LIMIT, plan };
    }

    return { used: count ?? 0, limit: FREE_MONTHLY_LIMIT, plan };
  });

export const repurposeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      inputText: z.string().min(1).max(50000),
      selectedTypes: z.array(z.string().min(1).max(20)).min(1).max(10),
      tone: z.string().max(50).optional(),
      customInstructions: z.string().max(500).optional(),
      language: z.string().max(40).optional(),
      tool: z.enum(["repurpose", "podcast", "humanizer", "reply_generator"]).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (rateLimited(userId)) {
      return { output: "", error: "Rate limit: please wait a minute and try again." };
    }

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

      const { count, error: countError } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

      if (!countError && (count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return { output: "", error: "LIMIT_REACHED" };
      }

      // Fire-and-forget: warn the user when they hit 2/3.
      if (!countError && (count ?? 0) === FREE_MONTHLY_LIMIT - 1) {
        try {
          const [{ supabaseAdmin }, { renderAndEnqueueEmail }] = await Promise.all([
            import("@/integrations/supabase/client.server"),
            import("@/lib/email/render-and-enqueue.server"),
          ]);
          const { data: au } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = au?.user?.email;
          if (email) {
            const month = new Date().toISOString().slice(0, 7);
            const { data: prof } = await supabaseAdmin
              .from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
            await renderAndEnqueueEmail({
              supabase: supabaseAdmin,
              templateName: "usage-warning",
              to: email,
              idempotencyKey: `usage-warning-${userId}-${month}`,
              templateData: {
                firstName: ((prof?.display_name as string | null) || "").split(" ")[0] || undefined,
                used: count ?? 0,
                limit: FREE_MONTHLY_LIMIT,
              },
            });
          }
        } catch (e) {
          console.warn("usage-warning email failed", e);
        }
      }
    }

    // Fetch active brand voice (Pro feature) to personalize output
    let brandVoiceSummary = "";
    let voiceProfile: any = undefined;
    if (isPro) {
      const { data: activeVoice } = await supabase
        .from("brand_voices")
        .select("style_summary, style_override, tone_sliders, dos, donts, emoji_density, sentence_length, cta_style")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      const v: any = activeVoice;
      brandVoiceSummary = (v?.style_override as string) || (v?.style_summary as string) || "";
      if (v) {
        voiceProfile = {
          tone_sliders: v.tone_sliders || undefined,
          dos: Array.isArray(v.dos) ? v.dos : undefined,
          donts: Array.isArray(v.donts) ? v.donts : undefined,
          emoji_density: v.emoji_density || undefined,
          sentence_length: v.sentence_length || undefined,
          cta_style: v.cta_style || undefined,
        };
      }
    }

    // Auto-apply Brand Kit preferred tone if user didn't explicitly choose one
    let effectiveTone = data.tone || "professional";
    let brandContext = "";
    let brandKitId: string | null = null;
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("id, brand_name, tagline, preferred_tone")
      .eq("user_id", userId)
      .maybeSingle();
    if (kit) {
      const k = kit as any;
      brandKitId = k.id ?? null;
      if (!data.tone && k.preferred_tone) effectiveTone = k.preferred_tone;
      const parts: string[] = [];
      if (k.brand_name) parts.push(`Brand: ${k.brand_name}`);
      if (k.tagline) parts.push(`Tagline: ${k.tagline}`);
      if (parts.length) brandContext = parts.join(" | ");
    }

    // Resolve active workspace (Agency users)
    let workspaceId: string | null = null;
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (membership?.workspace_id) workspaceId = membership.workspace_id as string;

    const mergedInstructions = brandContext
      ? `${data.customInstructions || ""}${data.customInstructions ? " " : ""}Brand context — ${brandContext}.`.trim()
      : (data.customInstructions || "");

    const result = await generateRepurposedContent(
      data.inputText,
      data.selectedTypes,
      effectiveTone,
      mergedInstructions,
      brandVoiceSummary,
      data.language || "English",
      voiceProfile,
    );

    let jobId: string | null = null;
    if (!result.error && result.output) {
      const { data: inserted } = await supabase
        .from("repurpose_jobs")
        .insert({
          user_id: userId,
          input_text: data.inputText,
          outputs: { raw: result.output },
          brand_kit_id: brandKitId,
          workspace_id: workspaceId,
          tool: data.tool || "repurpose",
        } as any)
        .select("id")
        .single();
      jobId = (inserted as any)?.id ?? null;
    }

    return { ...result, jobId };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      isFavorite: z.boolean(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("repurpose_jobs")
      .update({ is_favorite: data.isFavorite })
      .eq("id", data.jobId)
      .eq("user_id", userId);

    if (error) {
      console.error("Toggle favorite error:", error);
      return { success: false };
    }
    return { success: true };
  });

export const getAnalyticsData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: jobs, error } = await supabase
      .from("repurpose_jobs")
      .select("id, created_at, input_text, outputs")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Analytics error:", error);
      return { jobs: [] };
    }

    return { jobs: jobs || [] };
  });

export const bulkDeleteJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, count } = await supabase
      .from("repurpose_jobs")
      .delete({ count: "exact" })
      .in("id", data.ids)
      .eq("user_id", userId);
    if (error) {
      console.error("Bulk delete error:", error);
      return { success: false, deleted: 0 };
    }
    return { success: true, deleted: count ?? 0 };
  });

/* ---------------------------------------------------------------------------
 * FOCUSED PER-FORMAT GENERATION (Million-dollar quality engine)
 * Each call generates ONE format with full token budget for max quality.
 * packId groups multiple format calls into one repurpose_jobs row
 * so usage is counted per pack, not per format.
 * ------------------------------------------------------------------------ */

const FORMAT_ID = z.enum([
  "tweets","linkedin","instagram","facebook","thread","email","video","tiktok","podcast","seo","carousel",
]);

export const repurposeOneFormat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      packId: z.string().uuid(),
      isFirstInPack: z.boolean(),
      inputText: z.string().min(1).max(50000),
      format: FORMAT_ID,
      count: z.number().int().min(1).max(30).optional(),
      style: z.string().max(80).optional(),
      length: z.string().max(40).optional(),
      tone: z.string().max(50).optional(),
      styleModifiers: z.array(z.string().max(60)).max(15).optional(),
      customInstructions: z.string().max(500).optional(),
      language: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (rateLimited(userId)) {
      return { output: "", error: "Rate limit: please wait a minute and try again.", jobId: null };
    }

    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

    // Enforce monthly limit ONLY on the first format of a pack.
    if (data.isFirstInPack && !isPro) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const { count } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());
      if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return { output: "", error: "LIMIT_REACHED", jobId: null };
      }
    }

    // Brand Voice (Pro)
    let brandVoiceSummary = "";
    let voiceProfile: any = undefined;
    if (isPro) {
      const { data: voice } = await supabase
        .from("brand_voices")
        .select("style_summary, style_override, tone_sliders, dos, donts, emoji_density, sentence_length, cta_style")
        .eq("user_id", userId).eq("is_active", true).maybeSingle();
      const v: any = voice;
      brandVoiceSummary = (v?.style_override as string) || (v?.style_summary as string) || "";
      if (v) {
        voiceProfile = {
          tone_sliders: v.tone_sliders || undefined,
          dos: Array.isArray(v.dos) ? v.dos : undefined,
          donts: Array.isArray(v.donts) ? v.donts : undefined,
          emoji_density: v.emoji_density || undefined,
          sentence_length: v.sentence_length || undefined,
          cta_style: v.cta_style || undefined,
        };
      }
    }

    // Brand Kit (auto tone + context)
    let effectiveTone = data.tone || "professional";
    let brandContext = "";
    let brandKitId: string | null = null;
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("id, brand_name, tagline, preferred_tone")
      .eq("user_id", userId).maybeSingle();
    if (kit) {
      const k = kit as any;
      brandKitId = k.id ?? null;
      if (!data.tone && k.preferred_tone) effectiveTone = k.preferred_tone;
      const parts: string[] = [];
      if (k.brand_name) parts.push(`Brand: ${k.brand_name}`);
      if (k.tagline) parts.push(`Tagline: ${k.tagline}`);
      if (parts.length) brandContext = parts.join(" | ");
    }

    const mergedInstructions = brandContext
      ? `${data.customInstructions || ""}${data.customInstructions ? " " : ""}Brand context — ${brandContext}.`.trim()
      : (data.customInstructions || "");

    const result = await generateOneFormat({
      inputText: data.inputText,
      format: data.format,
      count: data.count,
      style: data.style,
      length: data.length,
      tone: effectiveTone,
      styleModifiers: data.styleModifiers || [],
      customInstructions: mergedInstructions,
      brandVoiceSummary,
      language: data.language || "English",
    });

    if (result.error || !result.output) {
      return { output: "", error: result.error || "Generation failed", jobId: null };
    }

    // Resolve workspace
    let workspaceId: string | null = null;
    const { data: membership } = await supabase
      .from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
    if (membership?.workspace_id) workspaceId = membership.workspace_id as string;

    const packTitle = data.inputText.replace(/\s+/g, " ").trim().slice(0, 120);

    // First format of pack → insert job row with packId
    if (data.isFirstInPack) {
      const { error: insErr } = await supabase
        .from("repurpose_jobs")
        .insert({
          id: data.packId,
          user_id: userId,
          input_text: data.inputText,
          title: packTitle,
          outputs: { [data.format]: result.output },
          brand_kit_id: brandKitId,
          workspace_id: workspaceId,
          tool: "repurpose",
        } as any);
      if (insErr) console.error("repurpose pack insert error:", insErr);
    } else {
      // Atomic JSONB merge via RPC — avoids parallel-write race that drops formats
      const { error: rpcErr } = await (supabase as any).rpc("append_repurpose_outputs", {
        _job_id: data.packId,
        _user_id: userId,
        _patch: { [data.format]: result.output },
        _title: packTitle,
      });
      if (rpcErr) {
        console.error("append_repurpose_outputs RPC error, falling back:", rpcErr);
        const { data: existing } = await supabase
          .from("repurpose_jobs").select("outputs").eq("id", data.packId).eq("user_id", userId).maybeSingle();
        const prev = ((existing as any)?.outputs as Record<string, unknown>) || {};
        await supabase
          .from("repurpose_jobs")
          .update({ outputs: { ...prev, [data.format]: result.output } as any, title: packTitle })
          .eq("id", data.packId).eq("user_id", userId);
      }
    }

    return { output: result.output, error: undefined as string | undefined, jobId: data.packId };
  });

export const saveToSwipeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(20000),
      platform: z.string().max(40).optional(),
      type: z.string().max(40).default("repurpose"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("swipe_file")
      .insert({
        user_id: userId,
        title: data.title,
        content: data.content,
        platform: data.platform || null,
        type: data.type,
      } as any);
    if (error) {
      console.error("swipe insert error", error);
      return { success: false };
    }
    return { success: true };
  });

