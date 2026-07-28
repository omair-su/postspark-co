import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const POST_MEDIA_BUCKET = "post-media";
export const SIGNED_URL_TTL = 60 * 60; // 1 hour

export type MediaKind = "image" | "video" | "document";

export interface MediaAsset {
  path: string;
  name: string;
  kind: MediaKind;
  size: number;
  createdAt: string;
  url: string; // signed URL
}

export function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return "image";
}

function kindFromName(name: string): MediaKind {
  if (/\.(mp4|mov|webm|m4v)$/i.test(name)) return "video";
  if (/\.pdf$/i.test(name)) return "document";
  return "image";
}

/** List the signed-in user's uploaded media, newest first. */
export const listMediaLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .list(userId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) return { assets: [] as MediaAsset[], error: error.message };

    const files = (data || []).filter((f) => f.id);
    if (files.length === 0) return { assets: [] as MediaAsset[] };

    const paths = files.map((f) => `${userId}/${f.name}`);
    const { data: signed } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);

    const urlByPath = new Map((signed || []).map((s: any) => [s.path, s.signedUrl]));
    const assets: MediaAsset[] = files.map((f, i) => ({
      path: paths[i],
      name: f.name,
      kind: kindFromName(f.name),
      size: (f.metadata as any)?.size ?? 0,
      createdAt: (f as any).created_at ?? new Date().toISOString(),
      url: urlByPath.get(paths[i]) || "",
    }));
    return { assets };
  });

/** Refresh signed URLs for known storage paths. */
export const signMediaPaths = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ paths: z.array(z.string().min(1)).max(20) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const owned = data.paths.filter((p) => p.startsWith(`${userId}/`));
    if (owned.length === 0) return { urls: {} as Record<string, string> };
    const { data: signed } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .createSignedUrls(owned, SIGNED_URL_TTL);
    const urls: Record<string, string> = {};
    for (const s of signed || []) if ((s as any).signedUrl) urls[(s as any).path] = (s as any).signedUrl;
    return { urls };
  });

export const deleteMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ path: z.string().min(1) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.path.startsWith(`${userId}/`)) return { error: "Not allowed" };
    const { error } = await supabase.storage.from(POST_MEDIA_BUCKET).remove([data.path]);
    if (error) return { error: error.message };
    return { ok: true };
  });

const MAX_IMPORT_BYTES = 200 * 1024 * 1024;

/**
 * Copy a remote asset (stock photo/video, generated image) into the user's
 * private media library so publishing always reads from a stable source.
 */
export const importRemoteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      url: z.string().url(),
      filename: z.string().max(120).optional(),
      /** Unsplash download_location — pinged to satisfy their API guidelines. */
      downloadLocation: z.string().url().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const res = await fetch(data.url);
    if (!res.ok) return { error: `Could not download that asset (${res.status}).` };
    const mime = res.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_IMPORT_BYTES) return { error: "That file is too large (max 200MB)." };

    const kind = kindFromMime(mime);
    const ext =
      kind === "video" ? "mp4" : kind === "document" ? "pdf" : (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const base = (data.filename || `stock-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 60);
    const path = `${userId}/${Date.now()}-${base}.${ext}`;

    const { error } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .upload(path, buf, { contentType: mime, upsert: false });
    if (error) return { error: error.message };

    // Fire-and-forget Unsplash download tracking
    if (data.downloadLocation && process.env.UNSPLASH_ACCESS_KEY) {
      fetch(data.downloadLocation, {
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      }).catch(() => {});
    }

    const { data: signed } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);

    return { ok: true, path, kind, url: signed?.signedUrl || "" };
  });
