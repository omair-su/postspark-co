import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  getInstagramAuthUrl,
  getInstagramConnection,
  disconnectInstagram,
  deauthorizeInstagram,
  refreshInstagramProfile,
  publishInstagramPost,
  listInstagramMedia,
  listInstagramComments,
  replyToInstagramComment,
  moderateInstagramComment,
  getInstagramInsights,
} from "@/lib/instagram.functions";
import InstagramSetupGuide from "@/components/instagram/InstagramSetupGuide";
import InstagramStatusPanel from "@/components/instagram/InstagramStatusPanel";
import {
  Instagram,
  Loader2,
  Send,
  Image as ImageIcon,
  Film,
  LayoutGrid,
  Clock,
  MessageCircle,
  BarChart3,
  RefreshCw,
  Unlink,
  Upload,
  EyeOff,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Link2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/instagram")({
  head: () => ({
    meta: [
      { title: "Instagram — PostSpark" },
      {
        name: "description",
        content: "Connect Instagram, publish posts, Reels, carousels and Stories, track insights and manage comments.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InstagramHub,
});

const MAX_CAPTION = 2200;
type Tab = "overview" | "publish" | "insights" | "comments" | "connect";
type PostKind = "IMAGE" | "CAROUSEL" | "REELS" | "STORIES";

function InstagramHub() {
  const { session, user } = useAuth();
  const authHeaders = useMemo(
    () => (session ? ({ headers: { Authorization: `Bearer ${session.access_token}` } } as any) : ({} as any)),
    [session],
  );

  const [tab, setTab] = useState<Tab>("overview");
  const [conn, setConn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const r: any = await getInstagramConnection({ ...authHeaders }).catch(() => null);
    setConn(r);
    setLoading(false);
  }, [session, authHeaders]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // surface ?instagram=connected | error:...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("instagram");
    if (!p) return;
    if (p === "connected") toast.success("Instagram connected");
    else if (p.startsWith("error:")) toast.error(decodeURIComponent(p.slice(6)));
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const r: any = await getInstagramAuthUrl({ ...authHeaders });
      if (r?.error) return toast.error(r.error);
      window.location.href = r.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start Instagram login");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (typeof window !== "undefined" && !window.confirm("Disconnect Instagram? Scheduled Instagram posts will stop publishing.")) return;
    setBusy("disconnect");
    try {
      const r: any = await deauthorizeInstagram({ ...authHeaders }).catch(async () => {
        // Fall back to the plain local disconnect if the deauthorize call fails.
        return await disconnectInstagram({ ...authHeaders });
      });
      if (r?.error) return toast.error(r.error);
      setAuthError(null);
      if (r?.callbackOk === false) toast.success("Instagram disconnected (revoke notice will retry later)");
      else toast.success("Instagram disconnected");
      setTab("connect");
      loadConnection();
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    setBusy("refresh");
    try {
      const r: any = await refreshInstagramProfile({ ...authHeaders });
      if (r?.error) return toast.error(r.error);
      setAuthError(null);
      toast.success("Profile refreshed");
      loadConnection();
    } finally {
      setBusy(null);
    }
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="ps-tool-hero mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-rose-500/20 p-2.5 text-pink-400">
            <Instagram className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Instagram</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Direct Instagram Business login — no Facebook Page required. Publish posts, carousels, Reels and Stories,
              read insights, and reply to comments.
            </p>
          </div>
        </div>
        {conn?.connected ? (
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              onClick={disconnect}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted"
            >
              <Unlink className="h-3.5 w-3.5" /> Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={connecting || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
            Connect Instagram
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Instagram…
        </div>
      ) : !conn?.connected ? (
        <div className="space-y-6">
          <NotConnected redirectUri={conn?.redirectUri} onConnect={connect} connecting={connecting} />
          <InstagramStatusPanel
            conn={conn}
            authError={authError}
            connecting={connecting}
            busy={busy}
            onConnect={connect}
            onReconnect={connect}
            onRefresh={refresh}
            onDisconnect={disconnect}
          />
          <InstagramSetupGuide defaultOpen />
        </div>
      ) : (
        <>
          <nav className="mb-6 flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1.5">
            {(
              [
                ["overview", "Overview", LayoutGrid],
                ["publish", "Publish", Send],
                ["insights", "Insights", BarChart3],
                ["comments", "Comments", MessageCircle],
                ["connect", "Connection", Link2],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  tab === key
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>

          {tab === "overview" && <OverviewTab conn={conn} authHeaders={authHeaders} />}
          {tab === "publish" && <PublishTab authHeaders={authHeaders} userId={user?.id || ""} onAuthError={(m: string) => { setAuthError(m); setTab("connect"); }} />}
          {tab === "insights" && <InsightsTab authHeaders={authHeaders} />}
          {tab === "comments" && <CommentsTab authHeaders={authHeaders} />}
          {tab === "connect" && (
            <div className="space-y-6">
              <InstagramStatusPanel
                conn={conn}
                authError={authError}
                connecting={connecting}
                busy={busy}
                onConnect={connect}
                onReconnect={connect}
                onRefresh={refresh}
                onDisconnect={disconnect}
              />
              <InstagramSetupGuide />
              <p className="text-xs text-muted-foreground">
                Admin?{" "}
                <a href="/dashboard/instagram-webhooks" className="font-medium text-primary hover:underline">
                  Open Instagram webhook health
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NotConnected({
  redirectUri,
  onConnect,
  connecting,
}: {
  redirectUri?: string;
  onConnect: () => void;
  connecting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <Instagram className="mx-auto mb-3 h-10 w-10 text-pink-400" />
      <h2 className="text-lg font-semibold text-foreground">Connect your Instagram Business account</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        You'll sign in with Instagram directly. Your account must be a Business or Creator account. PostSpark asks for
        permission to publish content, read insights, and manage comments and messages.
      </p>
      <button
        onClick={onConnect}
        disabled={connecting}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
        Continue with Instagram
      </button>
      {redirectUri && (
        <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link2 className="h-3 w-3" /> Redirect URI: <code className="text-foreground">{redirectUri}</code>
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value === null || value === undefined ? "—" : typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function OverviewTab({ conn, authHeaders }: { conn: any; authHeaders: any }) {
  const [media, setMedia] = useState<any[]>([]);
  useEffect(() => {
    listInstagramMedia({ ...authHeaders, data: { limit: 12 } })
      .then((r: any) => setMedia(r?.media || []))
      .catch(() => setMedia([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expires = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
        {conn.avatarUrl ? (
          <img
            src={conn.avatarUrl}
            alt={`${conn.username || "Instagram"} profile picture`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Instagram className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">@{conn.username || "instagram"}</p>
          <p className="text-sm text-muted-foreground">
            {conn.displayName || "Instagram Business"}
            {conn.accountType ? ` · ${String(conn.accountType).toLowerCase()}` : ""}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Connected
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Followers" value={conn.followersCount} icon={Users} />
        <StatCard label="Following" value={conn.followsCount} icon={Users} />
        <StatCard label="Posts" value={conn.mediaCount} icon={LayoutGrid} />
      </div>

      {expires && (
        <p className="text-xs text-muted-foreground">
          Access renews automatically. Current token valid until {expires.toLocaleDateString()}.
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recent posts</h3>
        {media.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No posts found yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {media.map((m) => (
              <a
                key={m.id}
                href={m.permalink}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="aspect-square w-full bg-muted">
                  <img
                    src={m.thumbnail_url || m.media_url}
                    alt={m.caption ? m.caption.slice(0, 80) : "Instagram post thumbnail"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between px-2.5 py-2 text-[11px] text-muted-foreground">
                  <span>{m.like_count ?? 0} likes</span>
                  <span>{m.comments_count ?? 0} comments</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PublishTab({ authHeaders, userId, onAuthError }: { authHeaders: any; userId: string; onAuthError: (m: string) => void }) {
  const [kind, setKind] = useState<PostKind>("IMAGE");
  const [caption, setCaption] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [shareToFeed, setShareToFeed] = useState(true);
  const [scheduledFor, setScheduledFor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const overLimit = caption.length > MAX_CAPTION;
  const needsMultiple = kind === "CAROUSEL";
  const canPublish =
    !publishing &&
    !overLimit &&
    urls.length >= (needsMultiple ? 2 : 1) &&
    (kind === "STORIES" || kind === "REELS" || caption.trim().length > 0 || urls.length > 0);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const safe = file.name.replace(/[^a-zA-Z0-9-_.]/g, "-").slice(-60);
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("post-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        const { data: signed } = await supabase.storage.from("post-media").createSignedUrl(path, 86400);
        if (signed?.signedUrl) next.push(signed.signedUrl);
      }
      setUrls((u) => (needsMultiple ? [...u, ...next].slice(0, 10) : next.slice(0, 1)));
      toast.success(next.length > 1 ? `${next.length} files attached` : "Media attached");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addManual = () => {
    const v = manualUrl.trim();
    if (!/^https:\/\//.test(v)) return toast.error("Enter a public https media URL");
    setUrls((u) => (needsMultiple ? [...u, v].slice(0, 10) : [v]));
    setManualUrl("");
  };

  const submit = async () => {
    if (!canPublish) return;
    setPublishing(true);
    try {
      const r: any = await publishInstagramPost({
        ...authHeaders,
        data: {
          type: kind,
          caption: caption.trim() || undefined,
          mediaUrl: needsMultiple ? undefined : urls[0],
          mediaUrls: needsMultiple ? urls : undefined,
          shareToFeed,
          firstComment: firstComment.trim() || undefined,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        },
      });
      if (r?.error) {
        toast.error(r.error, {
          description: r.errorCode ? `Instagram error code ${r.errorCode}` : undefined,
          duration: 6000,
        });
        if (r.needsReconnect) onAuthError("Instagram rejected your access token, so publishing failed.");
        return;
      }
      toast.success(r?.scheduled ? "Scheduled for Instagram" : "Published to Instagram");
      setCaption("");
      setUrls([]);
      setFirstComment("");
      setScheduledFor("");
    } catch (e: any) {
      toast.error(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Post type
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["IMAGE", "Photo", ImageIcon],
                ["CAROUSEL", "Carousel", LayoutGrid],
                ["REELS", "Reel", Film],
                ["STORIES", "Story", Clock],
              ] as const
            ).map(([k, label, Icon]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setUrls([]);
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
                  kind === k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Media {needsMultiple ? "(2–10 items)" : kind === "REELS" ? "(video)" : "(image)"}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload from device
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={kind === "REELS" ? "video/*" : "image/*,video/*"}
              multiple={needsMultiple}
              onChange={(e) => upload(e.target.files)}
              className="hidden"
            />
            <div className="flex min-w-[220px] flex-1 gap-2">
              <input
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="…or paste a public https URL"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
              <button
                type="button"
                onClick={addManual}
                className="rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted"
              >
                Add
              </button>
            </div>
          </div>
          {urls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {urls.map((u, i) => (
                <div key={u + i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  {/\.(mp4|mov|m4v)(\?|$)/i.test(u) ? (
                    <video src={u} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={u} alt={`Attached media ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded bg-background/90 p-0.5 text-foreground"
                    aria-label="Remove media"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {kind !== "STORIES" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Caption</label>
              <span className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {caption.length} / {MAX_CAPTION}
              </span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              placeholder="Write your Instagram caption. Hashtags and emojis welcome."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            />
          </div>
        )}

        {kind === "REELS" && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={shareToFeed} onChange={(e) => setShareToFeed(e.target.checked)} />
            Also share this Reel to my feed
          </label>
        )}

        {kind !== "STORIES" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              First comment (optional)
            </label>
            <input
              value={firstComment}
              onChange={(e) => setFirstComment(e.target.value)}
              placeholder="Drop your link or extra hashtags here"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <button
          onClick={submit}
          disabled={!canPublish}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {scheduledFor ? "Schedule post" : "Publish now"}
        </button>
      </div>

      <aside className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className={`w-full bg-muted ${kind === "STORIES" || kind === "REELS" ? "aspect-[9/16]" : "aspect-square"}`}>
            {urls[0] ? (
              /\.(mp4|mov|m4v)(\?|$)/i.test(urls[0]) ? (
                <video src={urls[0]} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={urls[0]} alt="Preview of your Instagram post" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Media preview</div>
            )}
          </div>
          {kind !== "STORIES" && (
            <p className="whitespace-pre-wrap break-words px-3 py-2 text-xs text-foreground">
              {caption || <span className="text-muted-foreground">Your caption will appear here…</span>}
            </p>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Instagram fetches media from a public URL, so uploads are stored in PostSpark and shared with a signed link.
        </p>
      </aside>
    </div>
  );
}

function InsightsTab({ authHeaders }: { authHeaders: any }) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getInstagramInsights({ ...authHeaders, data: { days } })
      .then((r: any) => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const sumMetric = (name: string) => {
    const row = (data?.daily || []).find((d: any) => d.name === name);
    if (!row) return null;
    return (row.values || []).reduce((a: number, v: any) => a + (v.value || 0), 0);
  };
  const totalValue = (name: string) => {
    const row = (data?.totals || []).find((d: any) => d.name === name);
    return row?.total_value?.value ?? null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {([7, 30, 90] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              days === d ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted"
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading insights…
        </div>
      ) : data?.error ? (
        <p className="rounded-xl border border-border bg-card p-5 text-sm text-destructive">{data.error}</p>
      ) : (
        <>
          {data?.warning && (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
              <AlertCircle className="h-3.5 w-3.5" /> {data.warning}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Reach" value={sumMetric("reach")} icon={Users} />
            <StatCard label="Profile views" value={sumMetric("profile_views")} icon={Eye} />
            <StatCard label="Accounts engaged" value={totalValue("accounts_engaged")} icon={MessageCircle} />
            <StatCard label="Interactions" value={totalValue("total_interactions")} icon={BarChart3} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Top recent posts</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.media || []).map((m: any) => (
                <a
                  key={m.id}
                  href={m.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/50"
                >
                  <img
                    src={m.thumbnail_url || m.media_url}
                    alt={m.caption ? m.caption.slice(0, 60) : "Instagram post thumbnail"}
                    className="h-16 w-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs text-foreground">{m.caption || "(no caption)"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {(m.like_count ?? 0).toLocaleString()} likes · {(m.comments_count ?? 0).toLocaleString()} comments
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CommentsTab({ authHeaders }: { authHeaders: any }) {
  const [media, setMedia] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string>("");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    listInstagramMedia({ ...authHeaders, data: { limit: 25 } })
      .then((r: any) => {
        const list = r?.media || [];
        setMedia(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch(() => setMedia([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(
    async (mediaId: string) => {
      if (!mediaId) return;
      setLoading(true);
      const r: any = await listInstagramComments({ ...authHeaders, data: { mediaId } }).catch(() => null);
      if (r?.error) toast.error(r.error);
      setComments(r?.comments || []);
      setLoading(false);
    },
    [authHeaders],
  );

  useEffect(() => {
    load(selected);
  }, [selected, load]);

  const sendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    const r: any = await replyToInstagramComment({ ...authHeaders, data: { commentId, message: replyText.trim() } });
    if (r?.error) return toast.error(r.error);
    toast.success("Reply sent");
    setReplyText("");
    setReplyTo("");
    load(selected);
  };

  const moderate = async (commentId: string, action: "hide" | "unhide" | "delete") => {
    const r: any = await moderateInstagramComment({ ...authHeaders, data: { commentId, action } });
    if (r?.error) return toast.error(r.error);
    toast.success(action === "delete" ? "Comment deleted" : action === "hide" ? "Comment hidden" : "Comment unhidden");
    load(selected);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your posts</h3>
        <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
          {media.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left ${
                selected === m.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <img
                src={m.thumbnail_url || m.media_url}
                alt={m.caption ? m.caption.slice(0, 40) : "Instagram post thumbnail"}
                className="h-10 w-10 rounded object-cover"
                loading="lazy"
              />
              <span className="line-clamp-2 flex-1 text-[11px] text-foreground">{m.caption || "(no caption)"}</span>
              <span className="text-[11px] text-muted-foreground">{m.comments_count ?? 0}</span>
            </button>
          ))}
          {media.length === 0 && <p className="text-xs text-muted-foreground">No posts found.</p>}
        </div>
      </aside>

      <section className="rounded-2xl border border-border bg-card p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments on this post yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">@{c.username || "user"}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.timestamp ? new Date(c.timestamp).toLocaleString() : ""}
                  </span>
                  {c.hidden && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">hidden</span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.text}</p>
                {(c.replies?.data || []).length > 0 && (
                  <ul className="mt-2 space-y-1.5 border-l border-border pl-3">
                    {c.replies.data.map((r: any) => (
                      <li key={r.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">@{r.username}</span> {r.text}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setReplyTo(replyTo === c.id ? "" : c.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                  >
                    <MessageCircle className="h-3 w-3" /> Reply
                  </button>
                  <button
                    onClick={() => moderate(c.id, c.hidden ? "unhide" : "hide")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                  >
                    {c.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {c.hidden ? "Unhide" : "Hide"}
                  </button>
                  <button
                    onClick={() => moderate(c.id, "delete")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
                {replyTo === c.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply…"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                    />
                    <button
                      onClick={() => sendReply(c.id)}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      Send
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
