import { rateLimitedDurable } from "@/lib/rateLimit.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateOneFormat, refinePieceText } from "@/lib/repurpose.server";
import { prepareFormatGeneration, persistFormatOutput } from "@/lib/repurposePrep.server";
import {
  FREE_MONTHLY_LIMIT,
  FORMAT_ID,
  claimRepurposePack,
  countMonthlyUsedJobs,
  type PackBrandKit,
} from "@/lib/repurposeLimits.server";


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

    const used = await countMonthlyUsedJobs(supabase, userId);
    return { used, limit: FREE_MONTHLY_LIMIT, plan };
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


/**
 * Creates the pack row up-front and enforces the monthly limit once per pack,
 * so a failing first format can no longer strand the whole run.
 */
export const startRepurposePack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      packId: z.string().uuid(),
      inputText: z.string().min(1).max(50000),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const kit = await resolveActiveBrandKit(supabase, userId);

    let workspaceId: string | null = null;
    const { data: membership } = await supabase
      .from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
    if (membership?.workspace_id) workspaceId = membership.workspace_id as string;

    const claim = await claimRepurposePack(supabase, {
      packId: data.packId,
      userId,
      inputText: data.inputText,
      title: data.inputText.replace(/\s+/g, " ").trim().slice(0, 120),
      brandKitId: kit?.id ?? null,
      workspaceId,
    });
    if (!claim.ok) {
      return {
        ok: false,
        error: claim.error === "LIMIT_REACHED" ? "LIMIT_REACHED" : claim.error,
        packId: null as string | null,
        brandKit: null as PackBrandKit,
      };
    }

    // Free tier: warn by email when this pack takes them to their last credit.
    try {
      const { data: profile } = await supabase
        .from("profiles").select("plan").eq("user_id", userId).maybeSingle();
      const plan = profile?.plan || "free";
      if (plan !== "pro" && plan !== "agency") {
        const count = await countMonthlyUsedJobs(supabase, userId);
        if (count === FREE_MONTHLY_LIMIT - 1) {
          const [{ supabaseAdmin }, { renderAndEnqueueEmail }] = await Promise.all([
            import("@/integrations/supabase/client.server"),
            import("@/lib/email/render-and-enqueue.server"),
          ]);
          const { data: au } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = au?.user?.email;
          if (email) {
            const { data: prof } = await supabaseAdmin
              .from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
            await renderAndEnqueueEmail({
              supabase: supabaseAdmin,
              templateName: "usage-warning",
              to: email,
              idempotencyKey: `usage-warning-${userId}-${new Date().toISOString().slice(0, 7)}`,
              templateData: {
                firstName: ((prof?.display_name as string | null) || "").split(" ")[0] || undefined,
                used: count,
                limit: FREE_MONTHLY_LIMIT,
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn("usage-warning email failed", e);
    }

    return {
      ok: true,
      error: undefined as string | undefined,
      packId: data.packId as string | null,
      brandKit: (kit
        ? { id: kit.id, name: kit.name || kit.brand_name, preferred_tone: kit.preferred_tone }
        : null) as PackBrandKit,
    };
  });

export const repurposeOneFormat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      packId: z.string().uuid(),
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

    if (await rateLimitedDurable(userId, "repurpose")) {
      return { output: "", error: "Rate limit: please wait a minute and try again.", jobId: null };
    }

    const prep = await prepareFormatGeneration(supabase, userId, data);
    if (prep.error) return { output: "", error: prep.error, jobId: null };

    const result = await generateOneFormat(prep.opts);
    if (result.error || !result.output) {
      return { output: "", error: result.error || "Generation failed", jobId: null };
    }

    await persistFormatOutput(
      supabase, userId, data.packId, data.format, result.output, prep.packTitle,
    );

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


/* ---------------------------------------------------------------------------
 * SINGLE-PIECE REFINEMENT
 * Rewrites ONE post inside an existing pack. Costs no extra monthly credit —
 * the pack was already claimed — but is rate limited like any generation.
 * ------------------------------------------------------------------------ */

export const refinePiece = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      format: FORMAT_ID,
      pieceText: z.string().min(1).max(12000),
      instruction: z.enum(["regenerate", "shorter", "punchier", "specific"]),
      charLimit: z.number().int().min(80).max(100000).optional(),
      siblings: z.array(z.string().max(2000)).max(6).optional(),
      tone: z.string().max(50).optional(),
      styleModifiers: z.array(z.string().max(60)).max(15).optional(),
      customInstructions: z.string().max(500).optional(),
      language: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (await rateLimitedDurable(userId, "repurpose")) {
      return { output: "", error: "Rate limit: please wait a minute and try again." };
    }

    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("user_id", userId).maybeSingle();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";

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

    const kit = await resolveActiveBrandKit(supabase, userId);
    let effectiveTone = data.tone || "professional";
    if (kit && !data.tone && kit.preferred_tone) effectiveTone = kit.preferred_tone;
    const brandContext = brandKitPromptContext(kit);
    const mergedInstructions = brandContext
      ? `${data.customInstructions || ""}${data.customInstructions ? " " : ""}Brand context — ${brandContext}.`.trim()
      : (data.customInstructions || "");

    const result = await refinePieceText({
      pieceText: data.pieceText,
      format: data.format,
      instruction: data.instruction,
      charLimit: data.charLimit,
      siblings: data.siblings,
      tone: effectiveTone,
      styleModifiers: data.styleModifiers || [],
      customInstructions: mergedInstructions,
      brandVoiceSummary,
      language: data.language || "English",
      voiceProfile,
    });

    if (result.error || !result.output) {
      return { output: "", error: result.error || "Rewrite failed" };
    }
    return { output: result.output, error: undefined as string | undefined };
  });
