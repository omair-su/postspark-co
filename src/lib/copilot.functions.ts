import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { humanizeText, generateReplies } from "@/server/copilot.server";

const FREE_MONTHLY_LIMIT = 10;

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
      purpose: z.string().max(60).optional(),
      style: z.string().max(40).optional(),
      preserve: z.array(z.string().max(40)).max(8).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { output: "", error: "Rate limit: please wait a minute and try again." };

    const usage = await checkUsageAndPlan(supabase, userId);
    if (!usage.ok) return { output: "", error: "LIMIT_REACHED" };

    const result = await humanizeText(data.text, data.intensity, {
      purpose: data.purpose,
      style: data.style,
      preserve: data.preserve,
    });
    if (result.error || !result.output) return result;

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
      platform: z.enum(["twitter", "linkedin", "instagram", "facebook", "tiktok", "threads"]).default("twitter"),
      tone: z.string().min(2).max(60).optional(),
      length: z.enum(["short", "medium", "long"]).optional(),
      count: z.number().int().min(3).max(10).optional(),
      addCta: z.boolean().optional(),
      ctaText: z.string().max(200).optional(),
      useBrandVoice: z.boolean().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { replies: [], error: "Rate limit: please wait a minute and try again." };

    const usage = await checkUsageAndPlan(supabase, userId);
    if (!usage.ok) return { replies: [], error: "LIMIT_REACHED" };

    let voice = "";
    if (data.useBrandVoice !== false) {
      const { data: v } = await supabase
        .from("brand_voices")
        .select("style_summary")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      voice = v?.style_summary || "";
    }

    const result = await generateReplies(data.originalPost, data.goal, data.platform, voice, {
      tone: data.tone,
      length: data.length,
      count: data.count,
      addCta: data.addCta,
      ctaText: data.ctaText,
    });
    if (result.error || !result.replies?.length) return result;

    const outputs: Record<string, string> = {};
    result.replies.forEach((r, i) => { outputs[`reply_${i + 1}`] = r.text; });

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
      currentTool: z.string().max(80).nullable().optional(),
      contextContent: z.string().max(8000).nullable().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (rateLimited(userId)) return { reply: "", error: "Rate limit reached. Try again in a moment.", conversationId: data.conversationId ?? null };

    const usage = await checkUsageAndPlan(supabase, userId);
    if (!usage.ok) return { reply: "", error: "LIMIT_REACHED", conversationId: data.conversationId ?? null };

    let voice = "";
    const { data: v } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    voice = v?.style_summary || "";

    const contextBlock = data.contextContent && data.contextContent.trim()
      ? `\n\nUser's content context (use this for any follow-up requests):\n"""${data.contextContent.slice(0, 4000)}"""`
      : "";

    const system = `You are Spark — PostSpark's AI creative assistant.

YOUR IDENTITY:
- Expert in content creation, copywriting, social media strategy, SEO, and email marketing
- You know PostSpark deeply: Repurpose Studio, Hook Lab, SEO Blog, AI Humanizer, Carousel Generator, Image Studio, Brand Voice
- Direct, helpful, creative — never robotic
- You write copy, you don't talk ABOUT writing copy
- When asked to write something, you write it immediately, fully, ready to use

YOUR VOICE:
- Direct and confident — no "I'd be happy to help!"
- Practical — give the thing, don't preface giving it
- Never say "Certainly!" "Absolutely!" "Great question!" "Of course!"
- Use emojis only if the user does first
- Never use em-dashes — use commas, parentheses, or two sentences

POSTSPARK FEATURE GUIDANCE:
- "Repurpose content" → Repurpose Studio (/dashboard/repurpose)
- "Write hooks" → Hook Lab (/dashboard/hook-lab)
- "SEO article" → SEO Blog Generator (/dashboard/seo-blog)
- "Fix AI text" → AI Humanizer (/dashboard/humanizer)
- "Make carousel" → Carousel Generator (/dashboard/carousel)
- "Brand voice" → Brand Kit (/dashboard/brand-kit)

Current tool context: ${data.currentTool || "Dashboard"}

User's brand voice (apply if relevant):
${voice || "(not set — suggest training one in Settings → Brand Voice)"}${contextBlock}

Rules:
- Keep replies under 250 words unless asked for long-form
- Use markdown lists when offering multiple options
- Produce content immediately. Skip "Sure!", "Here you go", any preamble.`;

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
