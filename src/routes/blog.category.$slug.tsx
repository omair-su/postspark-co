import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import type { BlogPostListItem, BlogCategory } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: async ({ params }) => {
    const { getCategoryBySlug, listPosts } = await import("@/lib/blog.functions");
    const category = await getCategoryBySlug({ data: { slug: params.slug } });
    if (!category) throw notFound();
    const posts = await listPosts({ data: { categorySlug: params.slug } });
    return { category, posts };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Category — PostSpark Blog" }] };
    const { category } = loaderData;
    const url = `https://postspark.co/blog/category/${category.slug}`;
    const title = `${category.name} — PostSpark Blog`;
    const desc = category.description || `Articles on ${category.name} from the PostSpark team.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:image", content: "https://postspark.co/og-image.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: "https://postspark.co/og-image.png" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <h1 className="font-display-lux text-4xl" style={{ color: "#FAFAF9" }}>Category not found</h1>
        <Link
          to="/blog"
          className="lv3-cta mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          Back to blog
        </Link>
      </div>
      <FooterV3 />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <p style={{ color: "rgba(250,250,249,0.7)" }}>{error.message}</p>
      </div>
    </div>
  ),
});

function CategoryPage() {
  const { category, posts } = Route.useLoaderData() as { category: BlogCategory; posts: BlogPostListItem[] };
  return (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <main>
        <section className="relative overflow-hidden lv3-grain">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 lv3-drift"
            style={{
              background:
                "radial-gradient(40% 30% at 20% 20%, rgba(124,58,237,0.32), transparent 70%), radial-gradient(35% 25% at 80% 30%, rgba(6,182,212,0.24), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-5 sm:px-8 pt-32 sm:pt-40 pb-16 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(250,250,249,0.55)" }}
            >
              <ArrowLeft className="h-3 w-3" /> All posts
            </Link>
            <span className="lv3-chip mt-6">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
              Category
            </span>
            <h1
              className="mt-4 font-display-lux"
              style={{
                fontSize: "clamp(40px, 6vw, 76px)",
                lineHeight: 1.03,
                color: "#FAFAF9",
              }}
            >
              <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>
                {category.name}
              </em>
            </h1>
            {category.description && (
              <p
                className="mx-auto mt-6 max-w-2xl"
                style={{ fontSize: "clamp(16px, 1.3vw, 19px)", lineHeight: 1.65, color: "rgba(250,250,249,0.7)" }}
              >
                {category.description}
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-24">
          {posts.length === 0 ? (
            <div className="rounded-3xl lv3-glass lv3-gradient-border p-16 text-center">
              <p className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>No posts in this category yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col overflow-hidden rounded-3xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      width={600}
                      height={338}
                      loading="lazy"
                      className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="aspect-video w-full"
                      style={{
                        background:
                          "radial-gradient(60% 60% at 50% 40%, rgba(124,58,237,0.45) 0%, rgba(6,182,212,0.25) 50%, transparent 80%)",
                      }}
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display-lux text-xl" style={{ color: "#FAFAF9", lineHeight: 1.2 }}>
                      {p.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm" style={{ color: "rgba(250,250,249,0.65)", lineHeight: 1.6 }}>
                      {p.excerpt}
                    </p>
                    <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "rgba(250,250,249,0.5)" }}>
                      <span>{p.author?.name ?? "PostSpark"}</span>
                      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#A78BFA" }}>
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <FooterV3 />
      </main>
    </div>
  );
}
