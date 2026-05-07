import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, User, Wand2 } from "lucide-react";
import { getPublicPost } from "@/lib/gallery.functions";

export const Route = createFileRoute("/gallery/$slug")({
  loader: async ({ params }) => {
    const post = await getPublicPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — PostSpark Gallery` },
          { name: "description", content: loaderData.input.slice(0, 155) },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.input.slice(0, 155) },
        ]
      : [{ title: "Post — PostSpark Gallery" }],
  }),
  component: GalleryPostPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
        <Link to="/gallery" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to Gallery
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function GalleryPostPage() {
  const post = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/gallery" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Gallery
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-foreground">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(post as any).author?.avatar ? (
              <img src={(post as any).author.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <User className="h-3 w-3" />
              </div>
            )}
            <span>by <strong className="text-foreground">{(post as any).author?.name || "Anonymous"}</strong></span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <RemixButton input={post.input} />
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Original Input</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{post.input}</p>
        </div>

        {Object.entries(post.outputs as Record<string, string>).map(([key, val]) => (
          <div key={key} className="mt-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground capitalize">{key}</h2>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{String(val)}</pre>
          </div>
        ))}

        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-bold text-foreground">Make your own in seconds</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PostSpark turns one piece of content into 10+ formats.
          </p>
          <Link
            to="/signup"
            className="mt-4 inline-flex rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try PostSpark free
          </Link>
        </div>
      </main>
    </div>
  );
}

function RemixButton({ input }: { input: string }) {
  const navigate = useNavigate();
  const handleRemix = () => {
    try {
      sessionStorage.setItem("postspark.import.text", input);
    } catch {}
    navigate({ to: "/dashboard/repurpose" });
  };
  return (
    <button
      onClick={handleRemix}
      className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 glow-electric"
    >
      <Wand2 className="h-3.5 w-3.5" /> Remix this
    </button>
  );
}
