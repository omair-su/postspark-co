import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Loader2,
  Upload,
  Sparkles,
  Download,
  Clock,
  Info,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Music2,
  Youtube,
  FileText,
  Mail,
  AtSign,
} from "lucide-react";
import {
  listScheduledPosts,
  createScheduledPost,
  deleteScheduledPost,
  updateScheduledPost,
  bulkImportScheduledPosts,
  generateAIPlan,
} from "@/lib/calendar.functions";
import { cancelScheduledXPost, retryScheduledXPost } from "@/lib/socialPublish.functions";
import { useServerFn } from "@tanstack/react-start";
import { withAIProgress } from "@/lib/aiProgress";
import { AlertTriangle, RotateCcw, Ban, CheckCircle2 } from "lucide-react";

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
  publish_error?: string | null;
  platform_post_id?: string | null;
}

type PlatformId =
  | "twitter"
  | "threads"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "blog"
  | "email";

const PLATFORMS: {
  id: PlatformId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pill: string; // tailwind classes for pill bg/text/border
  dot: string; // solid color dot (bg)
  charLimit?: number;
}[] = [
  { id: "twitter", label: "X/Twitter", icon: Twitter, pill: "bg-sky-50 text-sky-700 border-l-[3px] border-sky-500", dot: "bg-sky-500", charLimit: 280 },
  { id: "threads", label: "Threads", icon: AtSign, pill: "bg-slate-100 text-slate-900 border-l-[3px] border-slate-900", dot: "bg-slate-900", charLimit: 500 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, pill: "bg-blue-50 text-blue-700 border-l-[3px] border-blue-600", dot: "bg-blue-600", charLimit: 3000 },
  { id: "instagram", label: "Instagram", icon: Instagram, pill: "bg-pink-50 text-pink-700 border-l-[3px] border-pink-500", dot: "bg-pink-500", charLimit: 2200 },
  { id: "facebook", label: "Facebook", icon: Facebook, pill: "bg-indigo-50 text-indigo-700 border-l-[3px] border-indigo-500", dot: "bg-indigo-500", charLimit: 63206 },
  { id: "tiktok", label: "TikTok", icon: Music2, pill: "bg-neutral-100 text-neutral-900 border-l-[3px] border-neutral-900", dot: "bg-neutral-900", charLimit: 2200 },
  { id: "youtube", label: "YouTube", icon: Youtube, pill: "bg-red-50 text-red-700 border-l-[3px] border-red-600", dot: "bg-red-600", charLimit: 5000 },
  { id: "blog", label: "Blog", icon: FileText, pill: "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-600", dot: "bg-emerald-600" },
  { id: "email", label: "Email", icon: Mail, pill: "bg-amber-50 text-amber-700 border-l-[3px] border-amber-500", dot: "bg-amber-500" },
];

const platformMeta = (p: string) => PLATFORMS.find((x) => x.id === p) || PLATFORMS[0];

const BEST_TIMES: Record<PlatformId, { time: string; days: string; tip: string }> = {
  twitter: { time: "12–3 PM, 5–6 PM", days: "Mon–Thu", tip: "Lunch breaks and end of day" },
  threads: { time: "9–11 AM, 6–8 PM", days: "Mon–Fri", tip: "Morning scroll and evening wind-down" },
  linkedin: { time: "8–10 AM, 5–6 PM", days: "Tue–Thu", tip: "Before and after work hours" },
  instagram: { time: "11 AM–1 PM, 7–9 PM", days: "Mon, Wed, Thu", tip: "Lunch break and evenings" },
  facebook: { time: "1–4 PM", days: "Wed", tip: "Mid-week afternoon peak" },
  tiktok: { time: "6–10 AM, 7–9 PM", days: "Tue, Thu, Fri", tip: "Morning commute and evenings" },
  youtube: { time: "2–4 PM", days: "Thu, Fri, Sat", tip: "Weekend prime viewing window" },
  blog: { time: "9–11 AM", days: "Tue, Wed", tip: "Mid-morning reading window" },
  email: { time: "10 AM, 2 PM", days: "Tue, Thu", tip: "Post-inbox-cleanup peaks" },
};

