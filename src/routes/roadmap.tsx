import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, Circle, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Public Roadmap — PostSpark" },
      { name: "description", content: "See what we're building next at PostSpark and vote on what matters most to you." },
      { property: "og:title", content: "PostSpark Public Roadmap" },
      { property: "og:description", content: "What's in progress, planned, and shipped at PostSpark." },
      { property: "og:url", content: "https://postspark.co/roadmap" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/roadmap" }],
  }),
  component: RoadmapPage,
});

const columns = [
  {
    label: "In Progress",
    icon: Loader2,
    color: "text-amber-500",
    items: [
      { title: "Native publishing API (Buffer + Typefully OAuth)", desc: "Schedule directly without leaving PostSpark." },
      { title: "AI Image Studio v2", desc: "Carousel & thumbnail templates with brand kit applied." },
      { title: "Chrome extension", desc: "Repurpose any article from your browser." },
    ],
  },
  {
    label: "Up Next",
    icon: Circle,
    color: "text-primary",
    items: [
      { title: "Repurpose from Twitter/X threads", desc: "Paste a thread URL → get LinkedIn, blog, newsletter." },
      { title: "Brand Voice fine-tuning", desc: "Improve your trained voice with thumbs-up feedback." },
      { title: "Notion & Google Docs integration", desc: "One-click import + push outputs back." },
      { title: "Team comments on drafts", desc: "Inline comments + version history." },
    ],
  },
  {
    label: "Recently Shipped",
    icon: CheckCircle2,
    color: "text-emerald-500",
    items: [
      { title: "Publish to Typefully & Buffer", desc: "One click from any result." },
      { title: "Public Gallery + Remix", desc: "Get inspired by community posts." },
      { title: "Free tier → 10/month", desc: "More room to fall in love with PostSpark." },
      { title: "Onboarding aha moment", desc: "Auto-run a sample on first login." },
    ],
  },
];

function RoadmapPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-electric">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">PostSpark</span>
          </Link>
          <Link to="/changelog" className="text-xs font-semibold text-primary hover:underline">
            See changelog →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back home
        </Link>
        <h1 className="mt-3 text-4xl font-bold text-foreground">Public Roadmap</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Built in the open. Have a request? Email <a className="text-primary hover:underline" href="mailto:hello@postspark.co">hello@postspark.co</a>.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {columns.map((col) => (
            <section key={col.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <col.icon className={`h-4 w-4 ${col.color}`} />
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{col.label}</h2>
              </div>
              <div className="mt-4 space-y-3">
                {col.items.map((it, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-background p-3">
                    <h3 className="text-sm font-semibold text-foreground">{it.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{it.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
