import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, Store, ArrowLeft } from "lucide-react";
import { listPublicTemplates } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/templates/gallery")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Template Marketplace · PostSpark" },
      { name: "description", content: "Browse 30+ ready-to-use templates from the PostSpark team and community. Import any template into your workspace in one click." },
    ],
  }),
});

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "thread", label: "Thread" },
  { id: "newsletter", label: "Newsletter" },
  { id: "video", label: "Video" },
  { id: "launch", label: "Launch" },
  { id: "other", label: "Other" },
];

const categoryColor: Record<string, string> = {
  social: "#6B4EFF",
  thread: "#1DA1F2",
  newsletter: "#059669",
  video: "#EC4899",
  launch: "#F97316",
  other: "#6B7280",
};

interface PublicTemplate {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  platform: string | null;
  tone: string;
  selected_types: string[];
  preview_text: string | null;
  use_count: number;
  is_official: boolean;
}

function GalleryPage() {
  const [items, setItems] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"popular" | "newest">("popular");

  useEffect(() => {
    setLoading(true);
    listPublicTemplates({
      data: {
        category: category === "all" ? undefined : category,
        search: search || undefined,
        sort,
      },
    } as any)
      .then((r: any) => setItems(r.templates || []))
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((t) => {
      const k = (t.category || "other").toLowerCase();
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <header className="border-b border-border bg-gradient-to-br from-card to-[rgba(107,78,255,0.04)]">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link to="/dashboard/templates" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Templates
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(107,78,255,0.12)]">
              <Store className="h-5 w-5 text-[#6B4EFF]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Template Marketplace</h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Ready-to-use templates from the PostSpark team and community. One click to import into your workspace.
          </p>

          {/* Search + sort */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]/40"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium"
            >
              <option value="popular">Most used</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Categories */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  category === c.id
                    ? "border-[#6B4EFF] bg-[rgba(107,78,255,0.1)] text-[#6B4EFF]"
                    : "border-border text-muted-foreground hover:border-[#6B4EFF]/40"
                }`}
              >
                {c.label} {counts[c.id] != null && `(${counts[c.id]})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* GRID */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No templates yet for this filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => {
              const cat = (t.category || "other").toLowerCase();
              return (
                <Link
                  key={t.id}
                  to="/templates/$slug"
                  params={{ slug: t.slug || t.id }}
                  className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[#6B4EFF]/40 hover:shadow-[0_8px_24px_rgba(107,78,255,0.1)]"
                  style={{ borderTopWidth: 3, borderTopColor: categoryColor[cat] || categoryColor.other }}
                >
                  {t.is_official && (
                    <span className="absolute right-3 top-3 rounded-md bg-[rgba(107,78,255,0.1)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6B4EFF]">
                      Official
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: categoryColor[cat] }}>
                    {t.category || "general"}
                  </span>
                  <h3 className="mt-2 pr-14 text-base font-semibold leading-snug group-hover:text-[#6B4EFF]">{t.name}</h3>
                  {t.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                  )}
                  {t.preview_text && (
                    <p className="mt-3 line-clamp-2 rounded-md bg-muted/50 px-2.5 py-2 text-[11px] italic text-muted-foreground/80">
                      {t.preview_text}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex flex-wrap gap-1">
                      {t.platform && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">{t.platform}</span>
                      )}
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{t.tone}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t.use_count.toLocaleString()} uses</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
