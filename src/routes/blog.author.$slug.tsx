import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAuthorBySlug, listPosts } from "@/server/blog.functions";

export const Route = createFileRoute("/blog/author/$slug")({
  loader: async ({ params }) => {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-bold text-foreground">Author not found</h1>
        <Link to="/blog" className="mt-6 inline-block rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground">Back to blog</Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background"><Navbar /><div className="mx-auto max-w-3xl px-4 py-32 text-center"><p>{error.message}</p></div></div>
  ),
});

function AuthorPage() {
  const { author, posts } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <header className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          {author.avatar_url && <img src={author.avatar_url} alt={author.name} width={96} height={96} className="mx-auto h-24 w-24 rounded-full" />}
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{author.name}</h1>
          {author.bio && <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{author.bio}</p>}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            {author.twitter_handle && <a href={`https://twitter.com/${author.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@{author.twitter_handle}</a>}
            {author.linkedin_url && <a href={author.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>}
          </div>
        </header>
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No posts published yet.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50">
                  {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} width={600} height={338} loading="lazy" className="aspect-video w-full object-cover" />}
                  <div className="flex flex-1 flex-col p-6">
                    {p.category && <span className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category.name}</span>}
                    <h2 className="mt-2 text-xl font-bold text-foreground group-hover:text-primary">{p.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
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
