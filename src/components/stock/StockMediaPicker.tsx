import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, ImageIcon, Video as VideoIcon, Info } from "lucide-react";
import type { StockPhoto, StockVideo } from "@/server/stockMedia.server";
import { searchStockPhotos, searchStockVideos } from "@/lib/stockMedia.functions";
import { StockPhotoCard } from "./StockPhotoCard";
import { StockAttribution } from "./StockAttribution";
import { StockAttributionModal } from "./StockAttributionModal";

type Kind = "photos" | "videos";
type PhotoSource = "all" | "unsplash" | "pexels";
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
  const [kind, setKind] = useState<Kind>("photos");
  const [source, setSource] = useState<PhotoSource>("all");
  const [orientation, setOrientation] = useState<Orientation>("any");
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [videos, setVideos] = useState<StockVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<StockVideo | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestKey = useRef(0);

  const doPhotos = useServerFn(searchStockPhotos);
  const doVideos = useServerFn(searchStockVideos);

  const load = useCallback(
    async (nextPage: number, reset: boolean) => {
      if (!query.trim()) return;
      const key = ++requestKey.current;
      setLoading(true);
      setError(null);
      try {
        if (kind === "videos") {
          const res: any = await doVideos({ data: { query, page: nextPage, orientation } });
          if (key !== requestKey.current) return;
          const items: StockVideo[] = res.videos || [];
          setVideos((prev) => (reset ? items : [...prev, ...items]));
          setPhotos([]);
          setHasMore(items.length > 0);
          if (res.error) setError(res.error);
        } else {
          const res: any = await doPhotos({
            data: { query, source, page: nextPage, orientation },
          });
          if (key !== requestKey.current) return;
          const items: StockPhoto[] = res.photos || [];
          setPhotos((prev) => (reset ? items : [...prev, ...items]));
          setVideos([]);
          setHasMore(items.length > 0);
          if (res.error) setError(res.error);
        }
        setPage(nextPage);
      } catch (e: any) {
        if (key === requestKey.current) setError(e?.message || "Search failed");
      } finally {
        if (key === requestKey.current) setLoading(false);
      }
    },
    [query, kind, source, orientation, doPhotos, doVideos],
  );

  // Reset + load whenever the filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, source, orientation]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !loading && hasMore) {
          load(page + 1, false);
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, hasMore, page, load]);

  const tabBase =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setHasMore(true);
          load(1, true);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setKind("photos")}
            className={`${tabBase} ${kind === "photos" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ImageIcon className="h-4 w-4" /> Photos
          </button>
          <button
            type="button"
            onClick={() => setKind("videos")}
            className={`${tabBase} ${kind === "videos" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <VideoIcon className="h-4 w-4" /> Videos
          </button>
        </div>

        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search millions of free photos & videos…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {kind === "photos" && (
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as PhotoSource)}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          >
            <option value="all">All sources</option>
            <option value="unsplash">Unsplash only</option>
            <option value="pexels">Pexels only</option>
          </select>
        )}

        <select
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as Orientation)}
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
        >
          <option value="any">Any orientation</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          {kind === "photos" && <option value="squarish">Square</option>}
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

      {kind === "photos" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <StockPhotoCard
              key={`${p.source}-${p.id}-${i}`}
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
          {videos.map((v, i) => (
            <div
              key={`${v.id}-${i}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-black"
            >
              <div className="relative aspect-video w-full">
                <button
                  type="button"
                  onClick={() => setVideoModal(v)}
                  className="absolute inset-0 block h-full w-full text-left"
                  aria-label={`Preview clip by ${v.photographerName}`}
                >
                  <video
                    src={v.previewUrl}
                    poster={v.thumbUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLVideoElement;
                      el.pause();
                      el.currentTime = 0;
                    }}
                    className="pointer-events-none h-full w-full object-cover"
                  />
                </button>
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-end gap-1 p-2 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  {onSelectVideo && (
                    <button
                      type="button"
                      onClick={() => onSelectVideo(v)}
                      className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow"
                    >
                      {selectLabel || "Use clip"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setVideoModal(v)}
                    className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow"
                    aria-label="Attribution & download"
                  >
                    <Info className="h-3 w-3" />
                  </button>
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

      {/* Infinite-scroll sentinel */}
      <div ref={sentinelRef} className="h-10" />

      {loading && (photos.length > 0 || videos.length > 0) && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      {!hasMore && (photos.length > 0 || videos.length > 0) && (
        <p className="py-4 text-center text-xs text-muted-foreground">You've reached the end.</p>
      )}

      {videoModal && (
        <StockAttributionModal
          open
          onClose={() => setVideoModal(null)}
          asset={{ kind: "video", video: videoModal }}
        />
      )}
    </div>
  );
}
