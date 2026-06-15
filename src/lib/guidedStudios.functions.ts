import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateFounderHooks, generateFounderLesson, generateCreatorPlaybook,
  generateProductLaunch, generateMarketingTip, editStudioOutput,
} from "@/server/guidedStudios.server";

const FREE_MONTHLY_LIMIT = 3;

const RATE_BUCKET = new Map<string, number[]>();
function rateLimited(userId: string) {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(userId) || []).filter(t => now - t < 60_000);
  if (arr.length >= 10) { RATE_BUCKET.set(userId, arr); return true; }
  arr.push(now); RATE_BUCKET.set(userId, arr); return false;
}

async function loadCtx(supabase: any, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", userId).single();
  const plan = profile?.plan || "free";
  const isPro = plan === "pro" || plan === "agency";
  let voice = "";
  if (isPro) {
    const { data: v } = await supabase.from("brand_voices").select("style_summary").eq("user_id", userId).eq("is_active", true).maybeSingle();
    voice = (v as any)?.style_summary || "";
  }
  return { plan, isPro, voice };
}

async function enforceQuota(supabase: any, userId: string, isPro: boolean): Promise<string | null> {
  if (isPro) return null;
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { count } = await supabase.from("repurpose_jobs").select("id", { count: "exact", head: true })
    .eq("user_id", userId).gte("created_at", start.toISOString());
  if ((count ?? 0) >= FREE_MONTHLY_LIMIT) return "LIMIT_REACHED";
  return null;
}

async function logJob(supabase: any, userId: string, inputText: string, output: string, tool: string) {
  try {
    const { data } = await supabase.from("repurpose_jobs").insert({
      user_id: userId, input_text: inputText, outputs: { raw: output }, tool,
    } as any).select("id").single();
    return (data as any)?.id ?? null;
  } catch { return null; }
}

/* ====================== FOUNDER LESSON ====================== */
export const generateFounderHooksFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    lesson: z.string().min(1).max(500),
    story: z.string().min(1).max(3000),
    audience: z.string().max(300).optional().default(""),
    lessonType: z.string().max(40).default("failure"),
    hookStyle: z.string().max(40).default("question"),
  }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { hooks: [], error: "Rate limit hit." };
    const { voice } = await loadCtx(supabase, userId);
    return generateFounderHooks(data.lesson, data.story, data.audience, data.lessonType, data.hookStyle, voice);
  });

export const generateFounderLessonFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    lesson: z.string().min(1).max(500),
    story: z.string().min(1).max(3000),
    takeaway: z.string().min(1).max(800),
    audience: z.string().max(300).optional().default(""),
    lessonType: z.string().max(40).default("failure"),
    platforms: z.array(z.string().max(20)).min(1).max(8),
    tone: z.string().max(40).default("authentic"),
    length: z.string().max(20).default("medium"),
    selectedHook: z.string().max(500).optional(),
  }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { output: "", error: "Rate limit hit." };
    const { isPro, voice } = await loadCtx(supabase, userId);
    const q = await enforceQuota(supabase, userId, isPro); if (q) return { output: "", error: q };
    const result = await generateFounderLesson({ ...data, voice });
    let jobId: string | null = null;
    if (!result.error) jobId = await logJob(supabase, userId, data.lesson, result.output, "founder_lesson");
    return { ...result, jobId };
  });

/* ====================== CREATOR PLAYBOOK ====================== */
export const generateCreatorPlaybookFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    topic: z.string().min(1).max(500),
    niche: z.string().max(100).default("general"),
    steps: z.string().min(1).max(5000),
    example: z.string().max(800).optional().default(""),
    format: z.string().max(40).default("step-by-step"),
    platforms: z.array(z.string().max(20)).min(1).max(8),
  }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { output: "", error: "Rate limit hit." };
    const { isPro, voice } = await loadCtx(supabase, userId);
    const q = await enforceQuota(supabase, userId, isPro); if (q) return { output: "", error: q };
    const result = await generateCreatorPlaybook({ ...data, voice });
    let jobId: string | null = null;
    if (!result.error) jobId = await logJob(supabase, userId, data.topic, result.output, "creator_playbook");
    return { ...result, jobId };
  });

/* ====================== PRODUCT LAUNCH ====================== */
export const generateProductLaunchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    productType: z.string().max(40),
    name: z.string().min(1).max(200),
    category: z.string().max(100).optional(),
    productUrl: z.string().max(500).optional(),
    whatItDoes: z.string().min(1).max(800),
    benefits: z.string().min(1).max(2000),
    audience: z.string().min(1).max(400),
    painPoint: z.string().max(500).optional(),
    price: z.string().max(40).optional(),
    priceTier: z.string().max(40).optional(),
    socialProof: z.string().max(400).optional(),
    urgency: z.string().max(200).optional(),
    tone: z.string().max(40).default("bold"),
    platforms: z.array(z.string().max(30)).min(1).max(15),
  }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { output: "", error: "Rate limit hit." };
    const { isPro, voice } = await loadCtx(supabase, userId);
    const q = await enforceQuota(supabase, userId, isPro); if (q) return { output: "", error: q };
    const result = await generateProductLaunch({ ...data, voice });
    let jobId: string | null = null;
    if (!result.error) jobId = await logJob(supabase, userId, data.name, result.output, "product_launch");
    return { ...result, jobId };
  });

/* ====================== MARKETING TIP ====================== */
export const generateMarketingTipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    channel: z.string().max(40),
    insight: z.string().min(1).max(500),
    stat: z.string().max(400).optional(),
    why: z.string().min(1).max(1500),
    howTo: z.string().min(1).max(1500),
    audience: z.string().min(1).max(200),
    angle: z.string().max(40).default("educational"),
    platforms: z.array(z.string().max(30)).min(1).max(8),
    weekPlan: z.boolean().optional().default(false),
  }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { output: "", error: "Rate limit hit." };
    const { isPro, voice } = await loadCtx(supabase, userId);
    const q = await enforceQuota(supabase, userId, isPro); if (q) return { output: "", error: q };
    const result = await generateMarketingTip({ ...data, voice });
    let jobId: string | null = null;
    if (!result.error) jobId = await logJob(supabase, userId, data.insight, result.output, "marketing_tip");
    return { ...result, jobId };
  });

/* ====================== EDIT WITH AI ====================== */
export const editStudioOutputFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    content: z.string().min(1).max(50000),
    instruction: z.string().min(1).max(500),
  }).parse)
  .handler(async ({ data, context }) => {
    if (rateLimited(context.userId)) return { output: "", error: "Rate limit hit." };
    return editStudioOutput(data.content, data.instruction);
  });

/* ====================== SWIPE FILE ====================== */
export const saveToSwipeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    type: z.string().max(40),
    title: z.string().min(1).max(200),
    platform: z.string().max(40).optional(),
    content: z.string().min(1).max(50000),
    metadata: z.record(z.string(), z.any()).optional(),
  }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase.from("swipe_file" as any).insert({
      user_id: userId, type: data.type, title: data.title, platform: data.platform || null,
      content: data.content, metadata: data.metadata || {},
    } as any).select("id").single();
    if (error) return { success: false, error: error.message };
    return { success: true, id: (row as any)?.id };
  });

export const listSwipeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase as any).from("swipe_file").select("*")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    return { items: data || [] };
  });
