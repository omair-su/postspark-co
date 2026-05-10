import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Trash2, Calendar, FileText, Eye, ArrowLeft, Save } from "lucide-react";
import {
  isCurrentUserAdmin,
  adminListPosts,
  adminListMeta,
  adminGetPost,
  adminUpsertPost,
  adminDeletePost,
} from "@/lib/blogAdmin.functions";
import { generateBlog } from "@/lib/seoBlog.functions";
import { withAIProgress } from "@/lib/aiProgress";

export const Route = createFileRoute("/dashboard/blog-admin")({
  component: BlogAdminPage,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
  category?: { name: string } | null;
};

type Meta = { categories: { id: string; name: string; slug: string }[]; authors: { id: string; name: string; slug: string }[] };

function BlogAdminPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<Meta>({ categories: [], authors: [] });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    (async () => {
      try {
        const r = await isCurrentUserAdmin({ headers: { Authorization: `Bearer ${session.access_token}` } });
        setIsAdmin(r.isAdmin);
      } catch { setIsAdmin(false); }
      setChecking(false);
    })();
  }, [session, authLoading, navigate]);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        adminListPosts({ headers: { Authorization: `Bearer ${session.access_token}` } }),
        adminListMeta({ headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);
      setPosts(p as Post[]);
      setMeta(m as Meta);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin && session) load(); /* eslint-disable-next-line */ }, [isAdmin, session]);

  if (checking || authLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Admin only</h1>
        <p className="mt-2 text-muted-foreground">This area is restricted to PostSpark admins.</p>
        <Link to="/dashboard" className="mt-6 inline-block text-sm text-primary hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  if (editing || showNew) {
    return (
      <PostEditor
        postId={editing}
        meta={meta}
        accessToken={session!.access_token}
        onClose={() => { setEditing(null); setShowNew(false); load(); }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog admin</h1>
          <p className="text-sm text-muted-foreground">Create, schedule and publish PostSpark blog posts.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New post
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 opacity-60" />
          <p className="mt-3">No posts yet. Click <b>New post</b> to write your first one.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/blog/{p.slug}{p.category ? ` · ${p.category.name}` : ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={
                      p.status === "published" ? "rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600" :
                      p.status === "scheduled" ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600" :
                      "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.status === "scheduled" && p.scheduled_at
                      ? `→ ${new Date(p.scheduled_at).toLocaleString()}`
                      : p.published_at
                      ? new Date(p.published_at).toLocaleDateString()
                      : new Date(p.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "published" && (
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="View live">
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <button onClick={() => setEditing(p.id)} className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10">Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${p.title}"?`)) return;
                          await adminDeletePost({ data: { id: p.id }, headers: { Authorization: `Bearer ${session!.access_token}` } });
                          toast.success("Deleted");
                          load();
                        }}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PostEditor({
  postId,
  meta,
  accessToken,
  onClose,
}: {
  postId: string | null;
  meta: Meta;
  accessToken: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeyword, setAiKeyword] = useState("");

  const [form, setForm] = useState({
    id: postId || undefined,
    title: "",
    slug: "",
    excerpt: "",
    content_md: "",
    cover_image_url: "",
    author_id: meta.authors[0]?.id || "",
    category_id: meta.categories[0]?.id || "",
    meta_title: "",
    meta_description: "",
    status: "draft" as "draft" | "scheduled" | "published",
    scheduled_at: "",
  });

  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        const p = await adminGetPost({ data: { id: postId }, headers: { Authorization: `Bearer ${accessToken}` } });
        if (p) {
          setForm({
            id: p.id,
            title: p.title || "",
            slug: p.slug || "",
            excerpt: p.excerpt || "",
            content_md: p.content_md || "",
            cover_image_url: p.cover_image_url || "",
            author_id: p.author_id || "",
            category_id: p.category_id || "",
            meta_title: p.meta_title || "",
            meta_description: p.meta_description || "",
            status: (p.status as any) || "draft",
            scheduled_at: p.scheduled_at ? new Date(p.scheduled_at).toISOString().slice(0, 16) : "",
          });
        }
      } catch (e: any) { toast.error(e.message); }
      setLoading(false);
    })();
  }, [postId, accessToken]);

  const generateWithAI = async () => {
    if (aiTopic.length < 3 || aiKeyword.length < 2) return toast.error("Add topic + keyword");
    setGenerating(true);
    try {
      const res = await withAIProgress(generateBlog({
        data: { topic: aiTopic, keyword: aiKeyword, wordTarget: 1200, language: "English" },
        headers: { Authorization: `Bearer ${accessToken}` },
      }));
      if ((res as any).error) { toast.error((res as any).error); return; }
      const faq = (res.faq || []).map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n");
      setForm((f) => ({
        ...f,
        title: res.title || f.title,
        slug: res.slug || f.slug,
        excerpt: res.metaDescription?.slice(0, 200) || f.excerpt,
        meta_title: res.title || f.meta_title,
        meta_description: res.metaDescription || f.meta_description,
        content_md: res.markdown + (faq ? `\n\n## FAQ\n\n${faq}` : ""),
      }));
      toast.success("AI draft inserted — review and edit before saving");
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    setGenerating(false);
  };

  const save = async (status: "draft" | "scheduled" | "published") => {
    if (form.title.length < 3) return toast.error("Title is too short");
    if (form.excerpt.length < 10) return toast.error("Excerpt is too short");
    if (form.content_md.length < 50) return toast.error("Content is too short");
    if (status === "scheduled" && !form.scheduled_at) return toast.error("Pick a schedule time");
    setSaving(true);
    try {
      await adminUpsertPost({
        data: {
          id: form.id,
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt,
          content_md: form.content_md,
          cover_image_url: form.cover_image_url || null,
          author_id: form.author_id || null,
          category_id: form.category_id || null,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          status,
          scheduled_at: status === "scheduled" ? new Date(form.scheduled_at).toISOString() : null,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success(status === "published" ? "Published!" : status === "scheduled" ? "Scheduled" : "Saved as draft");
      onClose();
    } catch (e: any) { toast.error(e.message || "Save failed"); }
    setSaving(false);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <button onClick={onClose} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to posts
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* AI assist */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Generate with AI
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Topic (e.g. how to repurpose LinkedIn posts)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <input value={aiKeyword} onChange={(e) => setAiKeyword(e.target.value)} placeholder="Target keyword" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <button disabled={generating} onClick={generateWithAI} className="mt-3 flex items-center gap-2 rounded-lg gradient-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Draft post
            </button>
          </div>

          <Field label="Title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Slug (optional — auto from title)">
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="my-post-slug" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Excerpt">
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Content (Markdown)">
            <textarea value={form.content_md} onChange={(e) => setForm({ ...form, content_md: e.target.value })} rows={20} className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed" />
            <div className="mt-1 text-xs text-muted-foreground">{form.content_md.split(/\s+/).filter(Boolean).length} words</div>
          </Field>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Publish</h3>
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
              {form.status === "scheduled" && (
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button disabled={saving} onClick={() => save("draft")} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
                <Save className="h-4 w-4" /> Save draft
              </button>
              {form.status === "scheduled" && (
                <button disabled={saving} onClick={() => save("scheduled")} className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  <Calendar className="h-4 w-4" /> Schedule
                </button>
              )}
              <button disabled={saving} onClick={() => save("published")} className="flex items-center justify-center gap-2 rounded-lg gradient-electric px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish now
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Metadata</h3>
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">— None —</option>
                {meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Author">
              <select value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">— None —</option>
                {meta.authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Cover image URL">
              <input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://…" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="SEO title">
              <input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} maxLength={80} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="SEO description">
              <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} maxLength={180} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
