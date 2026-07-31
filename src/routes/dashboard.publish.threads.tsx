import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { publishToThreads, listPublishingLogs } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import {
  AtSign,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Film,
  Split,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/publish/threads")({
  head: () => ({
    meta: [
      { title: "Publish to Threads — PostSpark" },
      {
        name: "description",
        content: "Compose single posts or auto-split long content into a threaded chain on Meta's Threads.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublishThreads,
});

const MAX = 500;

function splitIntoThreads(text: string): string[] {
  const clean = text.trim();
  if (clean.length <= MAX) return [clean];
  const parts: string[] = [];
  const words = clean.split(/\s+/);
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (next.length > MAX - 8) {
      parts.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) parts.push(cur);
  const total = parts.length;
  return parts.map((p, i) => `${p} (${i + 1}/${total})`);
}

function PublishThreads() {
  const { session, user } = useAuth();
  const authHeaders = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : ({} as any);

  const [connected, setConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [library, setLibrary] = useState<any[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mediaType, setMediaType] = useState<"TEXT" | "IMAGE" | "VIDEO">("TEXT");
  const [autoSplit, setAutoSplit] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<"idle" | "published" | "failed">("idle");
  const [apiLog, setApiLog] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("social_accounts")
      .select("platform_username")
      .eq("user_id", user.id)
      .eq("platform", "threads")
      .maybeSingle()
      .then(({ data }) => {
        setConnected(Boolean(data));
        setUsername(data?.platform_username || null);
      });
    if (session) {
      listPublishingLogs({ ...authHeaders, data: { limit: 20 } }).then((r: any) =>
        setRecent((r?.logs || []).filter((l: any) => l.platform === "threads")),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session]);

  const posts = useMemo(() => (autoSplit ? splitIntoThreads(text) : [text]), [text, autoSplit]);
  const overLimit = !autoSplit && text.length > MAX;
  const canPublish = text.trim().length > 0 && !overLimit && !publishing && !uploading && connected;

  const clearMedia = () => {
    setMediaUrl("");
    setMediaPath(null);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    const file = files[0];
    setUploading(true);
    try {
      const kind: "IMAGE" | "VIDEO" = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
      const safe = file.name.replace(/[^a-zA-Z0-9-_.]/g, "-").slice(-60);
      const path = `${user.id}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from("post-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      const { data: signed } = await supabase.storage.from("post-media").createSignedUrl(path, 3600);
      setMediaPath(path);
      setMediaUrl(signed?.signedUrl || "");
      setMediaType(kind);
      toast.success("Media attached");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openLibrary = async () => {
    setShowLibrary((v) => !v);
    if (library.length || !session) return;
    const r: any = await listMediaLibrary({ ...authHeaders }).catch(() => null);
    setLibrary((r?.assets || []).filter((a: any) => a.kind !== "document"));
  };

  const pickFromLibrary = (asset: any) => {
    setMediaPath(asset.path);
    setMediaUrl(asset.url);
    setMediaType(asset.kind === "video" ? "VIDEO" : "IMAGE");
    setShowLibrary(false);
  };

  const handleSubmit = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setStatus("idle");
    setApiLog(null);
    try {
      const chain = posts;
      const results: any[] = [];
      let replyToId: string | undefined;
      for (let i = 0; i < chain.length; i++) {
        const useMedia = i === 0 && mediaType !== "TEXT" && (mediaPath || mediaUrl);
        const r: any = await publishToThreads({
          ...authHeaders,
          data: {
            text: chain[i],
            mediaPath: useMedia && mediaPath ? mediaPath : undefined,
            mediaUrl: useMedia && !mediaPath && mediaUrl ? mediaUrl : undefined,
            mediaType: useMedia ? mediaType : "TEXT",
            replyToId,
          },
        });
        results.push(r);
        if (r?.error) throw new Error(r.error);
        replyToId = r?.id || r?.threadId;
      }
      setApiLog(results);
      setStatus("published");
      toast.success(chain.length > 1 ? `Published thread of ${chain.length}` : "Published to Threads");
      setText("");
      clearMedia();
      setMediaType("TEXT");
      listPublishingLogs({ ...authHeaders, data: { limit: 20 } }).then((rr: any) =>
        setRecent((rr?.logs || []).filter((l: any) => l.platform === "threads")),
      );
    } catch (e: any) {
      setStatus("failed");
      toast.error(e?.message || "Threads publish failed");
    } finally {
      setPublishing(false);
    }
  };


  if (connected === false) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <AtSign className="mx-auto mb-4 h-10 w-10 text-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Connect Threads first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Threads uses the Instagram Business account linked to a Facebook Page you manage.
        </p>
        <Link
          to="/dashboard/settings/threads"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Threads settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-foreground/10 p-2 text-foreground">
          <AtSign className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Publish to Threads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            500 chars per post. Auto-split turns long content into a numbered chain.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Posting as <span className="font-medium text-foreground">@{username || "you"}</span>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoSplit}
                onChange={(e) => setAutoSplit(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <Split className="h-3.5 w-3.5" /> Auto-split long text
            </label>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thread text</label>
              <span className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {text.length} chars · {posts.length} post{posts.length === 1 ? "" : "s"}
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              placeholder="What are you thinking? Longer text is split into a numbered thread automatically."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attach media (first post only)
            </label>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {(["TEXT", "IMAGE", "VIDEO"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMediaType(t)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
                    mediaType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {t === "TEXT" ? "Text" : t === "IMAGE" ? <ImageIcon className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                  {t !== "TEXT" && (t === "IMAGE" ? "Photo" : "Video")}
                </button>
              ))}
            </div>
            {mediaType !== "TEXT" && (
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!canPublish}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {posts.length > 1 ? `Publish thread (${posts.length})` : "Publish"}
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
              Thread preview
            </h3>
            <div className="space-y-3">
              {posts.map((p, i) => (
                <div key={i} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <span className="font-medium text-foreground">@{username || "you"}</span>
                    {posts.length > 1 && <span className="ml-auto">{i + 1}/{posts.length}</span>}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                    {p || <span className="text-muted-foreground">Your post…</span>}
                  </p>
                  {i === 0 && mediaType !== "TEXT" && mediaUrl && (
                    <div className="mt-2 overflow-hidden rounded-md border border-border">
                      {mediaType === "IMAGE" ? (
                        <img src={mediaUrl} alt="Preview of the image attached to your Threads post" className="h-40 w-full object-cover" />
                      ) : (
                        <video src={mediaUrl} className="h-40 w-full object-cover" muted playsInline />
                      )}
                    </div>
                  )}
                </div>
              ))}
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
                Recent Threads activity
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
