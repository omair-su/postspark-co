// Server-only helpers for Unsplash + Pexels stock media search.
// - Never expose Unsplash/Pexels keys to the browser.
// - All results are normalized to a single shape so the UI can render them the same way.
// - We never re-host images; we hotlink the provider URLs (Unsplash requirement).

export type StockSource = "unsplash" | "pexels";

export interface StockPhoto {
  id: string;
  source: StockSource;
  thumbUrl: string;
  regularUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  photographerName: string;
  photographerUrl: string; // profile URL, with UTM for Unsplash
  sourceUrl: string; // photo page on the provider
  downloadLocation?: string; // Unsplash only — must be pinged when the photo is used
  alt?: string;
}

export interface StockVideo {
  id: string;
  source: "pexels";
  thumbUrl: string;
  previewUrl: string; // best small MP4 for preview
  downloadUrl: string; // full MP4
  width: number;
  height: number;
  duration: number;
  photographerName: string;
  photographerUrl: string;
  sourceUrl: string;
}

const UTM = "utm_source=postspark&utm_medium=referral";

function unsplashProfileUrl(username: string) {
  return `https://unsplash.com/@${encodeURIComponent(username)}?${UTM}`;
}

export function unsplashBrandUrl() {
  return `https://unsplash.com/?${UTM}`;
}

function normalizeUnsplashPhoto(p: any): StockPhoto {
  return {
    id: String(p.id),
    source: "unsplash",
    thumbUrl: p.urls?.small || p.urls?.thumb || p.urls?.regular,
    regularUrl: p.urls?.regular,
    fullUrl: p.urls?.full || p.urls?.raw || p.urls?.regular,
    width: p.width || 0,
    height: p.height || 0,
    photographerName: p.user?.name || "Unknown",
    photographerUrl: unsplashProfileUrl(p.user?.username || ""),
    sourceUrl: (p.links?.html || "") + (p.links?.html?.includes("?") ? "&" : "?") + UTM,
    downloadLocation: p.links?.download_location,
    alt: p.alt_description || p.description || undefined,
  };
}

function normalizePexelsPhoto(p: any): StockPhoto {
  return {
    id: String(p.id),
    source: "pexels",
    thumbUrl: p.src?.medium || p.src?.small || p.src?.tiny || p.src?.original,
    regularUrl: p.src?.large || p.src?.medium || p.src?.original,
    fullUrl: p.src?.original || p.src?.large2x || p.src?.large,
    width: p.width || 0,
    height: p.height || 0,
    photographerName: p.photographer || "Unknown",
    photographerUrl: p.photographer_url || "https://www.pexels.com",
    sourceUrl: p.url || "https://www.pexels.com",
    alt: p.alt || undefined,
  };
}

function normalizePexelsVideo(v: any): StockVideo {
  const files: any[] = Array.isArray(v.video_files) ? v.video_files : [];
  const mp4s = files.filter((f) => f.file_type === "video/mp4");
  const sorted = [...mp4s].sort((a, b) => (a.width || 0) - (b.width || 0));
  const preview = sorted.find((f) => (f.width || 0) >= 540) || sorted[0];
  const full = [...mp4s].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  const pic = Array.isArray(v.video_pictures) && v.video_pictures[0]?.picture;
  return {
    id: String(v.id),
    source: "pexels",
    thumbUrl: pic || preview?.link || "",
    previewUrl: preview?.link || "",
    downloadUrl: full?.link || preview?.link || "",
    width: v.width || 0,
    height: v.height || 0,
    duration: v.duration || 0,
    photographerName: v.user?.name || "Unknown",
    photographerUrl: v.user?.url || "https://www.pexels.com",
    sourceUrl: v.url || "https://www.pexels.com",
  };
}

type Orientation = "landscape" | "portrait" | "squarish" | "any";

