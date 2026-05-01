import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Trash2, X, Loader2 } from "lucide-react";
import {
  listScheduledPosts,
  createScheduledPost,
  deleteScheduledPost,
  updateScheduledPost,
} from "@/server/calendar.functions";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

interface Post {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_for: string;
  status: string;
}

const PLATFORMS = [
  { id: "twitter", label: "Twitter/X", color: "bg-sky-500" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", color: "bg-pink-500" },
  { id: "facebook", label: "Facebook", color: "bg-blue-500" },
  { id: "tiktok", label: "TikTok", color: "bg-black" },
  { id: "youtube", label: "YouTube", color: "bg-red-600" },
  { id: "blog", label: "Blog", color: "bg-emerald-600" },
  { id: "email", label: "Email", color: "bg-amber-500" },
] as const;

const platformColor = (p: string) => PLATFORMS.find((x) => x.id === p)?.color || "bg-muted";
const platformLabel = (p: string) => PLATFORMS.find((x) => x.id === p)?.label || p;

function CalendarPage() {
  const { session } = useAuth();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startWeekday = first.getDay();
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() - (startWeekday - i));
      cells.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const next = new Date(cells[cells.length - 1].date);
      next.setDate(next.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [cursor]);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const from = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toISOString();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0, 23, 59, 59).toISOString();
    try {
      const res = await listScheduledPosts({
        data: { from, to },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setPosts(res.posts as Post[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, session]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const d = new Date(p.scheduled_for);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [posts]);

  const openNew = (date: Date) => {
    setEditing(null);
    const d = new Date(date);
    d.setHours(9, 0, 0, 0);
    setDefaultDate(toLocalInput(d));
    setShowModal(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setDefaultDate(toLocalInput(new Date(p.scheduled_for)));
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!session) return;
    if (!confirm("Delete this scheduled post?")) return;
    const res = await deleteScheduledPost({
      data: { id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.success) {
      toast.success("Deleted");
      setShowModal(false);
      load();
    } else {
      toast.error("Failed to delete");
    }
  };

  const today = new Date();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
            <CalendarIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
            <p className="text-sm text-muted-foreground">Plan, schedule, and visualize your posts across platforms.</p>
          </div>
        </div>
        <button
          onClick={() => openNew(new Date())}
          className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Schedule post
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-lg border border-input p-2 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-lg border border-input p-2 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, inMonth }, i) => {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayPosts = postsByDay.get(key) || [];
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();
            return (
              <button
                key={i}
                onClick={() => openNew(date)}
                className={`min-h-[88px] rounded-lg border p-1.5 text-left transition-colors ${
                  inMonth ? "border-border bg-background hover:border-primary/40" : "border-transparent bg-muted/30 text-muted-foreground"
                } ${isToday ? "ring-2 ring-primary" : ""}`}
              >
                <div className="mb-1 text-xs font-semibold">{date.getDate()}</div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(p);
                      }}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${platformColor(p.platform)}`}
                      title={p.title}
                    >
                      {p.title}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="mt-3 flex items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading…
          </div>
        )}
      </div>

      {showModal && (
        <PostModal
          editing={editing}
          defaultDate={defaultDate}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PostModal({
  editing,
  defaultDate,
  onClose,
  onSaved,
  onDelete,
}: {
  editing: Post | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (id: string) => void;
}) {
  const { session } = useAuth();
  const [title, setTitle] = useState(editing?.title || "");
  const [content, setContent] = useState(editing?.content || "");
  const [platform, setPlatform] = useState(editing?.platform || "twitter");
  const [when, setWhen] = useState(defaultDate);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session) return toast.error("Please sign in");
    if (!title.trim() || !content.trim()) return toast.error("Title and content are required");
    setSaving(true);
    try {
      const iso = new Date(when).toISOString();
      if (editing) {
        const res = await updateScheduledPost({
          data: { id: editing.id, title, content, platform: platform as any, scheduled_for: iso },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.success) {
          toast.success("Updated");
          onSaved();
        } else toast.error("Failed to update");
      } else {
        const res = await createScheduledPost({
          data: { title, content, platform: platform as any, scheduled_for: iso },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.success) {
          toast.success("Scheduled");
          onSaved();
        } else toast.error(res.error || "Failed to schedule");
      }
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{editing ? "Edit scheduled post" : "Schedule a post"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. Launch announcement"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Paste your post copy here…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">When</label>
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {editing ? (
            <button
              onClick={() => onDelete(editing.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
