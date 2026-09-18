import { brandColor } from "@/lib/brandColors";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { ToolHero } from "@/components/dashboard/ToolHero";
import { PackQueue, rowsFromPieces, type QueueRow } from "@/components/publish/PackQueue";
import { PUBLISH_PACK_KEY, type Piece } from "@/lib/pieces";
import { EmptyState, ErrorState, LoadingPane, SkeletonCard } from "@/components/dashboard/StateViews";

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

/** Shared pane chrome so every publishing pane matches on desktop and mobile. */
const PANE = "min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5";
const PANE_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

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
  const [failures, setFailures] = useState<string[]>([]);

  const [queue, setQueue] = useState<QueueRow[]>([]);

  // Whole-pack handoff from Repurpose ("Publish all")
  useEffect(() => {
    try {
      const rawPack = sessionStorage.getItem(PUBLISH_PACK_KEY);
      if (rawPack) {
        sessionStorage.removeItem(PUBLISH_PACK_KEY);
        const parsed = JSON.parse(rawPack) as { pieces?: Piece[] };
        if (parsed?.pieces?.length) setQueue(rowsFromPieces(parsed.pieces));
      }
    } catch {}
  }, []);

  // Prefill from Repurpose ("Publish" menu handoff)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("postspark.publish.draft");
      if (!raw) return;
      sessionStorage.removeItem("postspark.publish.draft");
      const d = JSON.parse(raw) as { text?: string; platform?: string | null };
      if (d?.text) setText(d.text);
      const valid = PLATFORMS.some((p) => p.id === d?.platform);
      if (valid) {
        setSelected(new Set([d.platform as PlatformId]));
        setPreviewPlatform(d.platform as PlatformId);
      }
    } catch {}
  }, []);

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
    setFailures([]);
    const results: string[] = [];
    const fails: string[] = [];
    const fmt = (label: string, r: any) => {
      if (r?.ok) return `${label}: ✅`;
      fails.push(`${label}: ${r?.error || "failed"}`);
      return `${label}: ❌ ${r?.error || "failed"}`;
    };
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
            fails.push("Instagram: needs an image or video");
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
        fails.push(`${id}: ${e?.message || "error"}`);
      }
    }
    setPublishing(false);
    setFailures(fails);
    toast.message("Publish results", { description: results.join("\n") });
  };

  const scheduleAll = async () => {
    if (!text.trim()) return toast.error("Write something first");
    if (selected.size === 0) return toast.error("Pick at least one platform");
    if (!scheduleAt) return toast.error("Pick a date/time");
    setScheduling(true);
    let ok = 0;
    let slotLimit = false;
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
      else if ((r as any).error === "SLOT_LIMIT") slotLimit = true;
    }
    setScheduling(false);
    if (ok > 0) toast.success(`Scheduled to ${ok}/${selected.size} platform(s)`);
    else if (slotLimit)
      toast.error("You've used all 10 free scheduled posts this month", {
        description: "Add schedule slots to keep scheduling, or upgrade for unlimited.",
        action: { label: "Get more slots", onClick: () => navigate({ to: "/dashboard/billing" }) },
      });
    else toast.error("Nothing scheduled");
  };


  const busy = publishing || scheduling;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <ToolHero
        eyebrow="Publishing Center"
        icon={<Sparkles className="h-3 w-3" />}
        title="Publish everywhere, from one composer"
        subtitle="Send a whole content pack out in one click — every post to its native platform, with native limits enforced."
        art="upgrade"
        steps={["Write once", "Preview per platform", "Publish or schedule"]}
      />

      <PackQueue rows={queue} setRows={(u) => setQueue((prev) => u(prev))} onClear={() => setQueue([])} />

      <div className="grid gap-5 lg:grid-cols-[1fr_260px_1fr]">
        {/* Composer */}
        <section className={PANE}>
          <label className={PANE_LABEL} htmlFor="pc-caption">
            Caption
          </label>
          <textarea
            id="pc-caption"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="What do you want to share?"
            className="mt-2.5 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:border-primary"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={over ? "font-medium text-destructive" : "text-muted-foreground"}>
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
                      bad ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.label} {count}/{p.limit}
                  </span>
                );
              })}
            </div>
          </div>

          <label className={`mt-5 block ${PANE_LABEL}`} htmlFor="pc-media">
            Media URL (image or video)
          </label>
          <input
            id="pc-media"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://…"
            className="mt-2.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Attach an image or video from Image Studio, Stock Gallery, or paste any public URL.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={publishNow}
              disabled={busy || over || selected.size === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {publishing ? "Publishing…" : "Publish now"}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                aria-label="Schedule date and time"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={scheduleAll}
                disabled={busy || !scheduleAt || selected.size === 0}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
                {scheduling ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </div>

          {failures.length > 0 && !busy && (
            <ErrorState
              className="mt-5 text-left"
              title="Some posts didn't go out"
              message={`${failures.join(" · ")}. Your caption and media are still here — retry when you're ready.`}
              onRetry={publishNow}
              retryLabel="Retry publish"
            />
          )}
        </section>

        {/* Platform toggles */}
        <section className={PANE}>
          <div className={`mb-3.5 ${PANE_LABEL}`}>Platforms</div>
          <div className="grid gap-2">
            {PLATFORMS.map((p) => {
              const active = selected.has(p.id);
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  data-selected={active ? "true" : undefined}
                  style={{ ["--cat" as any]: brandColor(p.id) }}
                  className={`lux-brand-card flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      data-brand-tile="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${p.color} text-white`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{p.label}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{p.limit}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live preview */}
        <section className={PANE}>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className={PANE_LABEL}>Preview</div>
            <select
              aria-label="Preview platform"
              value={previewPlatform}
              onChange={(e) => setPreviewPlatform(e.target.value as PlatformId)}
              className="shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-xs"
            >
              {PLATFORMS.filter((p) => selected.has(p.id)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {busy ? (
            <LoadingPane label={publishing ? "Publishing your post" : "Scheduling your post"}>
              <SkeletonCard lines={4} />
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                {publishing ? "Sending to each platform…" : "Adding to your queue…"}
              </p>
            </LoadingPane>
          ) : !text.trim() ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5" />}
              title="Nothing to preview yet"
              body="Write a caption — or send a whole pack over from Repurpose Studio — and you'll see exactly how it lands on each platform."
            />
          ) : (
            <PostPreview platform={previewPlatform} text={text} mediaUrl={mediaUrl} />
          )}
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
      <div className="flex min-w-0 items-center gap-2">
        <div
          data-brand-tile="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${P.color} text-white`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="truncate text-sm font-semibold">Your Brand</div>
        <span className="shrink-0 text-xs text-muted-foreground">· now</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p>
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
