import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateSeoBlog,
  generateSeoOutline,
  refreshSeoBlog,
  rewriteBlogSection,
  generateMetaVariants,
} from "@/lib/seoBlog.server";

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
      approvedOutline: z
        .array(z.object({ h2: z.string().max(200), h3: z.array(z.string().max(200)).max(8).optional() }))
        .max(15)
        .optional(),
      competitorGaps: z.array(z.string().max(200)).max(40).optional(),
      internalLinks: z
        .array(z.object({ anchor: z.string().max(120), slug: z.string().max(160) }))
        .max(8)
        .optional(),
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
        approvedOutline: data.approvedOutline,
        competitorGaps: data.competitorGaps,
        internalLinks: data.internalLinks,

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

async function requirePro(supabase: any, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", userId).single();
  const plan = profile?.plan || "free";
  return plan === "pro" || plan === "agency";
}

export const regenerateSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      section: z.string().min(20).max(12000),
      mode: z.enum(["rewrite", "expand", "shorten", "simplify", "add_data", "add_example"]).default("rewrite"),
      keyword: z.string().min(2).max(120),
      language: z.string().min(2).max(40).default("English"),
      tone: z.string().max(40).default("Professional"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await requirePro(supabase, userId))) {
      return { markdown: "", error: "Section regeneration is a Pro feature. Upgrade to unlock." };
    }
    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    return rewriteBlogSection(
      data.section,
      data.mode,
      data.keyword,
      data.language,
      data.tone,
      voice?.style_summary || "",
    );
  });

export const generateSerpVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().max(300).default(""),
      markdown: z.string().min(50).max(30000),
      keyword: z.string().min(2).max(120),
      language: z.string().min(2).max(40).default("English"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await requirePro(supabase, userId))) {
      return { variants: [], error: "SERP snippet variants are a Pro feature. Upgrade to unlock." };
    }
    return generateMetaVariants(data.title, data.markdown, data.keyword, data.language);
  });

/** Save a finished article draft into the user's history so it can be reopened. */
export const saveArticleDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(300),
      keyword: z.string().max(120).default(""),
      markdown: z.string().min(20).max(60000),
      metaDescription: z.string().max(400).default(""),
      slug: z.string().max(200).default(""),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("repurpose_jobs").insert({
      user_id: userId,
      tool: "seo_blog",
      input_text: `${data.title} — ${data.keyword}`,
      title: data.title,
      outputs: {
        article: data.markdown,
        meta_description: data.metaDescription,
        slug: data.slug,
      },
    } as any);
    if (error) {
      console.error("draft save error", error);
      return { success: false };
    }
    return { success: true };
  });
