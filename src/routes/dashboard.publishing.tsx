import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Send,
  Calendar as CalendarIcon,
  Loader2,
  Facebook,
  Instagram,
  AtSign,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  Sparkles,
} from "lucide-react";
import { publishToX } from "@/lib/socialPublish.functions";
import { publishToFacebook, publishToInstagram, publishToThreads } from "@/lib/metaPublish.functions";
import { createScheduledPost } from "@/lib/calendar.functions";

export const Route = createFileRoute("/dashboard/publishing")({
  head: () => ({
    meta: [
      { title: "Publishing Center — PostSpark" },
      {
        name: "description",
        content:
          "One composer, every platform. Post to Facebook, Instagram, Threads, X, LinkedIn, TikTok and YouTube from one place.",
      },
      { property: "og:title", content: "Publishing Center — PostSpark" },
      {
        property: "og:description",
        content: "Unified composer for Facebook, Instagram, Threads, X and more.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublishingCenter,
});

type PlatformId = "facebook" | "instagram" | "threads" | "x" | "linkedin" | "tiktok" | "youtube";

const PLATFORMS: {
  id: PlatformId;
  label: string;
  icon: any;
  limit: number;
  color: string;
}[] = [
  { id: "facebook", label: "Facebook", icon: Facebook, limit: 63206, color: "bg-[#1877F2]" },
  { id: "instagram", label: "Instagram", icon: Instagram, limit: 2200, color: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
  { id: "threads", label: "Threads", icon: AtSign, limit: 500, color: "bg-black" },
  { id: "x", label: "X", icon: Twitter, limit: 280, color: "bg-black" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, limit: 3000, color: "bg-[#0A66C2]" },
  { id: "tiktok", label: "TikTok", icon: Music2, limit: 2200, color: "bg-black" },
  { id: "youtube", label: "YouTube", icon: Youtube, limit: 5000, color: "bg-[#FF0000]" },
];

function PublishingCenter() {
  const { session } = useAuth();
  const authHeaders = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : ({} as any);

  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Set<PlatformId>>(new Set(["x"]));
  const [mediaUrl, setMediaUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<PlatformId>("x");

  const toggle = (id: PlatformId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (!next.has(previewPlatform) && next.size > 0) {
        setPreviewPlatform(Array.from(next)[0]!);
      }
      return next;
    });
  };

  const activeLimit = useMemo(
    () => Math.min(...Array.from(selected).map((p) => PLATFORMS.find((x) => x.id === p)!.limit)),
    [selected],
  );

  const count = text.length;
  const over = count > activeLimit;

  const publishNow = async () => {
    if (!text.trim()) return toast.error("Write something first");
    if (selected.size === 0) return toast.error("Pick at least one platform");
    setPublishing(true);
    const results: string[] = [];
    const fmt = (label: string, r: any) =>
      r?.ok ? `${label}: ✅` : `${label}: ❌ ${r?.error || "failed"}`;
    for (const id of selected) {
      try {
        if (id === "x") {
          const r = await publishToX({ data: { text, mediaUrls: mediaUrl ? [mediaUrl] : [] }, ...authHeaders } as any);
          // publishToX returns { ok: true, tweetId } or { error }
          results.push(fmt("X", r));
        } else if (id === "facebook") {
          const isVideo = /\.(mp4|webm|mov)$/i.test(mediaUrl);
          const r = await publishToFacebook({
            data: {
              message: text,
              ...(mediaUrl && !isVideo ? { imageUrl: mediaUrl } : {}),
            },
            ...authHeaders,
          } as any);
          results.push(fmt("Facebook", r));
        } else if (id === "instagram") {
          if (!mediaUrl) {
            results.push("Instagram: ❌ media required");
            continue;
          }
          const isVideo = /\.(mp4|webm|mov)$/i.test(mediaUrl);
          const r = await publishToInstagram({
            data: { caption: text, mediaUrl, mediaType: isVideo ? "REELS" : "IMAGE" },
            ...authHeaders,
          } as any);
          results.push(fmt("Instagram", r));
        } else if (id === "threads") {
          const isVideo = /\.(mp4|webm|mov)$/i.test(mediaUrl);
          const r = await publishToThreads({
            data: {
              text,
              mediaUrl: mediaUrl || undefined,
              mediaType: mediaUrl ? (isVideo ? "VIDEO" : "IMAGE") : "TEXT",
            },
            ...authHeaders,
          } as any);
          results.push(fmt("Threads", r));
        } else {
          results.push(`${id}: not wired for direct publish yet — use dedicated page`);
        }
      } catch (e: any) {
        results.push(`${id}: ❌ ${e?.message || "error"}`);
      }
    }
    setPublishing(false);
    toast.message("Publish results", { description: results.join("\n") });
  };

  const scheduleAll = async () => {
    if (!text.trim()) return toast.error("Write something first");
    if (selected.size === 0) return toast.error("Pick at least one platform");
    if (!scheduleAt) return toast.error("Pick a date/time");
    setScheduling(true);
    let ok = 0;
    for (const id of selected) {
      const platform = id === "x" ? "twitter" : id;
      const r = await createScheduledPost({
        data: {
          title: text.slice(0, 60),
          content: text,
          platform: platform as any,
          scheduled_for: new Date(scheduleAt).toISOString(),
        },
        ...authHeaders,
      } as any);
      if ((r as any).success) ok++;
    }
    setScheduling(false);
    if (ok > 0) toast.success(`Scheduled to ${ok}/${selected.size} platform(s)`);
    else toast.error("Nothing scheduled");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publishing Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One composer for every network. Toggle platforms, preview, then publish or schedule.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px_1fr]">
        {/* Composer */}
        <section className="rounded-xl border border-border bg-card p-4">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Caption
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="What do you want to share?"
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={over ? "text-destructive font-medium" : "text-muted-foreground"}>
              {count}/{activeLimit} chars
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {Array.from(selected).map((id) => {
                const p = PLATFORMS.find((x) => x.id === id)!;
                const bad = count > p.limit;
                return (
                  <span
                    key={id}
                    className={`rounded-full px-2 py-0.5 ${
                      bad
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.label} {count}/{p.limit}
                  </span>
                );
              })}
            </div>
          </div>

          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Media URL (image or video)
          </label>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://…"
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Attach an image or video from Image Studio, Stock Gallery, or paste any public URL.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={publishNow}
              disabled={publishing || over || selected.size === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish now
            </button>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={scheduleAll}
                disabled={scheduling || !scheduleAt || selected.size === 0}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarIcon className="h-4 w-4" />
                )}
                Schedule
              </button>
            </div>
          </div>
        </section>

        {/* Platform toggles */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platforms
          </div>
          <div className="grid gap-2">
            {PLATFORMS.map((p) => {
              const active = selected.has(p.id);
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded ${p.color} text-white`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {p.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{p.limit}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live preview */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </div>
            <select
              value={previewPlatform}
              onChange={(e) => setPreviewPlatform(e.target.value as PlatformId)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
            >
              {PLATFORMS.filter((p) => selected.has(p.id)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <PostPreview platform={previewPlatform} text={text} mediaUrl={mediaUrl} />
        </section>
      </div>
    </div>
  );
}

function PostPreview({
  platform,
  text,
  mediaUrl,
}: {
  platform: PlatformId;
  text: string;
  mediaUrl: string;
}) {
  const P = PLATFORMS.find((p) => p.id === platform)!;
  const Icon = P.icon;
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${P.color} text-white`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold">Your Brand</div>
        <span className="text-xs text-muted-foreground">· now</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
        {text || <span className="text-muted-foreground">Your caption will appear here…</span>}
      </p>
      {mediaUrl && /^https?:\/\//.test(mediaUrl) ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          {/\.(mp4|webm|mov)$/i.test(mediaUrl) ? (
            <video src={mediaUrl} controls className="w-full" />
          ) : (
            <img src={mediaUrl} alt="" className="w-full" />
          )}
        </div>
      ) : null}
    </div>
  );
}
