import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { BlogPostListItem, BlogCategory } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: async ({ params }) => {
    const { getCategoryBySlug, listPosts } = await import("@/server/blog.functions");
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
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-bold text-foreground">Category not found</h1>
        <Link to="/blog" className="mt-6 inline-block rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground">Back to blog</Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background"><Navbar /><div className="mx-auto max-w-3xl px-4 py-32 text-center"><p>{error.message}</p></div></div>
  ),
});

function CategoryPage() {
  const { category, posts } = Route.useLoaderData() as { category: BlogCategory; posts: BlogPostListItem[] };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <header className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Category</span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{category.name}</h1>
          {category.description && <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{category.description}</p>}
        </header>
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No posts in this category yet.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50">
                  {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} width={600} height={338} loading="lazy" className="aspect-video w-full object-cover" />}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary">{p.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                    <div className="mt-4 text-xs text-muted-foreground">{p.author?.name ?? "PostSpark"}</div>
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