async function searchUnsplash(
  query: string,
  page: number,
  orientation: Orientation,
): Promise<StockPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: "24",
    content_filter: "high",
  });
  if (orientation !== "any") params.set("orientation", orientation);
  const res = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
  });
  if (!res.ok) {
    console.error("Unsplash search failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const json: any = await res.json();
  const results: any[] = json.results || [];
  return results.map(normalizeUnsplashPhoto);
}

async function searchPexelsPhotos(
  query: string,
  page: number,
  orientation: Orientation,
): Promise<StockPhoto[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ query, page: String(page), per_page: "24" });
  if (orientation === "landscape" || orientation === "portrait") {
    params.set("orientation", orientation);
  } else if (orientation === "squarish") {
    params.set("orientation", "square");
  }
  const res = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
    headers: { Authorization: key },
  });
  if (!res.ok) {
    console.error("Pexels photo search failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const json: any = await res.json();
  const photos: any[] = json.photos || [];
  return photos.map(normalizePexelsPhoto);
}

async function searchPexelsVideos(
  query: string,
  page: number,
  orientation: Orientation,
): Promise<StockVideo[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ query, page: String(page), per_page: "18" });
  if (orientation === "landscape" || orientation === "portrait") {
    params.set("orientation", orientation);
  }
  const res = await fetch(`https://api.pexels.com/videos/search?${params.toString()}`, {
    headers: { Authorization: key },
  });
  if (!res.ok) {
    console.error("Pexels video search failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const json: any = await res.json();
  const videos: any[] = json.videos || [];
  return videos.map(normalizePexelsVideo);
}

export async function searchStockPhotos(opts: {
  query: string;
  source: "unsplash" | "pexels" | "all";
  page: number;
  orientation: Orientation;
}): Promise<{ photos: StockPhoto[]; error?: string }> {
  const { query, source, page, orientation } = opts;
  const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;
  const hasPexels = !!process.env.PEXELS_API_KEY;

  if (source === "unsplash") {
    if (!hasUnsplash) return { photos: [], error: "Unsplash is not configured." };
    return { photos: await searchUnsplash(query, page, orientation) };
  }
  if (source === "pexels") {
    if (!hasPexels) return { photos: [], error: "Pexels is not configured." };
    return { photos: await searchPexelsPhotos(query, page, orientation) };
  }
  if (!hasUnsplash && !hasPexels) {
    return { photos: [], error: "Stock providers are not configured (missing UNSPLASH_ACCESS_KEY / PEXELS_API_KEY)." };
  }
  // "all" — interleave results from both providers
  const [u, p] = await Promise.all([
    hasUnsplash ? searchUnsplash(query, page, orientation) : Promise.resolve([] as StockPhoto[]),
    hasPexels ? searchPexelsPhotos(query, page, orientation) : Promise.resolve([] as StockPhoto[]),
  ]);
  const merged: StockPhoto[] = [];
  const max = Math.max(u.length, p.length);
  for (let i = 0; i < max; i++) {
    if (u[i]) merged.push(u[i]);
    if (p[i]) merged.push(p[i]);
  }
  return { photos: merged };
}

export async function searchStockVideos(opts: {
  query: string;
  page: number;
  orientation: Orientation;
}): Promise<{ videos: StockVideo[]; error?: string }> {
  if (!process.env.PEXELS_API_KEY) {
    return { videos: [], error: "Pexels video search is not configured (missing PEXELS_API_KEY)." };
  }
  const videos = await searchPexelsVideos(opts.query, opts.page, opts.orientation);
  return { videos };
}

// Unsplash requires that we ping links.download_location whenever a user
// "uses" a photo (insert into content, set as background, download, etc.).
// This is a fire-and-forget GET with the Client-ID header.
export async function trackUnsplashDownload(downloadLocation: string): Promise<{ ok: boolean }> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !downloadLocation) return { ok: false };
  // Only allow official Unsplash API hosts.
  try {
    const u = new URL(downloadLocation);
    if (!/(^|\.)unsplash\.com$/.test(u.hostname)) return { ok: false };
  } catch {
    return { ok: false };
  }
  try {
    const res = await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    });
    return { ok: res.ok };
  } catch (e) {
    console.error("trackUnsplashDownload error:", e);
    return { ok: false };
  }
}
