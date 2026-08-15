import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  generateSocialImage,
  generateVariations,
  editImage,
  generateCarouselSet,
  checkPromptSafety,
  generateCaption,
  removeBackground as removeBackgroundServer,
  upscaleImage as upscaleImageServer,
  enhanceImagePrompt,
} from "@/lib/image.server";
import {
  persistGeneratedImage,
  logToHistory,
  checkRepurposeQuota,
  imageQuotaRemaining,
  countMonthlyGenerations,
  monthlyImageLimit,
  getPlanFor as getPlan,
  isProPlan as isPro,
} from "@/lib/imageQuota.server";

const IMAGE_MODEL = z.enum(["auto", "flux", "gpt", "gemini"]).default("auto");
const QUALITY = z.enum(["standard", "hd"]).default("standard");



export const getImageUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    const used = await countMonthlyGenerations(userId);
    const limit = monthlyImageLimit(plan);
    return { plan, used, limit, remaining: Math.max(0, limit - used) };
  });

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(2000),
      style: z.string().min(1).max(40),
      aspect: z.enum(["square", "portrait", "landscape"]),
      template: z.string().max(40).optional(),
      model: IMAGE_MODEL,
      quality: QUALITY,
      negativePrompt: z.string().max(500).optional(),
      originalPrompt: z.string().max(2000).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await checkRepurposeQuota(userId, plan)))
      return { imageUrl: "", error: "LIMIT_REACHED" };
    if (!(await isPro(plan)) && data.template !== "thumbnail" && data.template !== "blog-cover")
      return { imageUrl: "", error: "AI Image Studio is a Pro feature. Upgrade to unlock." };
    if ((await imageQuotaRemaining(userId, plan)) < 1)
      return { imageUrl: "", error: "LIMIT_REACHED" };
    const res = await generateSocialImage(
      data.prompt,
      data.style,
      data.aspect,
      data.template,
      data.model,
      data.quality,
      data.negativePrompt,
    );
    if (res.imageUrl) {
      const persisted = await persistGeneratedImage({
        userId,
        imageUrl: res.imageUrl,
        prompt: data.prompt,
        style: data.style,
        aspect: data.aspect,
        template: data.template,
        source: data.template === "thumbnail" || data.template === "blog-cover" ? "thumbnail" : "generate",
      });
      if (persisted) res.imageUrl = persisted;
      const isThumb = data.template === "thumbnail" || data.template === "blog-cover";
      await logToHistory({
        userId,
        tool: isThumb ? "thumbnail" : "image",
        title: (data.originalPrompt || data.prompt).slice(0, 80),
        inputText: data.originalPrompt || data.prompt,
        outputs: {
          image_url: res.imageUrl,
          style: data.style,
          aspect: data.aspect,
          template: data.template || "",
          model: data.model,
          prompt: data.prompt,
          original_prompt: data.originalPrompt || null,
        },
      });
    }
    return res;
  });


export const enhancePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(2000),
      model: IMAGE_MODEL,
      style: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    return enhanceImagePrompt(data.prompt, data.model, data.style);
  });

export const generateImageVariations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(2000),
      style: z.string().min(1).max(40),
      aspect: z.enum(["square", "portrait", "landscape"]),
      template: z.string().max(40).optional(),
      count: z.number().int().min(2).max(4).default(4),
      model: IMAGE_MODEL,
      quality: QUALITY,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await isPro(plan)))
      return { results: [], error: "Variations is a Pro feature. Upgrade to unlock." };
    // Every completed tile counts, so only render as many as the plan allows.
    const remaining = await imageQuotaRemaining(userId, plan);
    if (remaining < 1) return { results: [], error: "LIMIT_REACHED" };
    const wanted = Math.min(data.count, remaining);
    const results = await generateVariations(
      data.prompt,
      data.style,
      data.aspect,
      data.template,
      wanted,
      data.model,
      data.quality,
    );
    await Promise.all(
      results.map(async (r) => {
        if (!r.imageUrl) return;
        const persisted = await persistGeneratedImage({
          userId,
          imageUrl: r.imageUrl,
          prompt: data.prompt,
          style: data.style,
          aspect: data.aspect,
          template: data.template,
          source: "variations",
        });
        if (persisted) r.imageUrl = persisted;
      }),
    );
    return { results };
  });

export const generateCarousel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      style: z.string().min(1).max(40).default("minimal"),
      model: IMAGE_MODEL.default("gpt"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await isPro(plan)))
      return {
        results: [],
        slides: [],
        error: "Carousel generation is a Pro feature. Upgrade to unlock.",
      };
    const out = await generateCarouselSet(data.topic, data.style, data.model);
    await Promise.all(
      (out.results || []).map(async (r: any, i: number) => {
        if (!r?.imageUrl) return;
        const slideTitle = out.slides?.[i]?.title || `Slide ${i + 1}`;
        const persisted = await persistGeneratedImage({
          userId,
          imageUrl: r.imageUrl,
          prompt: `${data.topic} — ${slideTitle}`,
          style: data.style,
          aspect: "square",
          template: "carousel",
          source: "carousel",
        });
        if (persisted) r.imageUrl = persisted;
      }),
    );
    const urls = (out.results || []).map((r: any) => r?.imageUrl).filter(Boolean);
    if (urls.length) {
      await logToHistory({
        userId,
        tool: "carousel",
        title: `Carousel: ${data.topic.slice(0, 60)}`,
        inputText: data.topic,
        outputs: {
          carousel_images: urls,
          slides: out.slides,
          style: data.style,
          model: data.model,
          prompt: data.topic,
        },
      });
    }
    return out;
  });



