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
} from "@/server/image.server";

const FREE_MONTHLY_LIMIT = 5; // free tier preview generations
const PRO_MONTHLY_LIMIT = 500; // soft cap for Pro/Agency

// Persist a generated image (data: URL or remote http(s) URL) to storage and
// insert a row in generated_images. Returns the public storage URL on success.
async function persistGeneratedImage(opts: {
  userId: string;
  imageUrl: string;
  prompt: string;
  style?: string;
  aspect?: string;
  template?: string;
  source?: string;
}): Promise<string | null> {
  try {
    let bytes: Uint8Array | null = null;
    let mime = "image/png";

    if (opts.imageUrl.startsWith("data:")) {
      const m = opts.imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!m) return null;
      mime = m[1];
      bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    } else if (/^https?:\/\//i.test(opts.imageUrl)) {
      const r = await fetch(opts.imageUrl);
      if (!r.ok) return null;
      mime = (r.headers.get("content-type") || "image/png").split(";")[0];
      bytes = new Uint8Array(await r.arrayBuffer());
    } else {
      return null;
    }
    if (!bytes) return null;

    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    const path = `${opts.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) {
      console.error("persistGeneratedImage upload error:", upErr);
      return null;
    }
    const { data: pub } = supabaseAdmin.storage.from("generated-images").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: insErr } = await supabaseAdmin.from("generated_images").insert({
      user_id: opts.userId,
      image_url: publicUrl,
      prompt: opts.prompt,
      style: opts.style,
      aspect: opts.aspect,
      template: opts.template,
      source: opts.source || "generate",
    });
    if (insErr) console.error("persistGeneratedImage insert error:", insErr);
    return publicUrl;
  } catch (e) {
    console.error("persistGeneratedImage error:", e);
    return null;
  }
}

async function getPlan(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  return profile?.plan || "free";
}

async function isPro(plan: string) {
  return plan === "pro" || plan === "agency";
}

async function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

async function countMonthlyGenerations(userId: string): Promise<number> {
  const since = await monthStartIso();
  const { count } = await supabaseAdmin
    .from("generated_images")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return count || 0;
}

export const getImageUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    const used = await countMonthlyGenerations(userId);
    const limit = (await isPro(plan)) ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
    return { plan, used, limit, remaining: Math.max(0, limit - used) };
  });

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(1000),
      style: z.string().min(1).max(40),
      aspect: z.enum(["square", "portrait", "landscape"]),
      template: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await isPro(plan)))
      return { imageUrl: "", error: "AI Image Studio is a Pro feature. Upgrade to unlock." };
    const res = await generateSocialImage(data.prompt, data.style, data.aspect, data.template);
    if (res.imageUrl) {
      const persisted = await persistGeneratedImage({
        userId,
        imageUrl: res.imageUrl,
        prompt: data.prompt,
        style: data.style,
        aspect: data.aspect,
        template: data.template,
        source: "generate",
      });
      if (persisted) res.imageUrl = persisted;
    }
    return res;
  });

export const generateImageVariations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(1000),
      style: z.string().min(1).max(40),
      aspect: z.enum(["square", "portrait", "landscape"]),
      template: z.string().max(40).optional(),
      count: z.number().int().min(2).max(4).default(4),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await getPlan(supabase, userId);
    if (!(await isPro(plan)))
      return { results: [], error: "Variations is a Pro feature. Upgrade to unlock." };
    const results = await generateVariations(
      data.prompt,
      data.style,
      data.aspect,
      data.template,
      data.count,
    );
    return { results };
  });

export const generateCarousel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(3).max(500),
      style: z.string().min(1).max(40).default("minimal"),
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
    const out = await generateCarouselSet(data.topic, data.style);
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
    return editImage(data.imageDataUrl, data.instruction);
  });

export const captionForImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ prompt: z.string().min(1).max(2000) }).parse)
  .handler(async ({ data }) => {
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
      const mime = match[1];
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
