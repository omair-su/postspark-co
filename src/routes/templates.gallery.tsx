import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Sparkles, Layers } from "lucide-react";
import { listPublicTemplates } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/templates/gallery")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Template Marketplace · PostSpark" },
      { name: "description", content: "Browse community-made content templates and import them into your workspace in one click." },
    ],
  }),
});

const CATEGORIES = ["all", "social", "newsletter", "video", "thread", "launch", "other"];

interface PublicTemplate {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  tone: string;
  selected_types: string[];
  use_count: number;
}

function GalleryPage() {
  const [items, setItems] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    listPublicTemplates({
      data: { category: category === "all" ? undefined : category, search: search || undefined },
    } as any)
      .then((r: any) => setItems(r.templates || []))
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Template Marketplace</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Community-made post templates. Import any template into your workspace and start generating in one click.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    category === c
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Layers className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No templates yet for this category.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <Link
                key={t.id}
                to="/templates/$slug"
                params={{ slug: t.slug || t.id }}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {t.category || "general"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{t.use_count} uses</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground group-hover:text-primary">
                  {t.name}
                </h3>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                    {t.tone}
                  </span>
                  {(t.selected_types || []).slice(0, 4).map((s) => (
                    <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View template <Sparkles className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
