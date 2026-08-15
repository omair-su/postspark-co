import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGalleryFeed } from "@/lib/gallery.functions";
import { getPublicStockFeed } from "@/lib/stockMedia.functions";
import {
  Eye,
  ArrowRight,
  Star,
  User,
  Image as ImageIcon,
  Video as VideoIcon,
  Info,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
} from "lucide-react";
import { StockAttributionModal } from "@/components/stock/StockAttributionModal";
import { useFadeIn, delay } from "@/components/landing/v4/parts";
import { Lp4Nav } from "@/components/landing/v4/SectionsTop";
import { Lp4Footer, Lp4FinalCta, Lp4StickyCta } from "@/components/landing/v4/SectionsEnd";
import { Lp4PageHero, Lp4TrustRow } from "@/components/landing/v4/PageHero";
import type { StockPhoto, StockVideo } from "@/lib/stockMedia.server";

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
      { title: "Content Gallery — Real AI Posts by Creators | PostSpark" },
      {
        name: "description",
        content:
          "Browse real blog posts, podcasts and videos repurposed into tweets, LinkedIn posts and newsletters with PostSpark AI — plus a free premium photo and video library.",
      },
      { property: "og:title", content: "PostSpark Community Gallery" },
      { property: "og:description", content: "Real AI-repurposed content from creators and agencies, plus free premium stock photos and videos." },
      { property: "og:url", content: "https://postspark.co/gallery" },
      { property: "og:type", content: "website" },
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

type Tab = "community" | "photos" | "videos";
type StockSource = "all" | "unsplash" | "pexels";

