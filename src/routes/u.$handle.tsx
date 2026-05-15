import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, User, Eye, Star } from "lucide-react";
import { getCreatorShowcase } from "@/lib/showcase.functions";

export const Route = createFileRoute("/u/$handle")({
  loader: async ({ params }) => {
    const data = await getCreatorShowcase({ data: { handle: params.handle } });
    if (!data.profile) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.profile as any;
    const name = p?.display_name || params.handle;
    const tagline = p?.tagline || `${name}'s public content showcase on PostSpark.`;
    const title = `${name} (@${params.handle}) · PostSpark`;
    return {
      meta: [
        { title },
        { name: "description", content: tagline.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: tagline.slice(0, 155) },
        { property: "og:type", content: "profile" },
        { property: "og:image", content: p?.avatar_url || undefined },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: tagline.slice(0, 155) },
      ].filter((m) => (m as any).content !== undefined),
      links: [
        { rel: "canonical", href: `https://postspark.co/u/${params.handle}` },
      ],
    };
  },
  component: ShowcasePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Creator not found</h1>
        <Link to="/gallery" className="mt-4 inline-block text-sm text-primary hover:underline">
          Browse the public gallery →
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

function ShowcasePage() {
  const { profile, jobs } = Route.useLoaderData() as any;
  const handle = profile.handle;
  const name = profile.display_name || handle;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
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
            Make your own
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link to="/gallery" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to gallery
        </Link>

        {/* Hero */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">@{handle}</p>
          {profile.tagline && (
            <p className="mt-4 mx-auto max-w-xl text-base text-foreground/80">{profile.tagline}</p>
          )}
        </section>

        {/* Posts grid */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Public posts</h2>
          {jobs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {name} hasn't published anything yet. Check back soon.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {jobs.map((j: any) => {
                const preview =
                  (j.outputs?.tweets || j.outputs?.linkedin || j.outputs?.raw || j.input_text || "").toString().slice(0, 200);
                return (
                  <Link
                    key={j.id}
                    to="/gallery/$slug"
                    params={{ slug: j.public_slug }}
                    className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2">
                        {j.title || j.input_text?.slice(0, 60) || "Untitled"}
                      </h3>
                      {j.is_featured && <Star className="h-3.5 w-3.5 text-primary fill-primary shrink-0" />}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{preview}</p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {j.view_count || 0}</span>
                      <span>{new Date(j.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-12 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built with{" "}
            <Link to="/" className="font-semibold text-primary hover:underline">PostSpark</Link>{" "}
            — turn one idea into a week of content.
          </p>
        </div>
      </main>
    </div>
  );
}
