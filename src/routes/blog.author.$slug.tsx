import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import type { BlogPostListItem, BlogAuthor } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/author/$slug")({
  loader: async ({ params }) => {
    const { getAuthorBySlug, listPosts } = await import("@/lib/blog.functions");
    const author = await getAuthorBySlug({ data: { slug: params.slug } });
    if (!author) throw notFound();
    const posts = await listPosts({ data: { authorSlug: params.slug } });
    return { author, posts };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Author — PostSpark Blog" }] };
    const { author } = loaderData;
    const url = `https://postspark.co/blog/author/${author.slug}`;
    const title = `${author.name} — PostSpark Blog`;
    const desc = author.bio || `Articles by ${author.name} on the PostSpark blog.`;
    const personJsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: author.name,
      description: author.bio,
      image: author.avatar_url,
      url,
      sameAs: [
        author.twitter_handle ? `https://twitter.com/${author.twitter_handle}` : null,
        author.linkedin_url,
      ].filter(Boolean),
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        ...(author.avatar_url ? [{ property: "og:image", content: author.avatar_url }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(personJsonLd) }],
    };
  },
  component: AuthorPage,
  notFoundComponent: () => (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <h1 className="font-display-lux text-4xl" style={{ color: "#FAFAF9" }}>Author not found</h1>
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

function AuthorPage() {
  const { author, posts } = Route.useLoaderData() as { author: BlogAuthor; posts: BlogPostListItem[] };
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
          <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-32 sm:pt-40 pb-16 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(250,250,249,0.55)" }}
            >
              <ArrowLeft className="h-3 w-3" /> Back to blog
            </Link>
            {author.avatar_url && (
              <img
                src={author.avatar_url}
                alt={author.name}
                width={112}
                height={112}
                className="mx-auto mt-8 h-28 w-28 rounded-full object-cover"
                style={{
                  border: "2px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 20px 60px -20px rgba(124,58,237,0.5)",
                }}
              />
            )}
            <span className="lv3-chip mt-6">Author</span>
            <h1
              className="mt-4 font-display-lux"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1.05,
                color: "#FAFAF9",
              }}
            >
              {author.name}
            </h1>
            {author.bio && (
              <p
                className="mx-auto mt-5 max-w-xl"
                style={{ fontSize: "clamp(16px, 1.3vw, 18px)", lineHeight: 1.65, color: "rgba(250,250,249,0.7)" }}
              >
                {author.bio}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              {author.twitter_handle && (
                <a
                  href={`https://twitter.com/${author.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold"
                  style={{ color: "#A78BFA" }}
                >
                  @{author.twitter_handle}
                </a>
              )}
              {author.linkedin_url && (
                <a
                  href={author.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold"
                  style={{ color: "#A78BFA" }}
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-24">
          {posts.length === 0 ? (
            <div className="rounded-3xl lv3-glass lv3-gradient-border p-16 text-center">
              <p className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>No posts published yet.</p>
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
                    {p.category && (
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A78BFA" }}>
                        {p.category.name}
                      </span>
                    )}
                    <h2 className="mt-2 font-display-lux text-xl" style={{ color: "#FAFAF9", lineHeight: 1.2 }}>
                      {p.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm" style={{ color: "rgba(250,250,249,0.65)", lineHeight: 1.6 }}>
                      {p.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#A78BFA" }}>
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
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
