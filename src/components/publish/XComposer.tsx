import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarIcon,
  Clock,
  Link2,
  Loader2,
  ListOrdered,
  Send,
  Sparkles,
  Vote,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  publishToX,
  scheduleXPost,
  getConnectedSocials,
  getXAuthUrl,
  getXPublishStats,
  generateXThread,
  publishXThread,
  getBestPostingTimes,
} from "@/lib/socialPublish.functions";
import { XMediaPicker } from "./XMediaPicker";
import { XPostPreview } from "./XPostPreview";

const X_LIMIT_STANDARD = 280;
const URL_REGEX = /https?:\/\/\S+/gi;

interface Props {
  initialText?: string;
  initialMedia?: string[];
  repurposeJobId?: string;
}

export function XComposer({ initialText = "", initialMedia = [], repurposeJobId }: Props) {
  const nav = useNavigate();
  const [text, setText] = useState(initialText);
  const [replyText, setReplyText] = useState("");
  const [threadMode, setThreadMode] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialMedia);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [scheduleFor, setScheduleFor] = useState<string>(""); // ISO local
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<{
    username?: string;
    connected: boolean;
    loading: boolean;
  }>({ connected: false, loading: true });
  const [tier, setTier] = useState<"free" | "pro" | "agency">("pro");
  const [monthlyUsed, setMonthlyUsed] = useState(0);

  // Poll state
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollHours, setPollHours] = useState(24);

  // Auto-thread state
  const [autoThread, setAutoThread] = useState<string[] | null>(null);
  const [threadBusy, setThreadBusy] = useState(false);

  // Best-time suggestions
  const [bestTimes, setBestTimes] = useState<Array<{ day: number; hour: number; label: string; source: string }>>([]);

  const doPublish = useServerFn(publishToX);
  const doSchedule = useServerFn(scheduleXPost);
  const doConnected = useServerFn(getConnectedSocials);
  const doAuthUrl = useServerFn(getXAuthUrl);
  const doStats = useServerFn(getXPublishStats);
  const doGenThread = useServerFn(generateXThread);
  const doPublishThread = useServerFn(publishXThread);
  const doBestTimes = useServerFn(getBestPostingTimes);

  // Load connection state + best times
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [r, s, b]: any = await Promise.all([
          doConnected({}),
          doStats({}),
          doBestTimes({ data: { platform: "twitter" } }),
        ]);
        if (!alive) return;
        const tw = (r?.accounts || []).find((a: any) => a.platform === "twitter");
        setConnection({
          connected: !!tw,
          username: tw?.platform_username,
          loading: false,
        });
        if (s?.tier) setTier(s.tier);
        if (typeof s?.monthlyPublished === "number") setMonthlyUsed(s.monthlyPublished);
        if (Array.isArray(b?.suggestions)) setBestTimes(b.suggestions);
      } catch {
        if (alive) setConnection({ connected: false, loading: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, [doConnected, doStats, doBestTimes]);

  const isFree = tier === "free";
  const monthlyRemaining = isFree ? Math.max(0, 5 - monthlyUsed) : null;
  const outOfFreeQuota = isFree && monthlyRemaining !== null && monthlyRemaining <= 0;

  // Detect URLs, offer link-in-reply if a URL exists in main text.
  const detectedUrls = useMemo(() => text.match(URL_REGEX) || [], [text]);
  const hasUrl = detectedUrls.length > 0;

  // Compute what actually posts: when threadMode is on and a URL exists,
  // strip URLs from the first tweet and put them in the reply.
  const { firstText, threadReply } = useMemo(() => {
    if (!threadMode || !hasUrl) return { firstText: text, threadReply: replyText || null };
    const stripped = text.replace(URL_REGEX, "").replace(/\s+/g, " ").trim();
    const link = detectedUrls[0];
    const auto = replyText.trim() || `More: ${link}`;
    return { firstText: stripped, threadReply: auto };
  }, [threadMode, hasUrl, text, replyText, detectedUrls]);

  const charCount = firstText.length;
  const overLimit = charCount > X_LIMIT_STANDARD;
  const nearLimit = charCount > X_LIMIT_STANDARD - 20 && !overLimit;
  const freeBlocksMedia = isFree && mediaUrls.length > 0;
  const canSubmit =
    !busy &&
    connection.connected &&
    firstText.trim().length > 0 &&
    !overLimit &&
    !outOfFreeQuota &&
    !freeBlocksMedia &&
    (!threadReply || threadReply.length <= 280);

  const handleConnect = async () => {
    try {
      const r: any = await doAuthUrl({});
      if (r?.url) window.location.href = r.url;
      else toast.error(r?.error || "Could not start X connect");
    } catch (e: any) {
      toast.error(e?.message || "Could not start X connect");
    }
  };

  const buildPoll = () => {
    if (!pollEnabled) return undefined;
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return undefined;
    return { options: opts.slice(0, 4), durationMinutes: Math.max(5, Math.min(10080, pollHours * 60)) };
  };

  const doPostNow = async () => {
    setBusy(true);
    try {
      // Thread mode overrides — publishes the whole chain in one shot.
      if (autoThread && autoThread.length >= 2) {
        const t: any = await doPublishThread({
          data: {
            tweets: autoThread,
            mediaUrls: pollEnabled ? [] : mediaUrls,
            altTexts,
            repurposeJobId,
          },
        });
        if (t?.error) {
          toast.error(t.error);
          return;
        }
        toast.success(`Thread posted (${autoThread.length} tweets)`);
        if (t?.url) window.open(t.url, "_blank", "noopener");
        setText("");
        setAutoThread(null);
        setMediaUrls([]);
        setAltTexts([]);
        nav({ to: "/dashboard/calendar" }).catch(() => {});
        return;
      }

      const first: any = await doPublish({
        data: {
          text: firstText,
          mediaUrls: pollEnabled ? [] : mediaUrls,
          altTexts: pollEnabled ? [] : altTexts,
          repurposeJobId,
          poll: buildPoll(),
        },
      });
      if (first?.error) {
        toast.error(first.error);
        return;
      }
      const tweetId = first?.tweetId as string | undefined;
      if (threadReply && tweetId) {
        const reply: any = await doPublish({
          data: {
            text: threadReply,
            mediaUrls: [],
            inReplyToTweetId: tweetId,
          },
        });
        if (reply?.error) {
          toast.warning(`Main tweet posted, but reply failed: ${reply.error}`);
        }
      }
      toast.success("Posted to X!");
      if (first?.url) window.open(first.url, "_blank", "noopener");
      // Reset composer
      setText("");
      setReplyText("");
      setMediaUrls([]);
      setAltTexts([]);
      setPollEnabled(false);
      setPollOptions(["", ""]);
      nav({ to: "/dashboard/calendar" }).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  const doGenerateThread = async () => {
    if (text.trim().length < 50) {
      toast.error("Add at least 50 characters of text to generate a thread.");
      return;
    }
    setThreadBusy(true);
    try {
      const r: any = await doGenThread({ data: { text, maxTweets: 10 } });
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      if (Array.isArray(r?.tweets) && r.tweets.length >= 2) {
        setAutoThread(r.tweets);
        toast.success(`Generated ${r.tweets.length}-tweet thread`);
      } else {
        toast.error("Could not split text into a thread.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Thread generation failed");
    } finally {
      setThreadBusy(false);
    }
  };

  const applyBestTime = (day: number, hour: number) => {
    // Set schedule to the next matching weekday+hour in local time.
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, 0, 0, 0);
    const diff = (day - now.getDay() + 7) % 7;
    target.setDate(now.getDate() + (diff === 0 && target.getTime() < now.getTime() ? 7 : diff));
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
    setScheduleFor(local);
  };

  const doScheduleSubmit = async () => {
    if (!scheduleFor) {
      toast.error("Pick a date and time first");
      return;
    }
    const iso = new Date(scheduleFor).toISOString();
    if (new Date(iso).getTime() < Date.now() + 60_000) {
      toast.error("Schedule at least 1 minute in the future");
      return;
    }
    setBusy(true);
    try {
      const out: any = await doSchedule({
        data: {
          text: firstText + (threadReply ? `\n\n---\n${threadReply}` : ""),
          mediaUrls,
          scheduledFor: iso,
          repurposeJobId,
        },
      });
      if (out?.error) {
        toast.error(out.error);
        return;
      }
      toast.success("Scheduled");
      nav({ to: "/dashboard/calendar" }).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || "Failed to schedule");
    } finally {
      setBusy(false);
    }
  };

  const costEstimate = hasUrl && !threadMode ? "≈ $0.20" : "≈ $0.015";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Composer column */}
      <div className="space-y-4">
        {!connection.loading && !connection.connected ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Connect your X account to post
            </div>
            <p className="mb-3 text-muted-foreground">
              We use official X OAuth 2.0 — PostSpark never sees your password.
            </p>
            <Button onClick={handleConnect} size="sm">
              Connect X (Twitter) →
            </Button>
          </div>
        ) : null}

        {isFree ? (
          <div className={`rounded-xl border p-3 text-sm ${outOfFreeQuota ? "border-red-500/40 bg-red-500/10" : "border-amber-500/30 bg-amber-500/5"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  Free plan · {monthlyUsed}/5 X posts this month
                </div>
                <p className="text-xs text-muted-foreground">
                  {outOfFreeQuota
                    ? "Monthly limit reached. Upgrade to Pro for unlimited posts."
                    : "Text-only posts on Free. Media attachments and scheduling require Pro."}
                </p>
              </div>
              <a
                href="/pricing"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Upgrade
              </a>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Posting as {connection.username ? `@${connection.username}` : "your X account"}</span>
            <span className={overLimit ? "text-destructive" : nearLimit ? "text-amber-500" : ""}>
              {charCount}/{X_LIMIT_STANDARD}
            </span>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            rows={6}
            className="resize-none border-none bg-transparent p-0 text-base focus-visible:ring-0"
          />

          {hasUrl ? (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1">
                <div className="font-medium">Link detected</div>
                <p className="text-muted-foreground">
                  Posts containing URLs cost more on X ($0.20 vs $0.015). Enable link-in-reply to keep the main tweet cheap
                  and move the URL to a threaded reply.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Switch id="thread" checked={threadMode} onCheckedChange={setThreadMode} />
                <Label htmlFor="thread" className="cursor-pointer text-xs">
                  Link in reply
                </Label>
              </div>
            </div>
          ) : null}

          {threadMode && hasUrl ? (
            <div className="mt-3 rounded-lg border border-dashed border-border p-3">
              <Label className="text-xs text-muted-foreground">Reply tweet (with link)</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`More: ${detectedUrls[0]}`}
                rows={2}
                className="mt-1 resize-none"
              />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">
                {(replyText || `More: ${detectedUrls[0]}`).length}/280
              </div>
            </div>
          ) : null}
        </div>

        {!pollEnabled ? (
          <>
            <XMediaPicker selected={mediaUrls} onChange={setMediaUrls} max={4} />
            {mediaUrls.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ListOrdered className="h-4 w-4" /> Alt text (accessibility)
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Describe each image for screen readers. Improves reach and is required for WCAG.
                </p>
                <div className="space-y-2">
                  {mediaUrls.map((url, i) => (
                    <div key={url + i} className="flex items-start gap-2">
                      <img src={url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                      <Input
                        value={altTexts[i] || ""}
                        maxLength={1000}
                        onChange={(e) => {
                          const next = [...altTexts];
                          next[i] = e.target.value;
                          setAltTexts(next);
                        }}
                        placeholder={`Describe image ${i + 1}…`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {/* Poll composer */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Vote className="h-4 w-4" /> Poll {pollEnabled ? "" : "(optional)"}
            </div>
            <div className="flex items-center gap-2">
              <Switch id="poll" checked={pollEnabled} onCheckedChange={setPollEnabled} />
              <Label htmlFor="poll" className="cursor-pointer text-xs">
                Enable
              </Label>
            </div>
          </div>
          {pollEnabled ? (
            <div className="space-y-2">
              {pollOptions.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={o}
                    maxLength={25}
                    placeholder={`Option ${i + 1}`}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                  />
                  {pollOptions.length > 2 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove option ${i + 1}`}
                      onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {pollOptions.length < 4 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                  >
                    + Add option
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Max 4 options</span>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Duration</span>
                  <select
                    value={pollHours}
                    onChange={(e) => setPollHours(Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-2 py-1"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>1 day</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                  </select>
                </div>
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">Polls can't be combined with media.</p>
            </div>
          ) : null}
        </div>

        {/* Auto-thread generator */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ListOrdered className="h-4 w-4" /> Auto-thread from long content
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={doGenerateThread}
              disabled={threadBusy || text.trim().length < 50}
            >
              {threadBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
              {autoThread ? "Regenerate" : "Split into thread"}
            </Button>
          </div>
          {!autoThread ? (
            <p className="text-xs text-muted-foreground">
              Paste a blog post or long note above (50+ chars) and we'll split it into a numbered X thread.
            </p>
          ) : (
            <div className="space-y-2">
              {autoThread.map((t, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-2 text-xs">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Tweet {i + 1}/{autoThread.length}</span>
                    <span>{t.length}/280</span>
                  </div>
                  <Textarea
                    value={t}
                    rows={2}
                    onChange={(e) => {
                      const next = [...autoThread];
                      next[i] = e.target.value.slice(0, 280);
                      setAutoThread(next);
                    }}
                    className="resize-none border-none bg-transparent p-0 text-[13px] focus-visible:ring-0"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoThread(null)}
                className="text-xs text-muted-foreground"
              >
                Cancel thread mode
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <CalendarIcon className="h-4 w-4" /> Schedule (optional)
          </div>
          <Input
            type="datetime-local"
            value={scheduleFor}
            onChange={(e) => setScheduleFor(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
          />
          {bestTimes.length ? (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                Best times{" "}
                <span className="text-[10px] opacity-70">
                  ({bestTimes[0]?.source === "personal" ? "based on your posts" : "platform defaults"})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bestTimes.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyBestTime(b.day, b.hour)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:border-primary hover:text-primary"
                  >
                    <Clock className="h-3 w-3" /> {b.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">
            <div>
              <Sparkles className="mr-1 inline h-3 w-3" /> Estimated X API cost: <span className="font-medium">{costEstimate}</span>
            </div>
            <div>Max 4 images per tweet · Videos coming soon</div>
          </div>
          <div className="flex gap-2">
            {scheduleFor ? (
              <Button onClick={doScheduleSubmit} disabled={!canSubmit || busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                Schedule
              </Button>
            ) : (
              <Button onClick={doPostNow} disabled={!canSubmit || busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Post now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview column */}
      <div className="space-y-3 lg:sticky lg:top-6 lg:h-fit">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <XIcon className="h-3 w-3" /> Live preview
        </div>
        <XPostPreview
          handle={connection.username || "you"}
          displayName={connection.username || "You"}
          text={firstText || "Your tweet preview will appear here."}
          mediaUrls={mediaUrls}
          replyText={threadReply}
        />
      </div>
    </div>
  );
}
