import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  searchStockPhotos as searchStockPhotosServer,
  searchStockVideos as searchStockVideosServer,
  trackUnsplashDownload as trackUnsplashDownloadServer,
} from "@/server/stockMedia.server";

const SOURCE = z.enum(["unsplash", "pexels", "all"]).default("all");
const ORIENTATION = z.enum(["landscape", "portrait", "squarish", "any"]).default("any");

// Very light in-memory per-user rate limit (30 req/min).
const RATE = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (RATE.get(userId) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 30) {
    RATE.set(userId, arr);
    return true;
  }
  arr.push(now);
  RATE.set(userId, arr);
  return false;
}

export const searchStockPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      query: z.string().min(1).max(120),
      source: SOURCE,
      page: z.number().int().min(1).max(50).default(1),
      orientation: ORIENTATION,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    if (rateLimited(context.userId)) return { photos: [], error: "Rate limit reached." };
    return searchStockPhotosServer(data);
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const searchStockVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      query: z.string().min(1).max(120),
      page: z.number().int().min(1).max(50).default(1),
      orientation: ORIENTATION,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    if (rateLimited(context.userId)) return { videos: [], error: "Rate limit reached." };
    return searchStockVideosServer(data);
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

// Called every time a user "uses" an Unsplash photo (insert, set as background,
// download, add to project). Fire-and-forget from the caller's perspective.
export const trackUnsplashUse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      downloadLocation: z.string().url().max(2000),
    }).parse,
  )
  .handler(async ({ data }) => {
    try {
    return trackUnsplashDownloadServer(data.downloadLocation);
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

// Public (unauthenticated) stock feed for the Community Gallery.
// No auth middleware — safe because it only proxies public search endpoints
// and returns non-sensitive, provider-hosted URLs.
export const getPublicStockFeed = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      query: z.string().min(1).max(80).default("creator content"),
      kind: z.enum(["photos", "videos"]).default("photos"),
      source: SOURCE, // unsplash | pexels | all (ignored for videos)
      page: z.number().int().min(1).max(50).default(1),
      orientation: ORIENTATION,
      perPage: z.number().int().min(1).max(48).default(24),
    }).partial().parse,
  )
  .handler(async ({ data }) => {
    try {
    const query = data?.query || "creator content";
    const kind = data?.kind || "photos";
    const source = data?.source || "all";
    const page = data?.page || 1;
    const orientation = data?.orientation || "landscape";
    const perPage = data?.perPage || 24;

    if (kind === "videos") {
      const res = await searchStockVideosServer({ query, page, orientation });
      return { photos: [], videos: res.videos.slice(0, perPage), page, kind };
    }
    const res = await searchStockPhotosServer({ query, source, page, orientation });
    return { photos: res.photos.slice(0, perPage), videos: [], page, kind };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
