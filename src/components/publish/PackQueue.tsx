import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Send, Loader2, Check, AlertTriangle, Trash2, CalendarClock, Scissors, Link2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandGlyph, type BrandKey } from "@/components/BrandIcon";
import {
  PLATFORM_LIMITS, autoChunk, splitChain, type Piece, type PublishPlatform,
} from "@/lib/pieces";
import { publishToX, publishToLinkedIn } from "@/lib/socialPublish.functions";
import { publishToFacebook, publishToInstagram, publishToThreads } from "@/lib/metaPublish.functions";
import { createScheduledPost } from "@/lib/calendar.functions";

export type QueuePlatform = "twitter" | "threads" | "linkedin" | "instagram" | "facebook";

const PUBLISHABLE: QueuePlatform[] = ["twitter", "threads", "linkedin", "instagram", "facebook"];

const BRAND: Record<QueuePlatform, BrandKey> = {
  twitter: "twitter",
  threads: "threads",
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
};

const LABEL: Record<QueuePlatform, string> = {
  twitter: "X (Twitter)",
  threads: "Threads",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
};

export interface QueueRow {
  id: string;
  platform: QueuePlatform;
  text: string;
  chain?: string[];
  mediaUrl: string;
  autoThread: boolean;
  status: "queued" | "publishing" | "published" | "failed" | "skipped";
  message?: string;
  url?: string;
  sourceFormat: string;
}

