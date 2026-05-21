import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { isCurrentUserAdmin } from "@/lib/blogAdmin.functions";
import {
  adminListTestimonials,
  adminUpsertTestimonial,
  adminDeleteTestimonial,
} from "@/lib/testimonialsAdmin.functions";

export const Route = createFileRoute("/dashboard/testimonials-admin")({
  component: TestimonialsAdminPage,
});

type T = {
  id: string;
  name: string;
  handle: string | null;
  role: string | null;
  avatar_initials: string | null;
  avatar_url: string | null;
  quote: string;
  rating: number;
  is_published: boolean;
  sort_order: number;
};

const empty: Omit<T, "id"> = {
  name: "",
  handle: "",
  role: "",
  avatar_initials: "",
  avatar_url: "",
  quote: "",
  rating: 5,
  is_published: false,
  sort_order: 0,
};

function TestimonialsAdminPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [draft, setDraft] = useState<Partial<T>>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    (async () => {
      try {
        const r = await isCurrentUserAdmin({ headers: { Authorization: `Bearer ${session.access_token}` } });
        setIsAdmin(r.isAdmin);
        if (r.isAdmin) await load();
      } catch { setIsAdmin(false); }
      setChecking(false);
    })();
  }, [session, authLoading, navigate]);

  const load = async () => {
    const r = await adminListTestimonials();
    setItems((r.testimonials as T[]) ?? []);
  };

  const save = async () => {
    if (!draft.name || !draft.quote) {
      toast.error("Name and quote are required");
      return;
    }
    setSaving(true);
    try {
      await adminUpsertTestimonial({
        data: {
          id: draft.id,
          name: draft.name!,
          handle: draft.handle || null,
          role: draft.role || null,
          avatar_initials: draft.avatar_initials || null,
          avatar_url: draft.avatar_url || null,
          quote: draft.quote!,
          rating: draft.rating ?? 5,
          is_published: !!draft.is_published,
          sort_order: draft.sort_order ?? 0,
        },
      });
      toast.success("Saved");
      setDraft(empty);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await adminDeleteTestimonial({ data: { id } });
    toast.success("Deleted");
    await load();
  };

  if (checking) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need the admin role to manage testimonials.</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Back</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-2">
      <div>
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="text-sm text-muted-foreground">Manage social proof shown on the landing page.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Plus className="h-4 w-4" />{draft.id ? "Edit testimonial" : "New testimonial"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded border border-border bg-background px-3 py-2 text-sm" placeholder="Name *" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="rounded border border-border bg-background px-3 py-2 text-sm" placeholder="@handle" value={draft.handle ?? ""} onChange={(e) => setDraft({ ...draft, handle: e.target.value })} />
          <input className="rounded border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Role / company (e.g. Newsletter creator · 18k subs)" value={draft.role ?? ""} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
          <input className="rounded border border-border bg-background px-3 py-2 text-sm" placeholder="Initials (SC)" maxLength={4} value={draft.avatar_initials ?? ""} onChange={(e) => setDraft({ ...draft, avatar_initials: e.target.value })} />
          <input className="rounded border border-border bg-background px-3 py-2 text-sm" placeholder="Avatar URL (optional)" value={draft.avatar_url ?? ""} onChange={(e) => setDraft({ ...draft, avatar_url: e.target.value })} />
        </div>
        <textarea className="w-full rounded border border-border bg-background px-3 py-2 text-sm" rows={4} placeholder="Quote *" value={draft.quote ?? ""} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">Rating
            <input type="number" min={1} max={5} className="w-16 rounded border border-border bg-background px-2 py-1" value={draft.rating ?? 5} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} />
          </label>
          <label className="flex items-center gap-2">Sort
            <input type="number" className="w-20 rounded border border-border bg-background px-2 py-1" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!draft.is_published} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} /> Published
          </label>
          <div className="ml-auto flex gap-2">
            {draft.id && <button onClick={() => setDraft(empty)} className="rounded border border-border px-3 py-1.5 text-sm">Cancel</button>}
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded gradient-electric px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {draft.id ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No testimonials yet.</p>}
        {items.map((t) => (
          <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{t.name}</span>
                {t.handle && <span className="text-xs text-primary">{t.handle}</span>}
                {t.is_published ? <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-700">Published</span> : <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Draft</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.role}</p>
              <p className="mt-2 text-sm">"{t.quote}"</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setDraft(t)} className="rounded border border-border px-3 py-1 text-xs">Edit</button>
              <button onClick={() => remove(t.id)} className="inline-flex items-center gap-1 rounded border border-destructive/30 px-3 py-1 text-xs text-destructive"><Trash2 className="h-3 w-3" />Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
