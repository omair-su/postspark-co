import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listFacebookPages, publishToFacebook, listPublishingLogs } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import {
  Facebook,
  Image as ImageIcon,
  Link2,
  Calendar,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/publish/facebook")({
  head: () => ({
    meta: [
      { title: "Publish to Facebook — PostSpark" },
      {
        name: "description",
        content: "Compose, preview, and publish Facebook Page posts — schedule or ship live.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublishFacebook,
});

const MAX = 63206;

type Page = {
  id: string;
  page_id: string;
  page_name: string | null;
  page_picture_url: string | null;
  is_default: boolean | null;
};

function PublishFacebook() {
  const { session } = useAuth();
  const authHeaders = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : ({} as any);

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<"idle" | "scheduled" | "published" | "failed">("idle");
  const [apiLog, setApiLog] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;
    listFacebookPages(authHeaders).then((r: any) => {
      const list = r?.pages || [];
      setPages(list);
      const def = list.find((p: Page) => p.is_default) || list[0];
      if (def) setSelectedPageId(def.id);
    });
    listPublishingLogs({ ...authHeaders, data: { limit: 20 } }).then((r: any) =>
      setRecent((r?.logs || []).filter((l: any) => l.platform === "facebook")),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId), [pages, selectedPageId]);
  const overLimit = message.length > MAX;
  const canPublish = message.trim().length > 0 && !overLimit && !publishing && !!selectedPage;
  const scheduled = Boolean(scheduledFor);

  const handleSubmit = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setStatus("idle");
    setApiLog(null);
    try {
      const r: any = await publishToFacebook({
        ...authHeaders,
        data: {
          pageRowId: selectedPageId,
          message: message.trim(),
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        },
      });
      setApiLog(r);
      if (r?.error) {
        setStatus("failed");
        toast.error(r.error);
      } else {
        setStatus(scheduled ? "scheduled" : "published");
        toast.success(scheduled ? "Scheduled" : "Published to Facebook");
        setMessage("");
        setImageUrl("");
        setLinkUrl("");
        setScheduledFor("");
        listPublishingLogs({ ...authHeaders, data: { limit: 20 } }).then((rr: any) =>
          setRecent((rr?.logs || []).filter((l: any) => l.platform === "facebook")),
        );
      }
    } catch (e: any) {
      setStatus("failed");
      toast.error(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  if (!session) return null;

  if (pages.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Facebook className="mx-auto mb-4 h-10 w-10 text-[#1877F2]" />
        <h1 className="text-2xl font-semibold text-foreground">Connect a Facebook Page first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need at least one Facebook Page connected to publish from PostSpark.
        </p>
        <Link
          to="/dashboard/settings/facebook"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to Facebook settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-[#1877F2]/15 p-2 text-[#1877F2]">
          <Facebook className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Publish to Facebook</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose, preview, schedule — direct to the Page you pick.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Composer */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Publishing to
            </label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.page_name} {p.is_default ? "· default" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Post text</label>
              <span className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {message.length.toLocaleString()} / {MAX.toLocaleString()}
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="What's on your mind? Attach an image or link below."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> Image URL
              </span>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" /> Link URL (optional)
              </span>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                disabled={!!imageUrl}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Schedule (optional)
            </span>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!canPublish}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : scheduled ? (
                <Calendar className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {scheduled ? "Schedule post" : "Publish now"}
            </button>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Preview + logs */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Facebook preview
            </h3>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <div className="mb-2 flex items-center gap-2">
                {selectedPage?.page_picture_url ? (
                  <img src={selectedPage.page_picture_url} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted" />
                )}
                <div className="text-xs">
                  <div className="font-medium text-foreground">{selectedPage?.page_name || "Your Page"}</div>
                  <div className="text-muted-foreground">Just now · 🌐</div>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {message || <span className="text-muted-foreground">Your post text will appear here…</span>}
              </p>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="mt-2 h-48 w-full rounded-md object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              )}
              {!imageUrl && linkUrl && (
                <div className="mt-2 rounded-md border border-border p-2 text-xs">
                  <div className="truncate text-muted-foreground">{linkUrl}</div>
                </div>
              )}
            </div>
          </div>

          {apiLog && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                API response
              </h3>
              <pre className="max-h-48 overflow-auto rounded-md bg-background p-2 text-[11px] leading-tight text-foreground">
                {JSON.stringify(apiLog, null, 2)}
              </pre>
            </div>
          )}

          {recent.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent Facebook activity
              </h3>
              <ul className="space-y-1.5">
                {recent.slice(0, 8).map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-xs">
                    {l.status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="capitalize text-foreground">{l.action}</span>
                    <span className="ml-auto text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "idle" | "scheduled" | "published" | "failed" }) {
  if (status === "idle") return null;
  const map = {
    scheduled: { icon: Clock, cls: "bg-amber-500/15 text-amber-400", label: "Scheduled" },
    published: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400", label: "Published" },
    failed: { icon: AlertCircle, cls: "bg-destructive/15 text-destructive", label: "Failed" },
  } as const;
  const { icon: Icon, cls, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
