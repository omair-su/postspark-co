import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bookmark, Plus, Trash2, X, Loader2, Play, Globe, Lock, Store, Sparkles, Search, LayoutGrid } from "lucide-react";
import { getTemplates, createTemplate, deleteTemplate } from "@/lib/templates.functions";
import { togglePublishTemplate, listPublicTemplates, cloneTemplate } from "@/lib/marketplace.functions";
import { HeroArt } from "@/components/dashboard/HeroArt";

const allTypes = [
  { id: "tweets", label: "Tweets" },
  { id: "thread", label: "X Thread" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "email", label: "Email" },
  { id: "video", label: "Video" },
  { id: "podcast", label: "Podcast" },
  { id: "seo", label: "SEO" },
];
const tones = ["professional", "casual", "bold", "storytelling", "humorous", "educational", "inspirational", "authentic"];
const categories = ["social", "thread", "newsletter", "video", "launch", "other"];
const platformOptions = ["Twitter/X", "LinkedIn", "Instagram", "Facebook", "TikTok", "YouTube", "Email", "Threads", "Other"];

interface Template {
  id: string;
  name: string;
  tone: string;
  custom_instructions: string;
  selected_types: string[];
  created_at: string;
  is_public?: boolean;
  is_official?: boolean;
  category?: string | null;
  platform?: string | null;
  description?: string | null;
  preview_text?: string | null;
  slug?: string | null;
  use_count?: number;
}

export const Route = createFileRoute("/dashboard/templates")({
  component: TemplatesPage,
  head: () => ({
    meta: [
      { title: "Templates — PostSpark" },
      { name: "description", content: "Save your format & tone combinations. One click to reuse." },
    ],
  }),
});

const categoryColor: Record<string, string> = {
  social: "#6B4EFF",
  thread: "#1DA1F2",
  newsletter: "#059669",
  video: "#EC4899",
  launch: "#F97316",
  other: "#6B7280",
};

const filterCategories = ["all", "social", "thread", "newsletter", "video", "launch", "other"];

const platformTagClass: Record<string, string> = {
  "twitter/x": "bg-black/5 text-foreground border-black/10 dark:bg-white/10 dark:text-white dark:border-white/15",
  linkedin: "bg-[#e8f0fe] text-[#1d4ed8] border-[#bfdbfe] dark:bg-[#0a66c2]/15 dark:text-[#8ab4f8] dark:border-[#0a66c2]/40",
  instagram: "bg-[#fce7f3] text-[#be185d] border-[#fbcfe8] dark:bg-[#be185d]/15 dark:text-[#f9a8d4] dark:border-[#be185d]/40",
  email: "bg-[#fef3c7] text-[#92400e] border-[#fde68a] dark:bg-[#92400e]/20 dark:text-[#fcd34d] dark:border-[#92400e]/40",
};

