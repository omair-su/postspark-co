import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateSocialImage, generateVariations, editImage } from "./image.server";

async function assertPro(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  const plan = profile?.plan || "free";
  return plan === "pro" || plan === "agency";
}

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
    if (!(await assertPro(supabase, userId)))
      return { imageUrl: "", error: "AI Image Studio is a Pro feature. Upgrade to unlock." };
    return generateSocialImage(data.prompt, data.style, data.aspect, data.template);
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
    if (!(await assertPro(supabase, userId)))
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
    if (!(await assertPro(supabase, userId)))
      return { imageUrl: "", error: "Image editing is a Pro feature. Upgrade to unlock." };
    return editImage(data.imageDataUrl, data.instruction);
  });

// Save a generated image to storage + library
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
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    try {
      // Convert data URL to bytes
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
    // Fetch to get path for storage delete
    const { data: row } = await supabase
      .from("generated_images")
      .select("image_url")
      .eq("id", data.id)
      .single();
    const { error } = await supabase.from("generated_images").delete().eq("id", data.id);
    if (error) return { error: "Delete failed" };
    // Best-effort storage delete
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
