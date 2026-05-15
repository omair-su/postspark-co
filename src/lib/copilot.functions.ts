import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { humanizeText, generateReplies } from "@/server/copilot.server";

const FREE_MONTHLY_LIMIT = 10;

// Simple per-instance rate limiter shared across copilot tools
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;
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

async function checkUsageAndPlan(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  const plan = profile?.plan || "free";
  const isPro = plan === "pro" || plan === "agency";
  if (isPro) return { ok: true as const, plan, isPro };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("repurpose_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());
  if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
    return { ok: false as const, plan, isPro, error: "LIMIT_REACHED" };
  }
  return { ok: true as const, plan, isPro };
}

export const humanize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(20).max(8000),
      intensity: z.enum(["light", "medium", "strong"]).default("medium"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { output: "", error: "Rate limit: please wait a minute and try again." };

    const usage = await checkUsageAndPlan(supabase, userId);
    if (!usage.ok) return { output: "", error: "LIMIT_REACHED" };

    const result = await humanizeText(data.text, data.intensity);
    if (result.error || !result.output) return result;

    // Save to history
    await supabase.from("repurpose_jobs").insert({
      user_id: userId,
      tool: "humanizer",
      input_text: data.text,
      title: `Humanized (${data.intensity})`,
      outputs: { humanized: result.output },
    } as any);

    return result;
  });

export const replies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      originalPost: z.string().min(5).max(4000),
      goal: z.string().min(3).max(200),
      platform: z.enum(["twitter", "linkedin", "instagram", "facebook", "tiktok"]).default("twitter"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { replies: [], error: "Rate limit: please wait a minute and try again." };

    const usage = await checkUsageAndPlan(supabase, userId);
    if (!usage.ok) return { replies: [], error: "LIMIT_REACHED" };

    let voice = "";
    const { data: v } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    voice = v?.style_summary || "";

    const result = await generateReplies(data.originalPost, data.goal, data.platform, voice);
    if (result.error || !result.replies?.length) return result;

    const outputs: Record<string, string> = {};
    result.replies.forEach((r, i) => { outputs[`reply_${i + 1}`] = r; });

    await supabase.from("repurpose_jobs").insert({
      user_id: userId,
      tool: "reply_generator",
      input_text: data.originalPost,
      title: `Replies for ${data.platform}: ${data.goal.slice(0, 60)}`,
      outputs,
    } as any);

    return result;
  });

// ===== Spark Copilot conversations =====

export const listCopilotConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("copilot_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    return { conversations: (data as any[]) || [] };
  });

export const getCopilotConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: conv } = await supabase
      .from("copilot_conversations")
      .select("id, title, created_at, updated_at")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!conv) return { conversation: null, messages: [] };
    const { data: msgs } = await supabase
      .from("copilot_messages")
      .select("role, content, created_at")
      .eq("conversation_id", data.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return { conversation: conv as any, messages: (msgs as any[]) || [] };
  });

export const deleteCopilotConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("copilot_conversations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    return { success: !error };
  });

export const sparkChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(8000),
        }),
      ).min(1).max(40),
      conversationId: z.string().uuid().nullable().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { reply: "", error: "Rate limit reached. Try again in a moment.", conversationId: data.conversationId ?? null };

    let voice = "";
    const { data: v } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    voice = v?.style_summary || "";

    const { data: jobs } = await supabase
      .from("repurpose_jobs")
      .select("input_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    const recentTopics = (jobs || [])
      .map((j: any, i: number) => `${i + 1}. ${(j.input_text || "").slice(0, 120)}`)
      .join("\n");

    const system = `You are Spark Copilot, PostSpark's AI assistant for content creators. Be concise, friendly, and action-oriented. Give specific, ready-to-use answers — never generic advice.

Capabilities you can help with:
- Brainstorm topics, hooks, angles
- Rewrite or shorten any text
- Suggest tweet/LinkedIn/IG variants
- Draft replies, emails, captions
- Recommend the best PostSpark tool for a goal (Repurpose, SEO Blog, Hook Lab, Image Studio, Humanizer, Reply Generator)

User's brand voice (apply if relevant):
${voice || "(not set — suggest training one in Settings → Brand Voice)"}

Recent topics they've worked on:
${recentTopics || "(none yet)"}

Rules:
- Keep replies under 200 words unless asked for long-form.
- Use markdown lists when offering multiple options.
- Never use em-dashes.`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { reply: "AI service not configured (LOVABLE_API_KEY missing).", error: "no_key", conversationId: data.conversationId ?? null };

    let reply = "";
    let aiError: string | null = null;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });
      if (res.status === 429) aiError = "Rate limit reached. Try again in a moment.";
      else if (res.status === 402) aiError = "AI credits exhausted.";
      else if (!res.ok) {
        const t = await res.text();
        console.error("Spark chat error:", res.status, t);
        aiError = "AI request failed.";
      } else {
        const j: any = await res.json();
        reply = j.choices?.[0]?.message?.content || "";
      }
    } catch (err) {
      console.error("Spark chat exception:", err);
      aiError = "Failed to reach AI service.";
    }

    if (aiError) return { reply: "", error: aiError, conversationId: data.conversationId ?? null };

    // Persist conversation
    let convId = data.conversationId ?? null;
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    if (!convId) {
      const title = (lastUser?.content || "New conversation").slice(0, 80);
      const { data: created } = await supabase
        .from("copilot_conversations")
        .insert({ user_id: userId, title } as any)
        .select("id")
        .single();
      convId = (created as any)?.id ?? null;
    } else {
      // bump updated_at
      await supabase.from("copilot_conversations").update({ updated_at: new Date().toISOString() } as any).eq("id", convId).eq("user_id", userId);
    }

    if (convId) {
      const rows: any[] = [];
      if (lastUser) rows.push({ conversation_id: convId, user_id: userId, role: "user", content: lastUser.content });
      rows.push({ conversation_id: convId, user_id: userId, role: "assistant", content: reply });
      if (rows.length) await supabase.from("copilot_messages").insert(rows);
    }

    return { reply, conversationId: convId };
  });
