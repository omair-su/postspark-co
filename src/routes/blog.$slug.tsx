import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import type { BlogPostFull } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { getPostBySlug } = await import("@/lib/blog.functions");
    const post = await getPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post: post as BlogPostFull, html: (post as any).html as string };
  },

  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Article — PostSpark" }] };
    const { post } = loaderData;
    const url = `https://postspark.co/blog/${post.slug}`;
    const title = post.meta_title || `${post.title} — PostSpark Blog`;
    const desc = post.meta_description || post.excerpt;
    const image = post.cover_image_url || "https://postspark.co/og-image.png";

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: desc,
      image,
      datePublished: post.published_at,
      dateModified: post.published_at,
      author: post.author
        ? { "@type": "Person", name: post.author.name, url: `https://postspark.co/blog/author/${post.author.slug}` }
        : undefined,
      publisher: {
        "@type": "Organization",
        name: "PostSpark",
        logo: { "@type": "ImageObject", url: "https://postspark.co/og-image.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:type", content: "article" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(articleJsonLd) }],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <h1 className="font-display-lux text-4xl" style={{ color: "#FAFAF9" }}>
          Post not found
        </h1>
        <p className="mt-3" style={{ color: "rgba(250,250,249,0.65)" }}>
          This article may have been moved or unpublished.
        </p>
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
        <h1 className="font-display-lux text-3xl" style={{ color: "#FAFAF9" }}>Something went wrong</h1>
        <p className="mt-3" style={{ color: "rgba(250,250,249,0.65)" }}>{error.message}</p>
      </div>
    </div>
  ),
});

function BlogPost() {
  const { post, html } = Route.useLoaderData();
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
          <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-32 sm:pt-40 pb-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(250,250,249,0.55)" }}
            >
              <ArrowLeft className="h-3 w-3" /> Back to blog
            </Link>
            {post.category && (
              <div className="mt-6">
                <Link
                  to="/blog/category/$slug"
                  params={{ slug: post.category.slug }}
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#A78BFA" }}
                >
                  {post.category.name}
                </Link>
              </div>
            )}
            <h1
              className="mt-4 font-display-lux text-balance lv3-fade-up"
              style={{
                fontSize: "clamp(36px, 5.5vw, 68px)",
                lineHeight: 1.05,
                color: "#FAFAF9",
              }}
            >
              {post.title}
            </h1>
            <p
              className="mt-6 lv3-fade-up"
              style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, color: "rgba(250,250,249,0.75)" }}
            >
              {post.excerpt}
            </p>
            <div
              className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-y py-4 text-sm"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {post.author && (
                <Link
                  to="/blog/author/$slug"
                  params={{ slug: post.author.slug }}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  {post.author.avatar_url && (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.name}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                    />
                  )}
                  <span className="font-semibold" style={{ color: "#FAFAF9" }}>
                    {post.author.name}
                  </span>
                </Link>
              )}
              {post.published_at && (
                <span style={{ color: "rgba(250,250,249,0.55)" }}>
                  ·{" "}
                  {new Date(post.published_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              {post.reading_time_minutes && (
                <span style={{ color: "rgba(250,250,249,0.55)" }}>
                  · {post.reading_time_minutes} min read
                </span>
              )}
            </div>

            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                width={1200}
                height={675}
                className="mt-10 aspect-video w-full rounded-2xl object-cover"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 40px 100px -30px rgba(0,0,0,0.7)",
                }}
              />
            )}
          </div>
        </section>

        {/* ARTICLE BODY — bright reading surface for comfort */}
        <section className="relative">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 pb-16">
            <div
              className="rounded-3xl p-8 sm:p-12"
              style={{
                background: "#FAFAF9",
                color: "#0F172A",
                boxShadow: "0 40px 100px -30px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="prose prose-neutral max-w-none prose-headings:font-display-lux prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:text-violet-700 prose-li:text-slate-700 prose-blockquote:border-l-violet-500 prose-blockquote:text-slate-600"
                style={{
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  fontSize: 17,
                  lineHeight: 1.75,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>

            {/* CTA */}
            <div className="mt-12 rounded-3xl lv3-gradient-border" style={{ padding: 1.5 }}>
              <div
                className="rounded-3xl p-10 text-center"
                style={{
                  background: "linear-gradient(180deg, rgba(30,20,50,0.9), rgba(15,10,30,0.95))",
                }}
              >
                <span className="lv3-chip mx-auto">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
                  Try PostSpark
                </span>
                <h2
                  className="mt-5 font-display-lux"
                  style={{ fontSize: "clamp(26px, 3.5vw, 40px)", color: "#FAFAF9", lineHeight: 1.1 }}
                >
                  Turn one piece of content into{" "}
                  <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>
                    a month of posts.
                  </em>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm sm:text-base" style={{ color: "rgba(250,250,249,0.7)" }}>
                  Free forever plan. No card required. Cancel anytime.
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    to="/signup"
                    className="lv3-cta inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                  >
                    Start free <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FooterV3 />
      </main>
    </div>
  );
}
