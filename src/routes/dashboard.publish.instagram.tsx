import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listFacebookPages, publishToInstagram, listPublishingLogs } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import {
  Instagram,
  Image as ImageIcon,
  Film,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/publish/instagram")({
  head: () => ({
    meta: [
      { title: "Publish to Instagram — PostSpark" },
      {
        name: "description",
        content: "Publish Instagram photos, videos, and Reels straight from PostSpark.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublishInstagram,
});

const MAX = 2200;

type Page = {
  id: string;
  page_id: string;
  page_name: string | null;
  page_picture_url: string | null;
  is_default: boolean | null;
  instagram_business_account_id: string | null;
};

function PublishInstagram() {
  const { session } = useAuth();
  const authHeaders = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : ({} as any);

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "REELS" | "VIDEO">("IMAGE");
  const [publishing, setPublishing] = useState(false);
  const [apiLog, setApiLog] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "published" | "failed">("idle");
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;
    listFacebookPages(authHeaders).then((r: any) => {
      const list = (r?.pages || []).filter((p: Page) => p.instagram_business_account_id);
      setPages(list);
      const def = list.find((p: Page) => p.is_default) || list[0];
      if (def) setSelectedPageId(def.id);
    });
    listPublishingLogs({ ...authHeaders, data: { limit: 20 } }).then((r: any) =>
      setRecent((r?.logs || []).filter((l: any) => l.platform === "instagram")),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId), [pages, selectedPageId]);
  const overLimit = caption.length > MAX;
  const canPublish = caption.trim().length > 0 && !overLimit && !!mediaUrl && !publishing && !!selectedPage;

  const suggestHashtags = () => {
    const words = caption
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    const uniq = Array.from(new Set(words)).slice(0, 6);
    const tags = uniq.map((w) => `#${w}`).join(" ");
    if (!tags) {
      toast.error("Write a caption first — hashtags are generated from your text.");
      return;
    }
    setCaption((c) => (c.endsWith("\n\n") || c === "" ? c : c + "\n\n") + tags);
  };

  const handleSubmit = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setStatus("idle");
    setApiLog(null);
    try {
      const r: any = await publishToInstagram({
        ...authHeaders,
        data: {
          caption: caption.trim(),
          mediaUrl: mediaUrl.trim(),
          mediaType,
          pageRowId: selectedPageId,
        },
      });
      setApiLog(r);
      if (r?.error) {
        setStatus("failed");
        toast.error(r.error);
      } else {
        setStatus("published");
        toast.success("Published to Instagram");
        setCaption("");
        setMediaUrl("");
        listPublishingLogs({ ...authHeaders, data: { limit: 20 } }).then((rr: any) =>
          setRecent((rr?.logs || []).filter((l: any) => l.platform === "instagram")),
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
        <Instagram className="mx-auto mb-4 h-10 w-10 text-pink-400" />
        <h1 className="text-2xl font-semibold text-foreground">Link an Instagram account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a Facebook Page with a linked Instagram Business/Creator account.
        </p>
        <Link
          to="/dashboard/settings/instagram"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Instagram settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-pink-500/15 p-2 text-pink-400">
          <Instagram className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Publish to Instagram</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Photos, videos, and Reels — Meta's 2-step container flow is handled server-side.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
                  IG via {p.page_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Media type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["IMAGE", "VIDEO", "REELS"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaType(t)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
                    mediaType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {t === "IMAGE" ? <ImageIcon className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                  {t === "IMAGE" ? "Photo" : t === "REELS" ? "Reel" : "Video"}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Media URL (public https)
            </span>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              Meta fetches this URL directly. Use PostSpark's Image Studio, Stock Gallery, or your CDN.
            </span>
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Caption</label>
              <span className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {caption.length} / {MAX}
              </span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={7}
              placeholder="Write your Instagram caption. Emojis welcome."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={suggestHashtags}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                <Hash className="h-3.5 w-3.5" /> Suggest hashtags
              </button>
              <Link
                to="/dashboard/image-studio"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate image
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!canPublish}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish to Instagram
            </button>
            {status === "published" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Published
              </span>
            )}
            {status === "failed" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> Failed
              </span>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Instagram preview
            </h3>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex items-center gap-2 px-3 py-2">
                {selectedPage?.page_picture_url ? (
                  <img src={selectedPage.page_picture_url} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                )}
                <span className="text-xs font-medium text-foreground">
                  {selectedPage?.page_name || "your.account"}
                </span>
              </div>
              <div className="aspect-square w-full bg-muted">
                {mediaUrl ? (
                  mediaType === "IMAGE" ? (
                    <img
                      src={mediaUrl}
                      className="h-full w-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
                    />
                  ) : (
                    <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Media preview
                  </div>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words px-3 py-2 text-xs text-foreground">
                {caption || <span className="text-muted-foreground">Your caption will appear here…</span>}
              </p>
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
                Recent Instagram activity
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
