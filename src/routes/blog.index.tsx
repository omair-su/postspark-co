import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
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
  head: ({ loaderData }) => {
    const posts = loaderData?.posts ?? [];
    const collectionJsonLd = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: TITLE,
      description: DESC,
      url: URL,
      blogPost: posts.slice(0, 20).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `https://postspark.co/blog/${p.slug}`,
        ...(p.cover_image_url ? { image: p.cover_image_url } : {}),
        ...(p.author?.name ? { author: { "@type": "Person", name: p.author.name } } : {}),
      })),
    };
    return {
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
      scripts: [{ type: "application/ld+json", children: JSON.stringify(collectionJsonLd) }],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { posts, categories } = Route.useLoaderData() as { posts: BlogPostListItem[]; categories: BlogCategory[] };
  const [feature, ...rest] = posts;

  return (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden lv3-grain">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 lv3-drift"
            style={{
              background:
                "radial-gradient(40% 30% at 20% 20%, rgba(124,58,237,0.32), transparent 70%), radial-gradient(35% 25% at 80% 30%, rgba(6,182,212,0.24), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-5 sm:px-8 pt-32 sm:pt-40 pb-12 text-center">
            <span className="lv3-chip lv3-fade-up">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
              PostSpark Journal
            </span>
            <h1
              className="mt-6 font-display-lux text-balance lv3-fade-up"
              style={{
                fontSize: "clamp(40px, 6.5vw, 84px)",
                lineHeight: 1.03,
                color: "#FAFAF9",
                maxWidth: "20ch",
                marginInline: "auto",
              }}
            >
              Field notes on{" "}
              <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>
                AI content
              </em>
              , brand voice & creator workflows.
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl lv3-fade-up"
              style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.6, color: "rgba(250,250,249,0.7)" }}
            >
              Frameworks, case studies, and playbooks from the team building PostSpark.
            </p>

            {categories.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2 lv3-fade-up">
                <Link
                  to="/blog"
                  className="rounded-full px-4 py-1.5 text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                    color: "#FFFFFF",
                    boxShadow: "0 6px 20px rgba(124,58,237,0.35)",
                  }}
                >
                  All posts
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/blog/category/$slug"
                    params={{ slug: c.slug }}
                    className="rounded-full px-4 py-1.5 text-sm font-medium transition"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "rgba(250,250,249,0.75)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* POSTS */}
        <section className="relative mx-auto max-w-6xl px-5 sm:px-8 pb-24 sm:pb-32">
          {posts.length === 0 ? (
            <div className="rounded-3xl lv3-glass lv3-gradient-border p-16 text-center">
              <p className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>No posts yet.</p>
              <p className="mt-2 text-sm" style={{ color: "rgba(250,250,249,0.6)" }}>
                Our first articles are on the way. Check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {feature && (
                <Link
                  to="/blog/$slug"
                  params={{ slug: feature.slug }}
                  className="group relative block overflow-hidden rounded-3xl lv3-gradient-border"
                  style={{ padding: 1.5 }}
                >
                  <div
                    className="grid gap-0 md:grid-cols-2 rounded-3xl overflow-hidden"
                    style={{
                      background: "linear-gradient(180deg, rgba(30,20,50,0.85), rgba(15,10,30,0.9))",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    {feature.cover_image_url ? (
                      <img
                        src={feature.cover_image_url}
                        alt={feature.title}
                        width={800}
                        height={600}
                        className="h-64 md:h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="h-64 md:h-full w-full"
                        style={{
                          background:
                            "radial-gradient(60% 60% at 50% 40%, rgba(124,58,237,0.55) 0%, rgba(6,182,212,0.3) 50%, transparent 80%)",
                        }}
                      />
                    )}
                    <div className="flex flex-col justify-center p-8 sm:p-12">
                      <span
                        className="inline-flex self-start items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{
                          background: "rgba(124,58,237,0.18)",
                          color: "#C4B5FD",
                          border: "1px solid rgba(124,58,237,0.3)",
                        }}
                      >
                        <Sparkles className="h-3 w-3" /> Featured
                      </span>
                      {feature.category && (
                        <span className="mt-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "#A78BFA" }}>
                          {feature.category.name}
                        </span>
                      )}
                      <h2
                        className="mt-3 font-display-lux"
                        style={{
                          fontSize: "clamp(24px, 3.2vw, 40px)",
                          lineHeight: 1.1,
                          color: "#FAFAF9",
                        }}
                      >
                        {feature.title}
                      </h2>
                      <p className="mt-4 text-sm sm:text-base" style={{ color: "rgba(250,250,249,0.7)", lineHeight: 1.65 }}>
                        {feature.excerpt}
                      </p>
                      <div className="mt-6 flex items-center justify-between text-xs" style={{ color: "rgba(250,250,249,0.55)" }}>
                        <span>{feature.author?.name ?? "PostSpark"}</span>
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#A78BFA" }}>
                          Read article <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Rest */}
              {rest.length > 0 && (
                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => (
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
                        {p.category && (
                          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A78BFA" }}>
                            {p.category.name}
                          </span>
                        )}
                        <h2
                          className="mt-2 font-display-lux text-xl group-hover:opacity-90"
                          style={{ color: "#FAFAF9", lineHeight: 1.2 }}
                        >
                          {p.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 flex-1 text-sm" style={{ color: "rgba(250,250,249,0.65)", lineHeight: 1.6 }}>
                          {p.excerpt}
                        </p>
                        <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "rgba(250,250,249,0.5)" }}>
                          <span>{p.author?.name ?? "PostSpark"}</span>
                          {p.reading_time_minutes && <span>{p.reading_time_minutes} min read</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <FooterV3 />
      </main>
    </div>
  );
}
