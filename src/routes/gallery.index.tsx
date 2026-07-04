import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGalleryFeed } from "@/lib/gallery.functions";
import { getPublicStockFeed } from "@/lib/stockMedia.functions";
import { Sparkles, Eye, ArrowRight, Loader2, Star, User, Image as ImageIcon, Video as VideoIcon, Info } from "lucide-react";
import { StockAttribution } from "@/components/stock/StockAttribution";
import { StockAttributionModal } from "@/components/stock/StockAttributionModal";
import type { StockPhoto, StockVideo } from "@/server/stockMedia.server";



interface Item {
  id: string;
  slug: string;
  title: string;
  preview: string;
  formats: string[];
  createdAt: string;
  views: number;
  featured?: boolean;
  author?: { name: string; avatar: string | null };
}

export const Route = createFileRoute("/gallery/")({
  head: () => ({
    meta: [
      { title: "Public Content Gallery — PostSpark" },
      { name: "description", content: "Real examples of blog posts, podcasts, and videos repurposed into tweets, LinkedIn posts, and newsletters with PostSpark AI. Get inspired by the community." },
      { property: "og:title", content: "PostSpark Community Gallery" },
      { property: "og:description", content: "Browse real AI-repurposed content from creators and agencies." },
      { property: "og:url", content: "https://postspark.co/gallery" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PostSpark Community Gallery" },
      { name: "twitter:description", content: "Browse real AI-repurposed content from creators and agencies." },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/gallery" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "PostSpark Community Gallery",
          description: "Browse posts created and shared by the PostSpark community.",
          url: "https://postspark.co/gallery",
          isPartOf: { "@type": "WebSite", name: "PostSpark", url: "https://postspark.co" },
        }),
      },
    ],
  }),
  component: GalleryPage,
});

type StockKind = "photos" | "videos";
type StockSource = "all" | "unsplash" | "pexels";

function GalleryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock feed state
  const [stockKind, setStockKind] = useState<StockKind>("photos");
  const [stockSource, setStockSource] = useState<StockSource>("all");
  const [stockQuery, setStockQuery] = useState("creator content");
  const [queryInput, setQueryInput] = useState("creator content");
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockVideos, setStockVideos] = useState<StockVideo[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockHasMore, setStockHasMore] = useState(true);
  const [modalAsset, setModalAsset] = useState<
    | { kind: "photo"; photo: StockPhoto }
    | { kind: "video"; video: StockVideo }
    | null
  >(null);

  const stockRequestKey = useRef(0);
  const stockSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getGalleryFeed()
      .then((data) => setItems(data as Item[]))
      .finally(() => setLoading(false));
  }, []);

  const loadStock = useCallback(
    async (nextPage: number, reset: boolean) => {
      const key = ++stockRequestKey.current;
      setStockLoading(true);
      try {
        const res: any = await getPublicStockFeed({
          data: {
            query: stockQuery,
            kind: stockKind,
            source: stockKind === "photos" ? stockSource : "all",
            page: nextPage,
            orientation: "landscape",
            perPage: 24,
          },
        });
        if (key !== stockRequestKey.current) return;
        if (stockKind === "photos") {
          const items = (res?.photos as StockPhoto[]) || [];
          setStockPhotos((prev) => (reset ? items : [...prev, ...items]));
          setStockVideos([]);
          setStockHasMore(items.length > 0);
        } else {
          const items = (res?.videos as StockVideo[]) || [];
          setStockVideos((prev) => (reset ? items : [...prev, ...items]));
          setStockPhotos([]);
          setStockHasMore(items.length > 0);
        }
        setStockPage(nextPage);
      } catch {
        if (key === stockRequestKey.current) setStockHasMore(false);
      } finally {
        if (key === stockRequestKey.current) setStockLoading(false);
      }
    },
    [stockQuery, stockKind, stockSource],
  );

  // Reload when filters/query change
  useEffect(() => {
    setStockPage(1);
    setStockHasMore(true);
    loadStock(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockQuery, stockKind, stockSource]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = stockSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !stockLoading && stockHasMore) {
          loadStock(stockPage + 1, false);
        }
      },
      { rootMargin: "800px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [stockLoading, stockHasMore, stockPage, loadStock]);



  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-electric">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">PostSpark</span>
          </Link>
          <Link
            to="/signup"
            className="rounded-lg gradient-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Try free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Community Gallery</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real posts repurposed by PostSpark users. Get inspired.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No public posts yet. Be the first to share!
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to="/gallery/$slug"
                params={{ slug: item.slug }}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
                    {item.title}
                  </h2>
                  {item.featured && (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{item.preview}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {item.formats.slice(0, 4).map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {item.author?.avatar ? (
                      <img src={item.author.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="truncate max-w-[100px]">{item.author?.name || "Anonymous"}</span>
                    <span>·</span>
                    <Eye className="h-3 w-3" /> {item.views}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stock inspiration: Unsplash + Pexels photos and Pexels videos */}
        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <ImageIcon className="h-5 w-5 text-primary" /> Stock inspiration
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Free premium {stockKind} from{" "}
                {stockKind === "photos" ? "Unsplash & Pexels" : "Pexels"}. Fully attributed.
              </p>
            </div>
            <Link
              to="/dashboard/stock-gallery"
              className="hidden text-xs font-semibold text-primary hover:underline sm:inline"
            >
              Open full stock library →
            </Link>
          </div>

          {/* Filters */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStockQuery(queryInput.trim() || "creator content");
            }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setStockKind("photos")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  stockKind === "photos"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="h-4 w-4" /> Photos
              </button>
              <button
                type="button"
                onClick={() => setStockKind("videos")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  stockKind === "videos"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <VideoIcon className="h-4 w-4" /> Videos
              </button>
            </div>

            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search photos & videos…"
              className="min-w-[180px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />

            {stockKind === "photos" && (
              <div className="inline-flex rounded-md border border-border bg-muted p-0.5 text-xs">
                {(["all", "unsplash", "pexels"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStockSource(s)}
                    className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                      stockSource === s
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Search
            </button>
          </form>

          {/* Grid */}
          {stockKind === "photos" ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {stockPhotos.map((p, i) => (
                <div
                  key={`${p.source}-${p.id}-${i}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card"
                >
                  <img
                    src={p.thumbUrl}
                    alt={p.alt || `Photo by ${p.photographerName}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => setModalAsset({ kind: "photo", photo: p })}
                    className="absolute right-2 top-2 rounded-md bg-white/95 p-1.5 text-black opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label="Attribution & download"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <StockAttribution photo={p} />
                </div>
              ))}
              {!stockLoading && stockPhotos.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No photos found. Try a different search.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stockVideos.map((v, i) => (
                <div
                  key={`${v.id}-${i}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-black"
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
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setModalAsset({ kind: "video", video: v })}
                    className="absolute right-2 top-2 rounded-md bg-white/95 p-1.5 text-black opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label="Attribution & download"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 px-2 py-1.5"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0) 100%)",
                    }}
                  >
                    <span className="text-[11px] text-white/90">
                      Video by{" "}
                      <a
                        href={v.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="pointer-events-auto underline decoration-white/40 hover:decoration-white"
                      >
                        {v.photographerName}
                      </a>{" "}
                      on{" "}
                      <a
                        href="https://www.pexels.com"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="pointer-events-auto underline decoration-white/40 hover:decoration-white"
                      >
                        Pexels
                      </a>
                    </span>
                  </div>
                </div>
              ))}
              {!stockLoading && stockVideos.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No clips found. Try a different search.
                </div>
              )}
            </div>
          )}

          {/* Infinite scroll sentinel + loader */}
          <div ref={stockSentinelRef} className="h-8" />
          {stockLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {!stockHasMore && (stockPhotos.length > 0 || stockVideos.length > 0) && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              You've reached the end.
            </p>
          )}
        </section>
      </main>

      {modalAsset && (
        <StockAttributionModal
          open
          onClose={() => setModalAsset(null)}
          asset={modalAsset}
        />
      )}
    </div>

  );
}
