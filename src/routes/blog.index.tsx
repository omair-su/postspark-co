import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { BlogPostListItem, BlogCategory } from "@/lib/blog-types";

const TITLE = "PostSpark Blog — Content Repurposing & AI Writing";
const DESC = "Frameworks, tutorials, and case studies on AI content repurposing, brand voice, and creator workflows from the PostSpark team.";
const URL = "https://postspark.co/blog";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const { listPosts, listCategories } = await import("@/lib/blog.functions");
    const [posts, categories] = await Promise.all([listPosts({ data: {} }), listCategories()]);
    return { posts, categories };
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [
      { rel: "canonical", href: URL },
      { rel: "alternate", type: "application/rss+xml", title: "PostSpark Blog RSS", href: "https://postspark.co/rss.xml" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts, categories } = Route.useLoaderData() as { posts: BlogPostListItem[]; categories: BlogCategory[] };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <header className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">PostSpark Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Frameworks, tutorials, and case studies on AI content repurposing.
          </p>
          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <Link to="/blog" className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/blog/category/$slug"
                  params={{ slug: c.slug }}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-lg font-semibold text-foreground">No posts yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Our first articles are on the way. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50"
                >
                  {p.cover_image_url && (
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      width={600}
                      height={338}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    {p.category && (
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category.name}</span>
                    )}
                    <h2 className="mt-2 text-xl font-bold text-foreground group-hover:text-primary">{p.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.author?.name ?? "PostSpark"}</span>
                      {p.reading_time_minutes && <span>{p.reading_time_minutes} min read</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
