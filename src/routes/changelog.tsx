import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — PostSpark" },
      { name: "description", content: "What's new in PostSpark — features, improvements, and fixes shipped each week." },
      { property: "og:title", content: "PostSpark Changelog" },
      { property: "og:description", content: "Weekly updates: new formats, integrations, AI improvements." },
      { property: "og:url", content: "https://postspark.co/changelog" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/changelog" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "PostSpark Changelog",
          description: "What's new in PostSpark — features, improvements, and fixes shipped each week.",
          author: { "@type": "Organization", name: "PostSpark" },
          publisher: {
            "@type": "Organization",
            name: "PostSpark",
            logo: { "@type": "ImageObject", url: "https://postspark.co/og-image.png" },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": "https://postspark.co/changelog" },
        }),
      },
    ],
  }),
  component: ChangelogPage,
});

const releases = [
  {
    version: "1.4.0",
    date: "May 7, 2026",
    title: "Publishing & Gallery Remix",
    items: [
      "🚀 One-click publish to Typefully and Buffer from any result",
      "✨ Brand Voice quality score — see how well your voice is trained",
      "🎨 Public Gallery: Remix any post + creator attribution",
      "📋 Changelog & Public Roadmap pages",
    ],
  },
  {
    version: "1.3.0",
    date: "May 1, 2026",
    title: "Activation & UX",
    items: [
      "Onboarding now auto-runs your first sample repurpose",
      "Import (URL, PDF, DOCX, audio) merged into Repurpose tabs",
      "Dashboard 'Suggest content' widget for one-click samples",
      "Sidebar reorganized into Create / Plan / Brand / Insights",
    ],
  },
  {
    version: "1.2.0",
    date: "Apr 22, 2026",
    title: "Conversion fundamentals",
    items: [
      "Free tier increased to 10 repurposes/month",
      "Interactive hero demo with typewriter animation",
      "Annual billing toggle (save 20%) and feature comparison table",
      "Updated testimonials with creator handles",
    ],
  },
  {
    version: "1.1.0",
    date: "Apr 10, 2026",
    title: "Brand & Team",
    items: [
      "Brand Kit (logo, colors, fonts) auto-applied to generations",
      "Team workspaces, approvals, and agency analytics",
      "Referrals system with reward tracking",
    ],
  },
  {
    version: "1.0.0",
    date: "Mar 15, 2026",
    title: "PostSpark launch",
    items: [
      "10+ output formats from any text, URL, video, or audio",
      "Pro & Agency plans via Paddle",
      "Brand Voice training (Pro)",
    ],
  },
];

function ChangelogPage() {
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
          <Link to="/roadmap" className="text-xs font-semibold text-primary hover:underline">
            See roadmap →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back home
        </Link>
        <h1 className="mt-3 text-4xl font-bold text-foreground">Changelog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          New features, improvements, and fixes shipped to PostSpark.
        </p>

        <div className="mt-10 space-y-10">
          {releases.map((r) => (
            <section key={r.version} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{r.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">v{r.version} · {r.date}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Released
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {r.items.map((it, i) => (
                  <li key={i} className="text-sm text-foreground/90">{it}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
