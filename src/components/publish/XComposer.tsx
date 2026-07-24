import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Link2,
  Loader2,
  Send,
  Sparkles,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { publishToX, scheduleXPost, getConnectedSocials, getXAuthUrl } from "@/lib/socialPublish.functions";
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
  const [scheduleFor, setScheduleFor] = useState<string>(""); // ISO local
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<{
    username?: string;
    connected: boolean;
    loading: boolean;
  }>({ connected: false, loading: true });

  const doPublish = useServerFn(publishToX);
  const doSchedule = useServerFn(scheduleXPost);
  const doConnected = useServerFn(getConnectedSocials);
  const doAuthUrl = useServerFn(getXAuthUrl);

  // Load connection state
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r: any = await doConnected({});
        if (!alive) return;
        const tw = (r?.accounts || []).find((a: any) => a.platform === "twitter");
        setConnection({
          connected: !!tw,
          username: tw?.platform_username,
          loading: false,
        });
      } catch {
        if (alive) setConnection({ connected: false, loading: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, [doConnected]);

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
  const canSubmit =
    !busy &&
    connection.connected &&
    firstText.trim().length > 0 &&
    !overLimit &&
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

  const doPostNow = async () => {
    setBusy(true);
    try {
      const first: any = await doPublish({
        data: {
          text: firstText,
          mediaUrls,
          repurposeJobId,
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
      nav({ to: "/dashboard/calendar" }).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || "Failed to post");
    } finally {
      setBusy(false);
    }
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
          text: firstText,
          replyText: threadReply || undefined,
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

        <XMediaPicker selected={mediaUrls} onChange={setMediaUrls} max={4} />

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
