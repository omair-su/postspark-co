import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { humanizeText, generateReplies } from "@/server/copilot.server";

export const humanize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(20).max(8000),
      intensity: z.enum(["light", "medium", "strong"]).default("medium"),
    }).parse,
  )
  .handler(async ({ data }) => humanizeText(data.text, data.intensity));

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
    let voice = "";
    const { data: v } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    voice = v?.style_summary || "";
    return generateReplies(data.originalPost, data.goal, data.platform, voice);
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
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Pull lightweight user context: brand voice + last 3 jobs for grounding
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
- Recommend the best PostSpark tool for a goal (Repurpose, SEO Blog, Hook Lab, Image Studio, Carousel coming soon, Humanizer, Reply Generator)

User's brand voice (apply if relevant):
${voice || "(not set)"}

Recent topics they've worked on:
${recentTopics || "(none yet)"}

Rules:
- Keep replies under 200 words unless asked for long-form.
- Use markdown lists when offering multiple options.
- Never use em-dashes.`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { reply: "AI service not configured (LOVABLE_API_KEY missing).", error: "no_key" };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            ...data.messages,
          ],
        }),
      });
      if (res.status === 429) return { reply: "", error: "Rate limit reached. Try again in a moment." };
      if (res.status === 402) return { reply: "", error: "AI credits exhausted." };
      if (!res.ok) {
        const t = await res.text();
        console.error("Spark chat error:", res.status, t);
        return { reply: "", error: "AI request failed." };
      }
      const j: any = await res.json();
      const reply = j.choices?.[0]?.message?.content || "";
      return { reply };
    } catch (err) {
      console.error("Spark chat exception:", err);
      return { reply: "", error: "Failed to reach AI service." };
    }
  });
