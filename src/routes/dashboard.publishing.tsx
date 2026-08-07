import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Send,
  Calendar as CalendarIcon,
  Loader2,
  AtSign,
  Sparkles,
  Image as ImageIcon,
  Check,
  Radio,
} from "lucide-react";
import { BrandGlyph, type BrandKey } from "@/components/BrandIcon";
import { publishToX } from "@/lib/socialPublish.functions";
import { publishToFacebook, publishToInstagram, publishToThreads } from "@/lib/metaPublish.functions";
import { createScheduledPost } from "@/lib/calendar.functions";
import { HeroArt } from "@/components/dashboard/HeroArt";

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
  brand: BrandKey;
  psxClass: string;
  limit: number;
  color: string;
}[] = [
  { id: "facebook", label: "Facebook", brand: "facebook", psxClass: "psx-platform-facebook", limit: 63206, color: "#1877F2" },
  { id: "instagram", label: "Instagram", brand: "instagram", psxClass: "psx-platform-instagram", limit: 2200, color: "#DD2A7B" },
  { id: "threads", label: "Threads", brand: "threads", psxClass: "psx-platform-threads", limit: 500, color: "#4b5563" },
  { id: "x", label: "X", brand: "x", psxClass: "psx-platform-twitter", limit: 280, color: "#4b5563" },
  { id: "linkedin", label: "LinkedIn", brand: "linkedin", psxClass: "psx-platform-linkedin", limit: 3000, color: "#0A66C2" },
  { id: "tiktok", label: "TikTok", brand: "tiktok", psxClass: "psx-platform-tiktok", limit: 2200, color: "#4b5563" },
  { id: "youtube", label: "YouTube", brand: "youtube", psxClass: "psx-platform-youtube", limit: 5000, color: "#FF0000" },
];

type PublishState = "idle" | "publishing" | "success" | "error";

function PublishingCenter() {
  const { session } = useAuth();
  const authHeaders = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : ({} as any);

  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Set<PlatformId>>(new Set(["x"]));
  const [mediaUrl, setMediaUrl] = useState("");
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishResults, setPublishResults] = useState<string[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<PlatformId>("x");

  const publishing = publishState === "publishing";

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
    () =>
      selected.size > 0
        ? Math.min(...Array.from(selected).map((p) => PLATFORMS.find((x) => x.id === p)!.limit))
        : 280,
    [selected],
  );

  const count = text.length;
  const over = count > activeLimit;

  const publishNow = async () => {
    if (!text.trim()) return toast.error("Write something first");
    if (selected.size === 0) return toast.error("Pick at least one platform");
    setPublishState("publishing");
    const results: string[] = [];
    let anyFail = false;
    const fmt = (label: string, r: any) => {
      if (!r?.ok) anyFail = true;
      return r?.ok ? `${label}: ✅` : `${label}: ❌ ${r?.error || "failed"}`;
    };
    for (const id of selected) {
      try {
        if (id === "x") {
          const r = await publishToX({ data: { text, mediaUrls: mediaUrl ? [mediaUrl] : [] }, ...authHeaders } as any);
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
            anyFail = true;
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
        anyFail = true;
        results.push(`${id}: ❌ ${e?.message || "error"}`);
      }
    }
    setPublishResults(results);
    setPublishState(anyFail ? "error" : "success");
    toast.message("Publish results", { description: results.join("\n") });
    setTimeout(() => setPublishState("idle"), 4000);
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
      {/* HERO */}
      <div className="psx-hero relative mb-6 overflow-hidden rounded-2xl px-6 py-6" data-page="publishing">
        <HeroArt art="upgrade" />
        <div className="psx-hero-eyebrow">
          <Radio className="h-3 w-3" /> Publishing Center
        </div>
        <h1 className="psx-hero-title mt-1.5">
          One composer, <em>every network</em>
        </h1>
        <p className="psx-hero-desc mt-1.5">
          One place to write, preview, and publish to 7 platforms simultaneously.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["1 Write caption", "2 Choose platforms", "3 Preview", "4 Publish"].map((step, i) => (
            <span key={step} className="psx-pill" style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
              {step}
              {i < 3 && <span className="text-white/40">→</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px_1fr]">
        {/* Composer */}
        <section className="psx-card p-4">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Caption
          </label>
          <div className="psx-card-input mt-2 overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="What do you want to share?"
              className="w-full resize-y border-none bg-transparent p-3 text-sm outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              className={`font-mono ${over ? "font-semibold text-destructive" : "text-muted-foreground"}`}
            >
              {count}/{activeLimit} chars
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {Array.from(selected).map((id) => {
                const p = PLATFORMS.find((x) => x.id === id)!;
                const bad = count > p.limit;
                const pct = Math.min(100, (count / p.limit) * 100);
                return (
                  <span
                    key={id}
                    className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono ${
                      bad ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="relative inline-block h-1.5 w-8 overflow-hidden rounded-full bg-border">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${pct}%`, background: bad ? "var(--destructive)" : p.color }}
                      />
                    </span>
                    {p.label} {count}/{p.limit}
                  </span>
                );
              })}
            </div>
          </div>

          <label className="mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" /> Attach media
          </label>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="Paste an image or video URL…"
            className="psx-input mt-2 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Attach an image or video from Image Studio, Stock Gallery, or paste any public URL.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={publishNow}
              disabled={publishing || over || selected.size === 0}
              className="psx-btn-primary px-4 py-2 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : publishState === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {publishing ? "Publishing…" : publishState === "success" ? "Published!" : "Publish now"}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="psx-input px-3 py-2 text-sm"
              />
              <button
                onClick={scheduleAll}
                disabled={scheduling || !scheduleAt || selected.size === 0}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-[var(--psx-purple)] hover:text-[var(--psx-purple)] disabled:opacity-50"
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
        <section className="psx-card p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platforms
          </div>
          <div className="grid gap-2">
            {PLATFORMS.map((p) => {
              const active = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="flex items-center justify-between rounded-xl border-2 px-3 py-2 text-sm transition-all"
                  style={{
                    borderColor: active ? p.color : "var(--psx-border)",
                    background: active ? `color-mix(in srgb, ${p.color} 8%, transparent)` : "transparent",
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`psx-platform-icon ${p.psxClass}`}>
                      <BrandGlyph brand={p.brand} size={16} />
                    </span>
                    <span className="font-medium">{p.label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{p.limit}</span>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all"
                      style={{
                        borderColor: active ? p.color : "var(--psx-border)",
                        background: active ? p.color : "transparent",
                      }}
                    >
                      {active && <Check className="h-3 w-3 text-white" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live preview */}
        <section className="psx-card overflow-hidden">
          {selected.size > 0 ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-2">
                {PLATFORMS.filter((p) => selected.has(p.id)).map((p) => {
                  const isActive = previewPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPreviewPlatform(p.id)}
                      className="flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-xs transition-colors"
                      style={{
                        borderColor: isActive ? p.color : "transparent",
                        color: isActive ? p.color : "var(--psx-text-2)",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <BrandGlyph brand={p.brand} size={12} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="p-4">
                <PostPreview platform={previewPlatform} text={text} mediaUrl={mediaUrl} />
              </div>
            </>
          ) : (
            <div className="psx-empty m-3">
              <AtSign className="psx-empty-illustration mx-auto h-8 w-8" />
              <p className="mt-3 text-sm font-semibold">No platform selected</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose at least one platform to see a live preview.</p>
            </div>
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
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <span className={`psx-platform-icon ${P.psxClass}`} style={{ width: 32, height: 32 }}>
          <BrandGlyph brand={P.brand} size={16} />
        </span>
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
