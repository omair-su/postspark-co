import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { renderMarkdown } from "@/lib/markdown";
import type { BlogPostFull } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { getPostBySlug } = await import("@/lib/blog.functions");
    const post = await getPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    const html = renderMarkdown(post.content_md);
    return { post: post as BlogPostFull, html };
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
      author: post.author ? { "@type": "Person", name: post.author.name, url: `https://postspark.co/blog/author/${post.author.slug}` } : undefined,
      publisher: { "@type": "Organization", name: "PostSpark", logo: { "@type": "ImageObject", url: "https://postspark.co/og-image.png" } },
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-bold text-foreground">Post not found</h1>
        <p className="mt-2 text-muted-foreground">This article may have been moved or unpublished.</p>
        <Link to="/blog" className="mt-6 inline-block rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground">Back to blog</Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function BlogPost() {
  const { post, html } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          {post.category && (
            <Link to="/blog/category/$slug" params={{ slug: post.category.slug }} className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
              {post.category.name}
            </Link>
          )}
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-6 flex items-center gap-3 border-y border-border py-4 text-sm">
            {post.author && (
              <Link to="/blog/author/$slug" params={{ slug: post.author.slug }} className="flex items-center gap-3 hover:opacity-80">
                {post.author.avatar_url && (
                  <img src={post.author.avatar_url} alt={post.author.name} width={36} height={36} className="h-9 w-9 rounded-full" />
                )}
                <span className="font-medium text-foreground">{post.author.name}</span>
              </Link>
            )}
            {post.published_at && (
              <span className="text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            {post.reading_time_minutes && <span className="text-muted-foreground">· {post.reading_time_minutes} min read</span>}
          </div>

          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} width={1200} height={675} className="mt-8 aspect-video w-full rounded-xl object-cover" />
          )}

          <div
            className="prose prose-neutral dark:prose-invert mt-10 max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-li:text-foreground/90"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-16 rounded-2xl border border-border gradient-electric p-8 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground">Try PostSpark free</h2>
            <p className="mt-2 text-primary-foreground/90">Turn one piece of content into a full week of posts.</p>
            <Link to="/signup" className="mt-4 inline-block rounded-lg bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
              Get started
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