function TemplateCard({
  t,
  index,
  onUse,
  onDelete,
  onPublishToggle,
}: {
  t: Template;
  index: number;
  onUse: (t: Template) => void;
  onDelete?: (t: Template) => void;
  onPublishToggle?: (t: Template) => void;
}) {
  const cat = (t.category || "other").toLowerCase();
  const accent = categoryColor[cat] || categoryColor.other;
  const tagClass = t.platform ? platformTagClass[t.platform.toLowerCase()] : undefined;
  return (
    <div
      className="psx-card psx-card-interactive psx-card-animate relative flex flex-col overflow-hidden p-4"
      style={{ "--psx-delay": `${Math.min(index, 8) * 40}ms` } as any}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="psx-icon-wrap psx-icon-wrap-sm" style={{ "--psx-accent": accent } as any}>
          <Bookmark className="h-4 w-4" />
        </div>
        {t.is_official && (
          <span className="official-badge rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Official
          </span>
        )}
      </div>
      <h3 className="mt-2.5 text-sm font-semibold text-foreground line-clamp-1">{t.name}</h3>
      {t.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
      )}
      {t.preview_text && (
        <p className="template-preview mt-2 rounded-md bg-muted/50 px-2.5 py-2 text-[11px] italic text-muted-foreground/80">
          {t.preview_text}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {t.platform && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagClass || "bg-accent text-muted-foreground border-transparent"}`}>
            {t.platform}
          </span>
        )}
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{t.tone}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-[11px] text-muted-foreground">{(t.use_count ?? 0).toLocaleString()} uses</span>
        <div className="flex items-center gap-1">
          {onPublishToggle && !t.is_official && (
            <button
              onClick={() => onPublishToggle(t)}
              title={t.is_public ? "Public — click to unpublish" : "Publish to marketplace"}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              {t.is_public ? <Globe className="h-3.5 w-3.5 text-[#7c3aed]" /> : <Lock className="h-3.5 w-3.5" />}
            </button>
          )}
          {onDelete && !t.is_official && (
            <button onClick={() => onDelete(t)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onUse(t)} className="psx-btn-primary ml-1 px-3 py-1.5 text-xs">
            Use
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"mine" | "official">("official");
  const [mine, setMine] = useState<Template[]>([]);
  const [officials, setOfficials] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("social");
  const [tone, setTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["tweets", "linkedin"]));

  const reload = async () => {
    setLoading(true);
    const [mineRes, offRes] = await Promise.all([
      session
        ? getTemplates({ headers: { Authorization: `Bearer ${session.access_token}` } } as any).catch(() => ({ templates: [] }))
        : Promise.resolve({ templates: [] }),
      listPublicTemplates({ data: { officialOnly: true, sort: "popular" } } as any).catch(() => ({ templates: [] })),
    ]);
    setMine(((mineRes as any).templates as Template[]) || []);
    setOfficials(((offRes as any).templates as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [session]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (showCreate) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreate]);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Please enter a template name");
    if (!description.trim()) return toast.error("Please add a short description");
    if (selectedTypes.size === 0) return toast.error("Select at least one format");
    if (customInstructions.trim().length < 20) return toast.error("Custom instructions should be at least 20 characters");
    setSaving(true);
    const result = await createTemplate({
      data: {
        name: name.trim(),
        tone,
        customInstructions: customInstructions.trim(),
        selectedTypes: Array.from(selectedTypes),
      },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    } as any);
    setSaving(false);
    if ((result as any).success) {
      toast.success("Template saved!");
      setShowCreate(false);
      setName("");
      setDescription("");
      setCategory("social");
      setTone("professional");
      setCustomInstructions("");
      setSelectedTypes(new Set(["tweets", "linkedin"]));
      setTab("mine");
      reload();
    } else {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (t: Template) => {
    await deleteTemplate({
      data: { id: t.id },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    } as any);
    setMine((prev) => prev.filter((x) => x.id !== t.id));
    toast.success("Template deleted");
  };

  const handleUse = async (t: Template) => {
    // If it's an official template, clone it into the user's account first (silent)
    if (t.is_official && session) {
      cloneTemplate({
        data: { sourceId: t.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      } as any).catch(() => {});
    }
    const params = new URLSearchParams({
      tone: t.tone,
      types: (t.selected_types as string[]).join(","),
    });
    if (t.custom_instructions) params.set("instructions", t.custom_instructions);
    navigate({ to: "/dashboard/repurpose", search: { tpl: params.toString() } as any });
    toast.success(`Template "${t.name}" applied!`);
  };

  const handlePublishToggle = async (t: Template) => {
    if (!session) return;
    const next = !t.is_public;
    let cat = t.category || "social";
    let desc = t.description || "";
    if (next) {
      const c = window.prompt("Category (social, newsletter, video, thread, launch, other):", cat);
      if (c === null) return;
      cat = c.trim() || "social";
      const d = window.prompt("Short description (max 280 chars):", desc);
      if (d === null) return;
      desc = (d || "").slice(0, 280);
    }
    const res: any = await togglePublishTemplate({
      data: { id: t.id, isPublic: next, category: cat, description: desc },
      headers: { Authorization: `Bearer ${session.access_token}` },
    } as any);
    if (res.success) {
      toast.success(next ? "Published to marketplace" : "Unpublished");
      reload();
    } else {
      toast.error(res.error || "Failed to update");
    }
  };

  const toggleType = (id: string) => {
    const next = new Set(selectedTypes);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedTypes(next);
  };

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const byTab = tab === "mine" ? mine : officials;
  const visible = categoryFilter === "all" ? byTab : byTab.filter((t) => (t.category || "other").toLowerCase() === categoryFilter);

  return (
    <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-6">
      {/* HERO */}
      <div className="psx-hero relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl px-6 py-6" data-page="templates">
        <HeroArt art="carousel" />
        <div>
          <div className="psx-hero-eyebrow">
            <Bookmark className="h-3 w-3" /> Templates
          </div>
          <h1 className="psx-hero-title mt-1.5">
            Your formats, <em>one click away</em>
          </h1>
          <p className="psx-hero-desc mt-1.5">Save your format & tone combos. One click to reuse.</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="count-badge official">{officials.length} Official</span>
            <span className="count-badge mine">{mine.length} Mine</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/templates/gallery"
            className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
          >
            <Store className="h-4 w-4" /> Marketplace
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="psx-btn-primary px-4 py-2"
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([
            ["official", "PostSpark Official", officials.length],
            ["mine", "My Templates", mine.length],
          ] as const).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`psx-filter-chip ${tab === id ? "psx-filter-chip-active" : ""}`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  tab === id ? "bg-white/25" : "bg-accent"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* CATEGORY FILTER CHIPS */}
        <div className="flex flex-wrap items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
          {filterCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`psx-filter-chip ${categoryFilter === c ? "psx-filter-chip-active" : ""}`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="psx-shimmer h-44 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        tab === "mine" ? (
          <div className="psx-empty">
            <Sparkles className="psx-empty-illustration mx-auto h-8 w-8" />
            <p className="mt-3 text-base font-semibold">No personal templates yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Browse PostSpark Official or build your own custom one.</p>
            <button onClick={() => setShowCreate(true)} className="psx-btn-primary mt-5 px-4 py-2">
              <Plus className="h-4 w-4" /> Create your first template
            </button>
          </div>
        ) : (
          <div className="psx-empty">
            <Bookmark className="psx-empty-illustration mx-auto h-8 w-8" />
            <p className="mt-3 text-base font-semibold">No templates in this category</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different filter.</p>
          </div>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t, i) => (
            <TemplateCard
              key={t.id}
              t={t}
              index={i}
              onUse={handleUse}
              onDelete={tab === "mine" ? handleDelete : undefined}
              onPublishToggle={tab === "mine" ? handlePublishToggle : undefined}
            />
          ))}
        </div>
      )}

      {/* CREATE MODAL — z-[100] so it sits above sidebar/topbar */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="relative z-[101] mx-auto my-auto w-full max-w-xl rounded-2xl bg-card p-6 shadow-2xl"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Create New Template</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Save a reusable format + tone + instructions combo.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-accent">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold">Template name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "My LinkedIn Authority Voice"'
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Description *</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this template do?"
                  maxLength={280}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Category *</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        category === c
                          ? "border-[#6B4EFF] bg-[rgba(107,78,255,0.1)] text-foreground"
                          : "border-border text-muted-foreground hover:border-[#6B4EFF]/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Tone *</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tones.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        tone === t
                          ? "border-[#6B4EFF] bg-[rgba(107,78,255,0.1)]"
                          : "border-border text-muted-foreground hover:border-[#6B4EFF]/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Output formats *</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {allTypes.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => toggleType(ct.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedTypes.has(ct.id)
                          ? "border-[#6B4EFF] bg-[rgba(107,78,255,0.1)]"
                          : "border-border text-muted-foreground hover:border-[#6B4EFF]/40"
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Custom Instructions * <span className="text-muted-foreground font-normal">(the template's brain)</span></label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={5}
                  placeholder='Tell the AI exactly how to write. Example: "Always open with a counterintuitive statement. Use short paragraphs (1-2 lines). Include a personal example. End with a question. Under 500 words."'
                  maxLength={1500}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]/40"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">💡 The more specific, the better your output.</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6B4EFF] to-[#8B6FFF] px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