function GalleryPage() {
  useFadeIn();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("community");
  const [stockSource, setStockSource] = useState<StockSource>("all");
  const [stockQuery, setStockQuery] = useState("creator content");
  const [queryInput, setQueryInput] = useState("creator content");
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockVideos, setStockVideos] = useState<StockVideo[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockHasMore, setStockHasMore] = useState(true);
  const [modalAsset, setModalAsset] = useState<
    { kind: "photo"; photo: StockPhoto } | { kind: "video"; video: StockVideo } | null
  >(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const stockKind: "photos" | "videos" = tab === "videos" ? "videos" : "photos";
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
          const list = (res?.photos as StockPhoto[]) || [];
          setStockPhotos((prev) => (reset ? list : [...prev, ...list]));
          setStockVideos([]);
          setStockHasMore(list.length > 0);
        } else {
          const list = (res?.videos as StockVideo[]) || [];
          setStockVideos((prev) => (reset ? list : [...prev, ...list]));
          setStockPhotos([]);
          setStockHasMore(list.length > 0);
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

  useEffect(() => {
    setStockPage(1);
    setStockHasMore(true);
    loadStock(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockQuery, stockKind, stockSource]);

  useEffect(() => {
    const el = stockSentinelRef.current;
    if (!el || tab === "community") return;
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
  }, [stockLoading, stockHasMore, stockPage, loadStock, tab]);

  // lightbox keyboard nav
  const lbCount = stockKind === "photos" ? stockPhotos.length : stockVideos.length;
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % lbCount));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + lbCount) % lbCount));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, lbCount]);

  const touchX = useRef<number | null>(null);

  const totalFormats = new Set(items.flatMap((i) => i.formats)).size;
  const totalViews = items.reduce((a, i) => a + (i.views || 0), 0);

  return (
    <div className="lp4 min-h-screen">
      <Lp4Nav />
      <main>
        <Lp4PageHero
          label="✨ Community Gallery"
          title="Real posts,"
          accent="real creators."
          subtitle="Get inspired by content repurposed with PostSpark — then remix any of it into your own brand voice in a single click."
        >
          <Lp4TrustRow
            items={[
              `${items.length || 0}+ shared creations`,
              `${totalFormats || 9} output formats`,
              `${totalViews.toLocaleString()} views`,
              "Free stock library included",
            ]}
          />
        </Lp4PageHero>

        {/* STICKY FILTER BAR */}
        <div
          className="sticky top-[64px] z-30 px-6 py-4"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--lp-border)",
          }}
        >
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
            <div className="lp4-seg">
              {([
                { id: "community", label: "Community", Icon: Sparkles },
                { id: "photos", label: "Photos", Icon: ImageIcon },
                { id: "videos", label: "Videos", Icon: VideoIcon },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  data-active={tab === t.id}
                  className="lp4-seg-btn"
                >
                  <t.Icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            {tab !== "community" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStockQuery(queryInput.trim() || "creator content");
                }}
                className="flex flex-1 flex-wrap items-center justify-end gap-2"
              >
                <div className="relative min-w-[180px] flex-1 sm:max-w-[300px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Search photos & videos…"
                    aria-label="Search stock media"
                    className="lp4-input w-full pl-11"
                  />
                </div>
                {tab === "photos" && (
                  <div className="lp4-seg">
                    {(["all", "unsplash", "pexels"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStockSource(s)}
                        data-active={stockSource === s}
                        className="lp4-seg-btn capitalize"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                )}
                <button type="submit" className="lp4-btn-primary px-5 py-2.5" style={{ fontSize: 13, fontWeight: 700 }}>
                  Search
                </button>
              </form>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <section className="px-6 py-12 sm:py-16" style={{ background: "#FFFFFF" }}>
          <div className="mx-auto max-w-[1180px]">
            {tab === "community" ? (
              loading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="lp4-skel h-[220px]" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="lp4-card mx-auto max-w-[520px] p-12 text-center">
                  <span className="inline-grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <p className="mt-5" style={{ fontSize: 20, fontWeight: 700, color: "#0F0F1A" }}>
                    No public posts yet.
                  </p>
                  <p className="mt-2" style={{ fontSize: 14, color: "#6B7280" }}>
                    Be the first to share your work with the community.
                  </p>
                  <Link to="/signup" className="lp4-btn-primary mt-6 inline-flex px-6 py-3" style={{ fontSize: 14, fontWeight: 700 }}>
                    Create your first pack
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, i) => (
                    <Link
                      key={item.id}
                      to="/gallery/$slug"
                      params={{ slug: item.slug }}
                      className="lp4-card fade-in-up group flex flex-col p-6"
                      style={{
                        ...delay(Math.min(i, 8) * 60),
                        ...(item.featured ? { borderColor: "var(--lp-border-purple)", boxShadow: "0 10px 34px rgba(124,58,237,.14)" } : null),
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-2" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0F0F1A", lineHeight: 1.3 }}>
                          {item.title}
                        </h2>
                        {item.featured && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5"
                            style={{ background: "#FFF7E6", color: "#B4884A", border: "1px solid #F0DCB4", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}
                          >
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </div>
                      <p className="mt-3 line-clamp-3 flex-1" style={{ fontSize: 14, lineHeight: 1.65, color: "#6B7280" }}>
                        {item.preview}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.formats.slice(0, 4).map((f) => (
                          <span
                            key={f}
                            className="rounded-full px-2.5 py-1 capitalize"
                            style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid var(--lp-border-purple)", fontSize: 11, fontWeight: 600 }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between" style={{ fontSize: 12, color: "#9CA3AF" }}>
                        <span className="flex items-center gap-1.5">
                          {item.author?.avatar ? (
                            <img src={item.author.avatar} alt="" className="h-5 w-5 rounded-full object-cover" style={{ border: "1px solid var(--lp-border)" }} />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                          <span className="max-w-[110px] truncate">{item.author?.name || "Anonymous"}</span>
                          <span>·</span>
                          <Eye className="h-3.5 w-3.5" /> {item.views}
                        </span>
                        <span className="inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5" style={{ color: "#7C3AED", fontSize: 12, fontWeight: 700 }}>
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0F0F1A" }}>
                      {tab === "photos" ? "Free premium photos" : "Free premium video clips"}
                    </h2>
                    <p className="mt-1" style={{ fontSize: 14, color: "#6B7280" }}>
                      From {tab === "photos" ? "Unsplash & Pexels" : "Pexels"} — every asset fully attributed. Tap any tile to preview.
                    </p>
                  </div>
                  <Link to="/dashboard/stock-gallery" style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>
                    Open full stock library →
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tab === "photos"
                    ? stockPhotos.map((p, i) => (
                        <button
                          key={`${p.source}-${p.id}-${i}`}
                          type="button"
                          onClick={() => setLightbox(i)}
                          className="lp4-tile group aspect-[4/5] w-full text-left sm:aspect-[4/3]"
                          style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
                          aria-label={p.alt || `Photo by ${p.photographerName}`}
                        >
                          <img
                            src={p.thumbUrl}
                            alt={p.alt || `Photo by ${p.photographerName}`}
                            loading="lazy"
                            decoding="async"
                            className="lp4-tile-media absolute inset-0"
                          />
                          <span className="lp4-tile-scrim">
                            <span className="block truncate" style={{ fontWeight: 600 }}>
                              {p.photographerName}
                            </span>
                            <span className="capitalize opacity-70">{p.source}</span>
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalAsset({ kind: "photo", photo: p });
                            }}
                            className="absolute right-3 top-3 inline-grid h-8 w-8 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                            style={{ background: "rgba(255,255,255,.95)", color: "#0F0F1A" }}
                            aria-hidden
                          >
                            <Info className="h-4 w-4" />
                          </span>
                        </button>
                      ))
                    : stockVideos.map((v, i) => (
                        <button
                          key={`${v.id}-${i}`}
                          type="button"
                          onClick={() => setLightbox(i)}
                          className="lp4-tile group aspect-[4/5] w-full text-left sm:aspect-video"
                          style={{ animationDelay: `${Math.min(i, 10) * 45}ms`, background: "#0F0921" }}
                          aria-label={`Video by ${v.photographerName}`}
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
                            className="lp4-tile-media absolute inset-0"
                          />
                          <span
                            className="absolute left-1/2 top-1/2 inline-grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                            style={{ background: "rgba(255,255,255,.9)", color: "#0F0F1A" }}
                            aria-hidden
                          >
                            <Play className="h-5 w-5" />
                          </span>
                          <span className="lp4-tile-scrim">
                            <span className="block truncate" style={{ fontWeight: 600 }}>
                              {v.photographerName}
                            </span>
                            <span className="opacity-70">Pexels</span>
                          </span>
                        </button>
                      ))}

                  {stockLoading &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={`sk-${i}`} className="lp4-skel aspect-[4/5] w-full sm:aspect-[4/3]" />
                    ))}
                </div>

                {!stockLoading &&
                  ((tab === "photos" && stockPhotos.length === 0) || (tab === "videos" && stockVideos.length === 0)) && (
                    <div className="lp4-card mx-auto mt-8 max-w-[480px] p-10 text-center">
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#0F0F1A" }}>Nothing found for "{stockQuery}"</p>
                      <p className="mt-2" style={{ fontSize: 14, color: "#6B7280" }}>
                        Try a broader search like "startup", "desk" or "city".
                      </p>
                    </div>
                  )}

                <div ref={stockSentinelRef} className="h-8" />
                {!stockHasMore && (stockPhotos.length > 0 || stockVideos.length > 0) && (
                  <p className="py-4 text-center" style={{ fontSize: 12, color: "#9CA3AF" }}>
                    You've reached the end.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <Lp4FinalCta />
      </main>
      <Lp4Footer />
      <Lp4StickyCta />

      {/* LIGHTBOX */}
      {lightbox !== null && lbCount > 0 && (
        <div
          className="lp4-lb"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX ?? null;
            if (start === null || end === null) return;
            const dx = end - start;
            if (Math.abs(dx) > 48) {
              setLightbox((i) => (i === null ? i : (i + (dx < 0 ? 1 : -1) + lbCount) % lbCount));
            }
            touchX.current = null;
          }}
        >
          <button type="button" className="lp4-lb-btn absolute right-4 top-4" onClick={() => setLightbox(null)} aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="lp4-lb-btn absolute left-3 top-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? i : (i - 1 + lbCount) % lbCount));
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="lp4-lb-btn absolute right-3 top-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? i : (i + 1) % lbCount));
            }}
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="lp4-lb-frame" onClick={(e) => e.stopPropagation()}>
            {stockKind === "photos"
              ? (() => {
                  const p = stockPhotos[lightbox];
                  if (!p) return null;
                  return (
                    <>
                      <img src={p.fullUrl || p.thumbUrl} alt={p.alt || `Photo by ${p.photographerName}`} style={{ maxHeight: "80vh", display: "block", width: "100%", objectFit: "contain", background: "#0F0921" }} />
                      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ background: "#0F0921" }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
                          Photo by <strong>{p.photographerName}</strong> on <span className="capitalize">{p.source}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalAsset({ kind: "photo", photo: p })}
                          className="lp4-btn-primary px-4 py-2"
                          style={{ fontSize: 13, fontWeight: 700 }}
                        >
                          Attribution & download
                        </button>
                      </div>
                    </>
                  );
                })()
              : (() => {
                  const v = stockVideos[lightbox];
                  if (!v) return null;
                  return (
                    <>
                      <video src={v.previewUrl} poster={v.thumbUrl} controls autoPlay loop muted playsInline style={{ maxHeight: "80vh", display: "block", width: "100%", background: "#0F0921" }} />
                      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ background: "#0F0921" }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
                          Video by <strong>{v.photographerName}</strong> on Pexels
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalAsset({ kind: "video", video: v })}
                          className="lp4-btn-primary px-4 py-2"
                          style={{ fontSize: 13, fontWeight: 700 }}
                        >
                          Attribution & download
                        </button>
                      </div>
                    </>
                  );
                })()}
          </div>
        </div>
      )}

      {modalAsset && <StockAttributionModal open onClose={() => setModalAsset(null)} asset={modalAsset} />}
    </div>
  );
}
