import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2 } from "lucide-react";
import type { StockPhoto, StockVideo } from "@/server/stockMedia.server";
import { searchStockPhotos, searchStockVideos } from "@/lib/stockMedia.functions";
import { StockPhotoCard } from "./StockPhotoCard";
import { StockAttribution } from "./StockAttribution";

type Source = "all" | "unsplash" | "pexels" | "videos";
type Orientation = "any" | "landscape" | "portrait" | "squarish";

interface Props {
  initialQuery?: string;
  onSelectPhoto?: (photo: StockPhoto) => void;
  onSelectVideo?: (video: StockVideo) => void;
  selectLabel?: string;
}

export function StockMediaPicker({
  initialQuery = "workspace",
  onSelectPhoto,
  onSelectVideo,
  selectLabel,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [source, setSource] = useState<Source>("all");
  const [orientation, setOrientation] = useState<Orientation>("any");
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [videos, setVideos] = useState<StockVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doPhotos = useServerFn(searchStockPhotos);
  const doVideos = useServerFn(searchStockVideos);

  const run = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (source === "videos") {
        const res = await doVideos({
          data: { query, page: 1, orientation },
        });
        setPhotos([]);
        setVideos((res as any).videos || []);
        if ((res as any).error) setError((res as any).error);
      } else {
        const providerSource = source === "all" ? "all" : source;
        const res = await doPhotos({
          data: { query, source: providerSource, page: 1, orientation },
        });
        setVideos([]);
        setPhotos((res as any).photos || []);
        if ((res as any).error) setError((res as any).error);
      }
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, source, orientation, doPhotos, doVideos]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, orientation]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search millions of free photos & videos…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value as Source)}
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
        >
          <option value="all">All photos</option>
          <option value="unsplash">Unsplash</option>
          <option value="pexels">Pexels</option>
          <option value="videos">Videos (Pexels)</option>
        </select>

        <select
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as Orientation)}
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
        >
          <option value="any">Any orientation</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          <option value="squarish">Square</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {source !== "videos" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <StockPhotoCard
              key={`${p.source}-${p.id}`}
              photo={p}
              onSelect={onSelectPhoto}
              selectLabel={selectLabel}
            />
          ))}
          {!loading && photos.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No results. Try another search.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-black"
            >
              <div className="relative aspect-video w-full">
                <video
                  src={v.previewUrl}
                  poster={v.thumbUrl}
                  muted
                  loop
                  playsInline
                  onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                  onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {onSelectVideo && (
                    <button
                      type="button"
                      onClick={() => onSelectVideo(v)}
                      className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow"
                    >
                      {selectLabel || "Use clip"}
                    </button>
                  )}
                  <a
                    href={v.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow"
                  >
                    Download
                  </a>
                </div>
                <StockAttribution
                  photo={{
                    source: "pexels",
                    photographerName: v.photographerName,
                    photographerUrl: v.photographerUrl,
                    sourceUrl: v.sourceUrl,
                  }}
                />
              </div>
            </div>
          ))}
          {!loading && videos.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No clips found. Try another search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
