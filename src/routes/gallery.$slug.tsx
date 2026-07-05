import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles, User, Wand2 } from "lucide-react";
import { NavV3 } from "@/components/landing/v3/NavV3";
import { FooterV3 } from "@/components/landing/v3/FooterV3";
import { getPublicPost } from "@/lib/gallery.functions";

export const Route = createFileRoute("/gallery/$slug")({
  loader: async ({ params }) => {
    const post = await getPublicPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — PostSpark Gallery` },
          { name: "description", content: loaderData.input.slice(0, 155) },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.input.slice(0, 155) },
          { property: "og:type", content: "article" },
          { property: "og:url", content: `https://postspark.co/gallery/${params.slug}` },
          { property: "og:image", content: "https://postspark.co/og-image.png" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: loaderData.title },
          { name: "twitter:description", content: loaderData.input.slice(0, 155) },
          { name: "twitter:image", content: "https://postspark.co/og-image.png" },
        ]
      : [{ title: "Post — PostSpark Gallery" }],
    links: loaderData
      ? [{ rel: "canonical", href: `https://postspark.co/gallery/${params.slug}` }]
      : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: loaderData.title,
              description: loaderData.input.slice(0, 200),
              datePublished: loaderData.createdAt,
              author: { "@type": "Person", name: (loaderData as any).author?.name || "PostSpark Creator" },
              publisher: { "@type": "Organization", name: "PostSpark", url: "https://postspark.co" },
              url: `https://postspark.co/gallery/${params.slug}`,
            }),
          },
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Gallery", item: "https://postspark.co/gallery" },
                { "@type": "ListItem", position: 2, name: loaderData.title, item: `https://postspark.co/gallery/${params.slug}` },
              ],
            }),
          },
        ]
      : [],
  }),
  component: GalleryPostPage,
  notFoundComponent: () => (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <h1 className="font-display-lux text-3xl" style={{ color: "#FAFAF9" }}>Post not found</h1>
        <Link
          to="/gallery"
          className="lv3-cta mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          Back to gallery
        </Link>
      </div>
      <FooterV3 />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen lv3-aurora" style={{ color: "#FAFAF9" }}>
      <NavV3 />
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <h1 className="font-display-lux text-2xl" style={{ color: "#FAFAF9" }}>Something went wrong</h1>
        <p className="mt-3" style={{ color: "rgba(250,250,249,0.7)" }}>{error.message}</p>
      </div>
    </div>
  ),
});

function GalleryPostPage() {
  const post = Route.useLoaderData();

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
          <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-32 sm:pt-36 pb-10">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(250,250,249,0.55)" }}
            >
              <ArrowLeft className="h-3 w-3" /> Back to gallery
            </Link>
            <h1
              className="mt-6 font-display-lux text-balance lv3-fade-up"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                lineHeight: 1.05,
                color: "#FAFAF9",
              }}
            >
              {post.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(250,250,249,0.6)" }}>
                {(post as any).author?.avatar ? (
                  <img
                    src={(post as any).author.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                <span>
                  by <strong style={{ color: "#FAFAF9" }}>{(post as any).author?.name || "Anonymous"}</strong>
                </span>
                <span>·</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <RemixButton input={post.input} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 sm:px-8 pb-16">
          <div
            className="rounded-3xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "#A78BFA" }}>
              Original input
            </p>
            <p
              className="mt-3 whitespace-pre-wrap text-sm sm:text-[15px]"
              style={{ color: "rgba(250,250,249,0.78)", lineHeight: 1.7 }}
            >
              {post.input}
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {Object.entries(post.outputs as Record<string, string>).map(([key, val]) => (
              <div
                key={key}
                className="rounded-3xl p-6 sm:p-8"
                style={{
                  background: "linear-gradient(180deg, rgba(30,20,50,0.7), rgba(15,10,30,0.8))",
                  border: "1px solid rgba(167,139,250,0.15)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display-lux text-lg capitalize" style={{ color: "#FAFAF9" }}>
                    {key}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                    style={{
                      background: "rgba(52,211,153,0.12)",
                      color: "#34D399",
                      border: "1px solid rgba(52,211,153,0.3)",
                    }}
                  >
                    ● Live
                  </span>
                </div>
                <pre
                  className="mt-4 whitespace-pre-wrap font-sans"
                  style={{
                    color: "rgba(250,250,249,0.88)",
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  }}
                >
                  {String(val)}
                </pre>
                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: "rgba(250,250,249,0.5)" }}
                >
                  <Sparkles className="h-3 w-3" style={{ color: "#A78BFA" }} />
                  Made with PostSpark
                </Link>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-3xl lv3-gradient-border" style={{ padding: 1.5 }}>
            <div
              className="rounded-3xl p-10 text-center"
              style={{
                background: "linear-gradient(180deg, rgba(30,20,50,0.9), rgba(15,10,30,0.95))",
              }}
            >
              <h3
                className="font-display-lux"
                style={{ fontSize: "clamp(24px, 3.5vw, 36px)", color: "#FAFAF9", lineHeight: 1.1 }}
              >
                Make your own in{" "}
                <em className="lv3-text-gradient not-italic" style={{ fontStyle: "italic" }}>
                  seconds.
                </em>
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: "rgba(250,250,249,0.7)" }}>
                PostSpark turns one piece of content into 10+ formats — in your voice.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/signup"
                  className="lv3-cta inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  Try PostSpark free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FooterV3 />
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
      className="lv3-cta inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
    >
      <Wand2 className="h-3.5 w-3.5" /> Remix this
    </button>
  );
}