function CalendarPage() {
  const { session } = useAuth();
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(new Date()));
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "published" | "failed">("all");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekCursor);
      d.setDate(weekCursor.getDate() + i);
      return d;
    });
  }, [weekCursor]);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const from =
      view === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toISOString()
        : new Date(weekCursor.getFullYear(), weekCursor.getMonth(), weekCursor.getDate() - 7).toISOString();
    const to =
      view === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0, 23, 59, 59).toISOString()
        : new Date(weekCursor.getFullYear(), weekCursor.getMonth(), weekCursor.getDate() + 14, 23, 59, 59).toISOString();
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
  }, [cursor, weekCursor, view, session]);

  const filteredPosts = useMemo(() => {
    if (statusFilter === "all") return posts;
    if (statusFilter === "failed") return posts.filter((p) => !!(p as any).publish_error);
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  const failedCount = useMemo(() => posts.filter((p) => !!(p as any).publish_error).length, [posts]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of filteredPosts) {
      const d = new Date(p.scheduled_for);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [filteredPosts]);

  const openNew = (date: Date, hour = 9) => {
    setEditing(null);
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
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

  const downloadCsvTemplate = () => {
    const csv =
      "date,platform,title,content\n" +
      "2026-06-15T09:00:00,twitter,Launch teaser,Big launch coming Friday. Stay tuned.\n" +
      "2026-06-16T10:00:00,linkedin,Founder lesson,The one thing I wish I knew before raising.\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "postspark-calendar-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date();
  const counts = {
    all: posts.length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: failedCount,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-electric shadow-glow">
              <CalendarIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Calendar
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
              <p className="text-sm text-muted-foreground">
                Plan, schedule, and visualize your posts across platforms.{" "}
                <span className="text-[11px] opacity-70">Times: {tz}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadCsvTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              title="Download CSV template"
            >
              <Download className="h-3.5 w-3.5" /> CSV template
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">
              <Upload className="h-3.5 w-3.5" /> Bulk import
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file || !session) return;
                  const text = await file.text();
                  const lines = text.split(/\r?\n/).filter(Boolean);
                  if (lines.length < 2) {
                    toast.error("CSV is empty");
                    return;
                  }
                  const header = lines[0].toLowerCase().split(",").map((s) => s.trim());
                  const idx = (k: string) => header.indexOf(k);
                  const di = idx("date"),
                    pi = idx("platform"),
                    ci = idx("content"),
                    ti = idx("title");
                  if (di < 0 || pi < 0 || ci < 0) {
                    toast.error("CSV needs columns: date, platform, content (optional: title)");
                    return;
                  }
                  const allowed = new Set([
                    "twitter",
                    "threads",
                    "linkedin",
                    "instagram",
                    "facebook",
                    "tiktok",
                    "youtube",
                    "blog",
                    "email",
                  ]);
                  const parsed: any[] = [];
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",");
                    const platform = (cols[pi] || "").trim().toLowerCase();
                    const dateStr = (cols[di] || "").trim();
                    const content = (cols[ci] || "").trim();
                    if (!allowed.has(platform) || !content) continue;
                    const dt = new Date(dateStr);
                    if (isNaN(dt.getTime())) continue;
                    parsed.push({
                      title: ti >= 0 ? (cols[ti] || "").trim() || content.slice(0, 40) : content.slice(0, 40),
                      content,
                      platform,
                      scheduled_for: dt.toISOString(),
                    });
                  }
                  if (parsed.length === 0) {
                    toast.error("No valid rows found");
                    return;
                  }
                  const res: any = await bulkImportScheduledPosts({
                    data: { posts: parsed },
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  });
                  if (!res.success) {
                    if (res.error === "AGENCY_REQUIRED") toast.error("Bulk CSV import is an Agency-plan feature.");
                    else toast.error(res.error || "Import failed");
                    return;
                  }
                  toast.success(`Imported ${res.inserted} posts`);
                  load();
                }}
              />
            </label>
            <button
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI 30-day plan
            </button>
            <button
              onClick={() => openNew(new Date())}
              className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Schedule post
            </button>
          </div>
        </div>

        {/* View toggle + status chips */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  view === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "month" ? "Monthly" : "Weekly"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "scheduled", "published", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s} <span className="ml-1 opacity-60">({counts[s]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Publishing note */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-300/40 bg-sky-50/60 px-3 py-2 text-[12px] text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Auto-publishing:</strong> X (Twitter) posts publish automatically at their scheduled time via our cron worker (runs every minute). LinkedIn, Instagram &amp; TikTok scheduling coming soon — for now, copy the content and post manually.
        </span>
      </div>


      {/* Calendar view */}
      {view === "month" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold tracking-tight">{monthLabel}</h2>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-muted/20">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map(({ date, inMonth }, i) => {
              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayPosts = postsByDay.get(key) || [];
              const isToday =
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();
              return (
                <div
                  key={i}
                  onClick={() => openNew(date)}
                  className={`group relative min-h-[100px] cursor-pointer border-b border-r border-border/60 p-2 transition-colors hover:bg-primary/[0.03] ${
                    isToday ? "bg-primary/[0.04]" : ""
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center text-xs font-medium ${
                        isToday
                          ? "rounded-full bg-primary text-primary-foreground"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((p) => {
                      const meta = platformMeta(p.platform);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
                          }}
                          className={`flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[10px] font-medium ${meta.pill}`}
                          title={p.title}
                        >
                          <Icon className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{p.title}</span>
                        </div>
                      );
                    })}
                    {dayPosts.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">+{dayPosts.length - 3} more</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openNew(date);
                    }}
                    className="absolute bottom-1.5 right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow group-hover:flex"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center border-t border-border py-2 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading…
            </div>
          )}
        </div>
      ) : (
        <WeeklyView
          weekDays={weekDays}
          postsByDay={postsByDay}
          onPrev={() => {
            const d = new Date(weekCursor);
            d.setDate(d.getDate() - 7);
            setWeekCursor(d);
          }}
          onNext={() => {
            const d = new Date(weekCursor);
            d.setDate(d.getDate() + 7);
            setWeekCursor(d);
          }}
          onCellClick={(date, hour) => openNew(date, hour)}
          onPostClick={openEdit}
          loading={loading}
        />
      )}

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

      {showPlanModal && (
        <AIPlanModal
          onClose={() => setShowPlanModal(false)}
          onDone={() => {
            setShowPlanModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function WeeklyView({
  weekDays,
  postsByDay,
  onPrev,
  onNext,
  onCellClick,
  onPostClick,
  loading,
}: {
  weekDays: Date[];
  postsByDay: Map<string, Post[]>;
  onPrev: () => void;
  onNext: () => void;
  onCellClick: (date: Date, hour: number) => void;
  onPostClick: (p: Post) => void;
  loading: boolean;
}) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm
  const today = new Date();
  const first = weekDays[0];
  const last = weekDays[6];
  const label = `Week of ${first.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${last.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const postsByDayHour = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const d of weekDays) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const dayPosts = postsByDay.get(key) || [];
      for (const p of dayPosts) {
        const dt = new Date(p.scheduled_for);
        const k = `${key}-${dt.getHours()}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(p);
      }
    }
    return map;
  }, [weekDays, postsByDay]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
        <button
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold tracking-tight">{label}</h2>
        <button
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        <div className="border-b border-r border-border bg-muted/20" />
        {weekDays.map((d) => {
          const isToday =
            d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
          return (
            <div
              key={d.toISOString()}
              className={`border-b border-r border-border bg-muted/20 px-2 py-2 text-center ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</div>
            </div>
          );
        })}

        {hours.map((h) => (
          <React.Fragment key={`row-${h}`}>
            <div className="flex h-14 items-start justify-end border-b border-r border-border/60 bg-muted/10 px-2 py-1 text-[10px] text-muted-foreground">
              {((h % 12) || 12) + (h < 12 ? " AM" : " PM")}
            </div>
            {weekDays.map((d) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${h}`;
              const slotPosts = postsByDayHour.get(key) || [];
              return (
                <div
                  key={`${d.toISOString()}-${h}`}
                  onClick={() => onCellClick(d, h)}
                  className="h-14 cursor-pointer border-b border-r border-border/60 p-0.5 transition-colors hover:bg-primary/[0.03]"
                >
                  {slotPosts.map((p) => {
                    const meta = platformMeta(p.platform);
                    const Icon = meta.icon;
                    return (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostClick(p);
                        }}
                        className={`mb-0.5 flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium ${meta.pill}`}
                        title={p.title}
                      >
                        <Icon className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{p.title}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center border-t border-border py-2 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading…
        </div>
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
  const [platform, setPlatform] = useState<PlatformId>((editing?.platform as PlatformId) || "twitter");
  const [when, setWhen] = useState(defaultDate);
  const [repeat, setRepeat] = useState<"once" | "daily" | "weekly" | "biweekly">("once");
  const [repeatCount, setRepeatCount] = useState(4);
  const [saving, setSaving] = useState(false);

  const meta = platformMeta(platform);
  const limit = meta.charLimit;
  const over = limit ? content.length > limit : false;
  const best = BEST_TIMES[platform];

  const save = async () => {
    if (!session) return toast.error("Please sign in");
    if (!title.trim() || !content.trim()) return toast.error("Title and content are required");
    setSaving(true);
    try {
      const baseIso = new Date(when);
      if (editing) {
        const res = await updateScheduledPost({
          data: { id: editing.id, title, content, platform: platform as any, scheduled_for: baseIso.toISOString() },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.success) {
          toast.success("Updated");
          onSaved();
        } else toast.error("Failed to update");
      } else {
        const occurrences: Date[] = [new Date(baseIso)];
        if (repeat !== "once") {
          const stepDays = repeat === "daily" ? 1 : repeat === "weekly" ? 7 : 14;
          for (let i = 1; i < repeatCount; i++) {
            const next = new Date(baseIso);
            next.setDate(next.getDate() + stepDays * i);
            occurrences.push(next);
          }
        }
        let ok = 0;
        for (const d of occurrences) {
          const res = await createScheduledPost({
            data: { title, content, platform: platform as any, scheduled_for: d.toISOString() },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.success) ok++;
        }
        if (ok > 0) {
          toast.success(ok === 1 ? "Scheduled" : `Scheduled ${ok} posts`);
          onSaved();
        } else toast.error("Failed to schedule");
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
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {editing ? "Edit scheduled post" : "Schedule a post"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Title <span className="text-muted-foreground font-normal">(internal reference)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder='e.g. "LinkedIn launch post — Mon June 13"'
            />
          </div>

          {/* Platform chips */}
          <div>
            <label className="mb-2 block text-xs font-semibold">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const on = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      on
                        ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                    <Icon className="h-3 w-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold">Content</label>
              {limit && (
                <span className={`text-[11px] ${over ? "text-destructive" : "text-muted-foreground"}`}>
                  {content.length} / {limit} chars [{meta.label}]
                </span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none ${
                over ? "border-destructive focus:border-destructive" : "border-input focus:border-primary"
              }`}
              placeholder="Paste your post copy here…"
            />
            {/* Live mini preview */}
            {content.trim() && (
              <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <meta.icon className="h-3 w-3" /> Preview · {meta.label}
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{content}</p>
              </div>
            )}
          </div>

          {/* When */}
          <div>
            <label className="mb-1 block text-xs font-semibold">Schedule date &amp; time</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-[11px]">
              <Clock className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span className="text-foreground">
                <strong>Best time for {meta.label}:</strong> {best.time} · {best.days} —{" "}
                <span className="text-muted-foreground">{best.tip}</span>
              </span>
            </div>
          </div>

          {/* Repeat */}
          {!editing && (
            <div>
              <label className="mb-2 block text-xs font-semibold">Repeat</label>
              <div className="flex flex-wrap gap-2">
                {([
                  ["once", "Once"],
                  ["daily", "Daily"],
                  ["weekly", "Weekly"],
                  ["biweekly", "Every 2 weeks"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRepeat(id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      repeat === id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {repeat !== "once" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>How many occurrences?</span>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Math.max(2, Math.min(20, Number(e.target.value) || 2)))}
                    className="w-16 rounded-md border border-input bg-background px-2 py-1 text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {editing && editing.platform === "twitter" && (editing.status === "failed" || editing.status === "scheduled") && (
          <XPostActions post={editing} onDone={onSaved} />
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          {editing ? (
            <button
              onClick={() => onDelete(editing.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <CalendarIcon className="h-4 w-4" />
              {editing ? "Update" : "Schedule Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function XPostActions({ post, onDone }: { post: Post; onDone: () => void }) {
  const { session } = useAuth();
  const [busy, setBusy] = useState<"cancel" | "retry" | null>(null);
  const doCancel = useServerFn(cancelScheduledXPost);
  const doRetry = useServerFn(retryScheduledXPost);

  const cancel = async () => {
    if (!session) return;
    setBusy("cancel");
    try {
      const r: any = await doCancel({ data: { id: post.id } });
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Cancelled");
        onDone();
      }
    } finally {
      setBusy(null);
    }
  };

  const retry = async () => {
    if (!session) return;
    setBusy("retry");
    try {
      const r: any = await doRetry({ data: { id: post.id } });
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Requeued");
        onDone();
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
      {post.status === "failed" ? (
        <div className="flex items-start gap-2 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1">
            <div className="font-semibold text-destructive">X publish failed</div>
            {post.publish_error && (
              <p className="mt-0.5 text-muted-foreground">{post.publish_error}</p>
            )}
          </div>
          <button
            onClick={retry}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-60"
          >
            {busy === "retry" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Retry
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          <div className="flex-1">
            <div className="font-semibold">Queued for auto-publish</div>
            <p className="mt-0.5 text-muted-foreground">Cancel to stop the cron worker from posting this.</p>
          </div>
          <button
            onClick={cancel}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
          >
            {busy === "cancel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const VARIETY_OPTIONS = [
  "Educational",
  "Personal story",
  "Product/Brand",
  "Curated insight",
  "Promotional",
  "Engagement question",
];

function AIPlanModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { session } = useAuth();
  const [niche, setNiche] = useState("");
  const [pillars, setPillars] = useState("");
  const [cadence, setCadence] = useState<"daily" | "3x" | "weekly">("3x");
  const [days, setDays] = useState<number>(30);
  const [selected, setSelected] = useState<PlatformId[]>(["twitter", "linkedin"]);
  const [variety, setVariety] = useState<string[]>(["Educational", "Personal story", "Product/Brand", "Engagement question"]);
  const [loading, setLoading] = useState(false);

  const togglePlatform = (id: PlatformId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id],
    );
  };
  const toggleVariety = (v: string) => {
    setVariety((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const expectedPosts =
    cadence === "daily" ? days : cadence === "3x" ? Math.ceil((days * 3) / 7) : Math.ceil(days / 7);

  const generate = async () => {
    if (!session) return toast.error("Please sign in");
    if (niche.trim().length < 3) return toast.error("Add a niche or topic");
    if (selected.length === 0) return toast.error("Pick at least one platform");
    setLoading(true);
    try {
      const enrichedNiche = [
        niche.trim(),
        pillars.trim() ? `Content pillars: ${pillars.trim()}.` : "",
        variety.length ? `Mix these content types: ${variety.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const res: any = await withAIProgress(
        generateAIPlan({
          data: { niche: enrichedNiche, platforms: selected as any, cadence, days },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      );
      if (!res.success) {
        if (res.error === "LIMIT_REACHED") toast.error("Free monthly limit reached. Upgrade to keep planning.");
        else toast.error(res.error || "Plan generation failed");
        return;
      }
      toast.success(`Created ${res.inserted} drafts on your calendar`);
      onDone();
    } catch (e) {
      console.error(e);
      toast.error("Plan generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> AI {days}-day content planner
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">Your niche / content focus</label>
            <textarea
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              rows={2}
              placeholder='e.g. "B2B SaaS founders building AI tools"'
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Content pillars <span className="font-normal text-muted-foreground">(what topics do you post about?)</span>
            </label>
            <textarea
              value={pillars}
              onChange={(e) => setPillars(e.target.value)}
              rows={2}
              placeholder='e.g. "Founder lessons, product updates, marketing tips, behind the scenes"'
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold">Platforms (max 5)</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      on
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                    <Icon className="h-3 w-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Posting frequency</label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as any)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="daily">1× per day</option>
                <option value="3x">3× per week</option>
                <option value="weekly">1× per week</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Duration</label>
              <div className="flex gap-1">
                {[7, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(Math.min(d, 30))}
                    disabled={d > 30}
                    className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                      days === d
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
                    }`}
                    title={d > 30 ? "Coming soon — max 30 days today" : ""}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold">
              Content variety <span className="font-normal text-muted-foreground">(mix of content types)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {VARIETY_OPTIONS.map((v) => {
                const on = variety.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVariety(v)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[12px] text-foreground">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div>
                <strong>~{expectedPosts} posts</strong> will be added to your calendar as drafts.
                Edit, reschedule, or delete any of them. Starting tomorrow at 9 AM local time.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Planning…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate {days}-day plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
