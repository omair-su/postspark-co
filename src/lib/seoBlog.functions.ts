import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateSeoBlog, generateSeoOutline } from "@/server/seoBlog.server";

export const generateBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      keyword: z.string().min(2).max(120),
      wordTarget: z.number().int().min(600).max(3000),
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
      return {
        title: "",
        metaDescription: "",
        slug: "",
        outline: [],
        markdown: "",
        faq: [],
        error: "SEO Blog Generator is a Pro feature. Upgrade to unlock.",
      };
    }

    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    return generateSeoBlog(
      data.topic,
      data.keyword,
      data.wordTarget,
      data.language,
      voice?.style_summary || "",
    );
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
        title: "",
        outline: [],
        competitorHeadings: [],
        suggestedInternalLinks: [],
        error: "Competitor outline is a Pro feature. Upgrade to unlock.",
      };
    }

    // Fetch user's published blog posts as internal link candidates
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
