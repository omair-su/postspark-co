import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateSeoBlog, generateSeoOutline, refreshSeoBlog } from "@/server/seoBlog.server";

export const generateBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      keyword: z.string().min(2).max(120),
      wordTarget: z.number().int().min(600).max(4000),
      language: z.string().min(2).max(40).default("English"),
      articleType: z.string().max(50).optional(),
      audience: z.string().max(200).optional(),
      niche: z.string().max(80).optional(),
      tone: z.string().max(40).optional(),
      sections: z.array(z.string().max(80)).max(12).optional(),
      secondaryKeywords: z.string().max(300).optional(),
      competitorAngle: z.string().max(300).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) {
      return {
        title: "", metaDescription: "", slug: "", outline: [], markdown: "", faq: [],
        error: "SEO Blog Generator is a Pro feature. Upgrade to unlock.",
      };
    }

    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const result = await generateSeoBlog(
      data.topic,
      data.keyword,
      data.wordTarget,
      data.language,
      voice?.style_summary || "",
      {
        articleType: data.articleType,
        audience: data.audience,
        niche: data.niche,
        tone: data.tone,
        sections: data.sections,
        secondaryKeywords: data.secondaryKeywords,
        competitorAngle: data.competitorAngle,
      },
    );

    if (!result.error && (result as any).markdown) {
      try {
        await supabase.from("repurpose_jobs").insert({
          user_id: userId,
          tool: "seo_blog",
          input_text: `${data.topic} — ${data.keyword}`,
          title: (result as any).title || data.topic.slice(0, 120),
          outputs: {
            article: (result as any).markdown,
            meta_description: (result as any).metaDescription || "",
            slug: (result as any).slug || "",
          },
        } as any);
      } catch (e) {
        console.error("seo_blog history insert error:", e);
      }
    }

    return result;
  });

export const generateOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      keyword: z.string().min(2).max(120),
      language: z.string().min(2).max(40).default("English"),
      competitorUrls: z.array(z.string().url()).max(3).default([]),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) {
      return {
        title: "", outline: [], competitorHeadings: [], suggestedInternalLinks: [],
        error: "Competitor outline is a Pro feature. Upgrade to unlock.",
      };
    }

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("title, slug")
      .eq("status", "published")
      .limit(30);

    return generateSeoOutline(
      data.keyword,
      data.topic,
      data.language,
      data.competitorUrls,
      (posts as any) || [],
    );
  });

export const refreshOldBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      content: z.string().min(100).max(20000),
      keyword: z.string().min(2).max(120),
      language: z.string().min(2).max(40).default("English"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) {
      return { markdown: "", error: "Blog Refresh is a Pro feature. Upgrade to unlock." };
    }
    return refreshSeoBlog(data.content, data.keyword, data.language);
  });