export const editUploadedImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      imageDataUrl: z.string().min(20).max(20_000_000),
      instruction: z.string().min(3).max(1000),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await isPro(plan)))
      return { imageUrl: "", error: "Image editing is a Pro feature. Upgrade to unlock." };
    if ((await imageQuotaRemaining(userId, plan)) < 1)
      return { imageUrl: "", error: "LIMIT_REACHED" };
    const res = await editImage(data.imageDataUrl, data.instruction);
    if (res.imageUrl) {
      const persisted = await persistGeneratedImage({
        userId,
        imageUrl: res.imageUrl,
        prompt: data.instruction,
        source: "edit",
      });
      if (persisted) res.imageUrl = persisted;
    }
    return res;
  });

export const removeImageBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ imageDataUrl: z.string().min(20).max(20_000_000) }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await checkRepurposeQuota(userId, plan)))
      return { imageUrl: "", error: "LIMIT_REACHED" };
    if (!(await isPro(plan)))
      return { imageUrl: "", error: "Background removal is a Pro feature. Upgrade to unlock." };
    const res = await removeBackgroundServer(data.imageDataUrl);
    if (res.imageUrl) {
      const persisted = await persistGeneratedImage({
        userId,
        imageUrl: res.imageUrl,
        prompt: "Background removed",
        source: "bg-remove",
      });
      if (persisted) res.imageUrl = persisted;
      await logToHistory({
        userId,
        tool: "image-edit",
        title: "Background removed",
        inputText: "Background removal",
        outputs: { image_url: res.imageUrl, variant: "bg-remove" },
      });
    }
    return res;
  });

export const upscaleUploadedImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      imageDataUrl: z.string().min(20).max(20_000_000),
      scale: z.union([z.literal(2), z.literal(4)]).default(2),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await checkRepurposeQuota(userId, plan)))
      return { imageUrl: "", error: "LIMIT_REACHED" };
    if (!(await isPro(plan)))
      return { imageUrl: "", error: "Upscale is a Pro feature. Upgrade to unlock." };
    const res = await upscaleImageServer(data.imageDataUrl, data.scale);
    if (res.imageUrl) {
      const persisted = await persistGeneratedImage({
        userId,
        imageUrl: res.imageUrl,
        prompt: `Upscaled ${data.scale}x`,
        source: "upscale",
      });
      if (persisted) res.imageUrl = persisted;
      await logToHistory({
        userId,
        tool: "image-edit",
        title: `Upscaled ${data.scale}x`,
        inputText: `Upscale ${data.scale}x`,
        outputs: { image_url: res.imageUrl, variant: `upscale-${data.scale}x` },
      });
    }
    return res;
  });

const CAPTION_RATE = new Map<string, number[]>();
function captionRateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (CAPTION_RATE.get(userId) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 10) { CAPTION_RATE.set(userId, arr); return true; }
  arr.push(now);
  CAPTION_RATE.set(userId, arr);
  return false;
}

export const captionForImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ prompt: z.string().min(1).max(2000) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (captionRateLimited(userId)) return { caption: "", error: "Rate limit reached. Try again in a moment." };
    const plan = await getPlan(supabase, userId);
    if (!(await checkRepurposeQuota(userId, plan))) return { caption: "", error: "LIMIT_REACHED" };
    const caption = await generateCaption(data.prompt);
    return { caption };
  });

// Save a generated image to storage + library (with optional safety check)
export const saveImageToLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      imageDataUrl: z.string().min(20),
      prompt: z.string().min(1).max(2000),
      style: z.string().max(40).optional(),
      aspect: z.string().max(40).optional(),
      template: z.string().max(40).optional(),
      source: z.string().max(20).default("generate"),
      safetyCheck: z.boolean().default(true),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    try {
      if (data.safetyCheck) {
        const safety = await checkPromptSafety(data.prompt);
        if (!safety.safe) {
          return {
            error:
              "Image not saved — content flagged by safety check" +
              (safety.reason ? `: ${safety.reason}` : ""),
          };
        }
      }

      const match = data.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return { error: "Invalid image data" };
      const mime = match[1].toLowerCase();
      const ALLOWED_MIMES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
      if (!ALLOWED_MIMES.has(mime)) return { error: "Unsupported image type. Allowed: PNG, JPEG, WEBP, GIF." };
      const ext = mime.split("/")[1].replace("jpeg", "jpg");
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));

      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("generated-images")
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (upErr) {
        console.error("Storage upload error:", upErr);
        return { error: "Failed to upload image" };
      }
      const { data: pub } = supabaseAdmin.storage.from("generated-images").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { data: row, error: insErr } = await supabaseAdmin
        .from("generated_images")
        .insert({
          user_id: userId,
          image_url: publicUrl,
          prompt: data.prompt,
          style: data.style,
          aspect: data.aspect,
          template: data.template,
          source: data.source,
        })
        .select("id, image_url, prompt, created_at")
        .single();
      if (insErr) {
        console.error("DB insert error:", insErr);
        return { error: "Failed to save to library" };
      }
      return { image: row };
    } catch (e) {
      console.error("saveImageToLibrary error:", e);
      return { error: "Save failed" };
    }
  });

export const listLibraryImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("generated_images")
      .select("id, image_url, prompt, style, aspect, template, source, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("list library error:", error);
      return { images: [] as any[] };
    }
    return { images: data || [] };
  });

export const deleteLibraryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("generated_images")
      .select("image_url")
      .eq("id", data.id)
      .single();
    const { error } = await supabase.from("generated_images").delete().eq("id", data.id);
    if (error) return { error: "Delete failed" };
    if (row?.image_url) {
      const marker = "/generated-images/";
      const idx = row.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = row.image_url.slice(idx + marker.length);
        if (path.startsWith(`${userId}/`)) {
          await supabaseAdmin.storage.from("generated-images").remove([path]);
        }
      }
    }
    return { success: true };
  });
