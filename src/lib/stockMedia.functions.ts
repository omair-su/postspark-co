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
    if (rateLimited(context.userId)) return { photos: [], error: "Rate limit reached." };
    return searchStockPhotosServer(data);
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
    if (rateLimited(context.userId)) return { videos: [], error: "Rate limit reached." };
    return searchStockVideosServer(data);
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
    return trackUnsplashDownloadServer(data.downloadLocation);
  });