/** Map a generated piece onto a publishable platform row. */
export function rowsFromPieces(pieces: Piece[]): QueueRow[] {
  return pieces
    .filter((p) => !p.document || p.format === "carousel")
    .map((p, i) => {
      const platform: QueuePlatform =
        p.platform === "twitter" || p.platform === "threads" || p.platform === "linkedin" ||
        p.platform === "instagram" || p.platform === "facebook"
          ? p.platform
          : "linkedin";
      const row: QueueRow = {
        id: `${p.format}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        platform,
        text: p.text,
        mediaUrl: p.media?.[0] || "",
        autoThread: platform === "twitter",
        status: "queued",
        sourceFormat: p.format,
      };
      if (p.chain?.length) row.chain = p.chain;
      return row;
    });
}

export function PackQueue({
  rows,
  setRows,
  onClear,
}: {
  rows: QueueRow[];
  setRows: (updater: (prev: QueueRow[]) => QueueRow[]) => void;
  onClear: () => void;
}) {
  const { session } = useAuth();
  const authHeaders = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : ({} as any);
  const [running, setRunning] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [spacingMin, setSpacingMin] = useState(90);
  const [scheduling, setScheduling] = useState(false);

  const patch = (id: string, next: Partial<QueueRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const warnings = useMemo(() => {
    const list: string[] = [];
    rows.forEach((r) => {
      const limit = PLATFORM_LIMITS[r.platform as PublishPlatform];
      const overBy = r.text.length - limit;
      if (overBy > 0 && !(r.platform === "twitter" && r.autoThread)) {
        list.push(`${LABEL[r.platform]} post is ${overBy} chars over the ${limit} limit.`);
      }
      if (r.platform === "instagram" && !r.mediaUrl) {
        list.push("Instagram needs an image or video URL.");
      }
    });
    return list;
  }, [rows]);

  const publishRow = async (row: QueueRow): Promise<{ ok: boolean; message?: string; url?: string }> => {
    const isVideo = /\.(mp4|webm|mov)$/i.test(row.mediaUrl);
    const media = row.mediaUrl.trim();
    try {
      if (row.platform === "twitter") {
        const limit = PLATFORM_LIMITS.twitter;
        const parts =
          row.text.length > limit && row.autoThread ? autoChunk(row.text, limit) : [row.text.slice(0, limit)];
        let replyTo: string | undefined;
        let firstUrl: string | undefined;
        for (const [i, part] of parts.entries()) {
          const r: any = await publishToX({
            data: {
              text: part,
              mediaUrls: i === 0 && media && !isVideo ? [media] : [],
              ...(replyTo ? { inReplyToTweetId: replyTo } : {}),
            },
            ...authHeaders,
          } as any);
          if (r?.error) return { ok: false, message: r.error };
          replyTo = r?.tweetId;
          if (i === 0) firstUrl = r?.url;
        }
        return { ok: true, ...(firstUrl ? { url: firstUrl } : {}) };
      }

      if (row.platform === "threads") {
        const chain = row.chain?.length ? row.chain : [row.text];
        let parentId: string | undefined;
        let firstUrl: string | undefined;
        for (const post of chain) {
          const r: any = await publishToThreads({
            data: {
              text: post.slice(0, PLATFORM_LIMITS.threads),
              ...(media ? { mediaUrl: media, mediaType: isVideo ? "VIDEO" : "IMAGE" } : { mediaType: "TEXT" }),
              ...(parentId ? { replyToId: parentId } : {}),
            },
            ...authHeaders,
          } as any);
          if (r?.error) return { ok: false, message: r.error };
          // Response exposes the new post id as threadId/id — chain off it.
          parentId = r?.threadId || r?.id || parentId;
          if (!firstUrl) firstUrl = r?.url || r?.permalink;
        }
        return { ok: true, ...(firstUrl ? { url: firstUrl } : {}) };
      }


      if (row.platform === "linkedin") {
        const r: any = await publishToLinkedIn({
          data: {
            commentary: row.text.slice(0, PLATFORM_LIMITS.linkedin),
            ...(media ? { mediaUrl: media } : {}),
          },
          ...authHeaders,
        } as any);
        if (r?.error) return { ok: false, message: r.error };
        return { ok: true, ...(r?.url ? { url: r.url } : {}) };
      }

      if (row.platform === "instagram") {
        if (!media) return { ok: false, message: "Instagram requires media" };
        const r: any = await publishToInstagram({
          data: {
            caption: row.text.slice(0, PLATFORM_LIMITS.instagram),
            mediaUrl: media,
            mediaType: isVideo ? "REELS" : "IMAGE",
          },
          ...authHeaders,
        } as any);
        if (r?.error) return { ok: false, message: r.error };
        return { ok: true, ...(r?.url ? { url: r.url } : {}) };
      }

      const r: any = await publishToFacebook({
        data: {
          message: row.text,
          ...(media && !isVideo ? { imageUrl: media } : {}),
        },
        ...authHeaders,
      } as any);
      if (r?.error) return { ok: false, message: r.error };
      return { ok: true, ...(r?.url ? { url: r.url } : {}) };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Publish failed" };
    }
  };

  const publishAll = async (onlyFailed = false) => {
    if (!session) return toast.error("Please sign in");
    const targets = rows.filter((r) =>
      onlyFailed ? r.status === "failed" : r.status !== "published",
    );
    if (!targets.length) return toast.error("Nothing left to publish");
    setRunning(true);
    let ok = 0;
    for (const row of targets) {
      patch(row.id, { status: "publishing", message: undefined });
      // eslint-disable-next-line no-await-in-loop
      const res = await publishRow(row);
      if (res.ok) {
        ok++;
        patch(row.id, { status: "published", message: "Live", ...(res.url ? { url: res.url } : {}) });
      } else {
        patch(row.id, { status: "failed", ...(res.message ? { message: res.message } : {}) });
      }
    }
    setRunning(false);
    if (ok === targets.length) toast.success(`Published ${ok} post${ok === 1 ? "" : "s"}`);
    else toast.warning(`${ok}/${targets.length} published — retry the failed rows`);
  };

  const scheduleAll = async () => {
    if (!session) return toast.error("Please sign in");
    if (!scheduleAt) return toast.error("Pick a start date & time");
    setScheduling(true);
    const start = new Date(scheduleAt).getTime();
    let ok = 0;
    for (const [i, row] of rows.filter((r) => r.status !== "published").entries()) {
      const when = new Date(start + i * spacingMin * 60_000).toISOString();
      // eslint-disable-next-line no-await-in-loop
      const r: any = await createScheduledPost({
        data: {
          title: row.text.slice(0, 60),
          content: row.text,
          platform: row.platform as any,
          scheduled_for: when,
          ...(row.mediaUrl ? { media_url: row.mediaUrl } : {}),
        },
        ...authHeaders,
      } as any);
      if (r?.success) {
        ok++;
        patch(row.id, { status: "skipped", message: `Scheduled ${new Date(when).toLocaleString()}` });
      }
    }
    setScheduling(false);
    if (ok) toast.success(`Scheduled ${ok} post${ok === 1 ? "" : "s"}`);
    else toast.error("Nothing scheduled");
  };

  if (!rows.length) return null;

  const grouped = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.platform] = (acc[r.platform] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mb-5 rounded-2xl border border-primary/20 bg-primary/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Publish queue · {rows.length} post{rows.length === 1 ? "" : "s"}
          </h2>
          <p className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            {Object.entries(grouped).map(([p, n]) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5">
                <BrandGlyph brand={BRAND[p as QueuePlatform]} size={11} /> {n} × {LABEL[p as QueuePlatform]}
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => publishAll(false)}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-3.5 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Publish all
          </button>
          {rows.some((r) => r.status === "failed") && (
            <button
              onClick={() => publishAll(true)}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"
            >
              Retry failed
            </button>
          )}
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear queue
          </button>
        </div>
      </div>

      {/* Pre-flight */}
      {warnings.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-400">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" /> Fix before publishing
          </p>
          <ul className="list-disc space-y-0.5 pl-4">
            {warnings.slice(0, 6).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Rows */}
      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const limit = PLATFORM_LIMITS[row.platform as PublishPlatform];
          const len = row.text.length;
          const over = len > limit && !(row.platform === "twitter" && row.autoThread);
          const chunks = row.platform === "twitter" && row.autoThread && len > limit
            ? autoChunk(row.text, limit).length
            : 0;
          return (
            <div key={row.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={row.platform}
                  onChange={(e) => patch(row.id, { platform: e.target.value as QueuePlatform })}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-[11px] font-semibold"
                >
                  {PUBLISHABLE.map((p) => (
                    <option key={p} value={p}>{LABEL[p]}</option>
                  ))}
                </select>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <BrandGlyph brand={BRAND[row.platform]} size={10} /> from {row.sourceFormat}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    over
                      ? "bg-red-500/10 text-red-500"
                      : len > limit * 0.85
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {len.toLocaleString()} / {limit.toLocaleString()}
                </span>
                {row.chain?.length ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Link2 className="h-3 w-3" /> chain of {row.chain.length}
                  </span>
                ) : null}
                {row.platform === "twitter" && (
                  <label className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={row.autoThread}
                      onChange={(e) => patch(row.id, { autoThread: e.target.checked })}
                    />
                    <Scissors className="h-3 w-3" /> auto-thread{chunks ? ` (${chunks})` : ""}
                  </label>
                )}
                <span className="ml-auto flex items-center gap-1.5 text-[11px]">
                  {row.status === "publishing" && <><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Publishing…</>}
                  {row.status === "published" && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      {row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="underline">View post</a> : "Published"}
                    </span>
                  )}
                  {row.status === "failed" && (
                    <span className="max-w-[280px] truncate text-red-500" title={row.message}>
                      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />{row.message}
                    </span>
                  )}
                  {row.status === "skipped" && <span className="text-muted-foreground">{row.message}</span>}
                  <button
                    onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Remove from queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              <textarea
                value={row.text}
                onChange={(e) => {
                  const chain = splitChain(e.target.value);
                  patch(row.id, {
                    text: e.target.value,
                    ...(row.chain ? { chain: chain.length > 1 ? chain : [e.target.value] } : {}),
                  });
                }}
                rows={row.text.length > 600 ? 8 : 4}
                className="mt-2 w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-primary"
              />
              <input
                value={row.mediaUrl}
                onChange={(e) => patch(row.id, { mediaUrl: e.target.value })}
                placeholder="Optional media URL (required for Instagram)"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          );
        })}
      </div>

      {/* Schedule all */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs">
        <CalendarClock className="h-4 w-4 text-primary" />
        <span className="font-medium">Schedule the whole queue</span>
        <input
          type="datetime-local"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
          className="rounded-lg border border-input bg-background px-2 py-1"
        />
        <label className="flex items-center gap-1 text-muted-foreground">
          spaced
          <input
            type="number"
            min={0}
            max={2880}
            value={spacingMin}
            onChange={(e) => setSpacingMin(Number(e.target.value))}
            className="w-16 rounded-lg border border-input bg-background px-2 py-1"
          />
          min apart
        </label>
        <button
          onClick={scheduleAll}
          disabled={scheduling || !scheduleAt}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {scheduling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
          Schedule all
        </button>
      </div>
    </section>
  );
}
