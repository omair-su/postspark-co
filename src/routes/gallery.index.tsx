import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGalleryFeed } from "@/lib/gallery.functions";
import { Sparkles, Eye, ArrowRight, Loader2, Star, User } from "lucide-react";

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

function GalleryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGalleryFeed()
      .then((data) => setItems(data as Item[]))
      .finally(() => setLoading(false));
  }, []);

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
      </main>
    </div>
  );
}
