import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Linkedin, Sparkles, Wand2, Copy, Check, Send, CalendarClock, Save, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { publishToLinkedIn } from "@/lib/socialPublish.functions";
import { LinkedInMediaPanel, type ComposerMedia } from "@/components/linkedin/LinkedInMediaPanel";
import { LinkedInPreview } from "@/components/linkedin/LinkedInPreview";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Composer — PostSpark" },
      { name: "description", content: "Draft, format and publish LinkedIn posts with images, video and documents directly from PostSpark." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LinkedInComposerPage,
});

const TEMPLATES: { id: string; name: string; emoji: string; body: string }[] = [
  {
    id: "thought-leadership",
    name: "Thought Leadership",
    emoji: "💡",
    body:
      "The best {topic} advice I ever got wasn't advice.\n\nIt was a question:\n\n\"What would you do if you weren't afraid?\"\n\nHere's what changed after I answered honestly:\n\n→ …\n→ …\n→ …\n\nWhat's the question that changed your career?",
  },
  {
    id: "launch",
    name: "Launch Announcement",
    emoji: "🚀",
    body:
      "After {timeframe} of building in silence, today we're shipping {product}.\n\nThe problem: …\nOur take: …\nWhat's inside: …\n\nGrateful to everyone who tested early. If this sounds useful, would love your feedback in the comments.",
  },
  {
    id: "hiring",
    name: "We're Hiring",
    emoji: "👥",
    body:
      "We're hiring a {role} at {company}.\n\nWhat you'll do:\n→ …\n→ …\n→ …\n\nWho we're looking for:\n→ …\n→ …\n\nRemote-friendly. Great team. Real impact. DM me or drop a 🙋 below.",
  },
  {
    id: "milestone",
    name: "Milestone",
    emoji: "🏆",
    body:
      "{milestone} today.\n\nA year ago this felt impossible.\n\nThree things that made the difference:\n\n1. …\n2. …\n3. …\n\nOnwards. 🚀",
  },
  {
    id: "story",
    name: "Personal Story",
    emoji: "📖",
    body:
      "5 years ago I …\n\nToday I …\n\nHere's what nobody tells you about the messy middle:\n\n→ …\n→ …\n→ …\n\nIf you're in the middle, keep going.",
  },
];

function hookScore(text: string): { score: number; tip: string } {
  const first = text.split("\n")[0] || "";
  let score = 0;
  if (first.length > 0 && first.length <= 90) score += 30;
  if (/[?]/.test(first)) score += 20;
  if (/\d/.test(first)) score += 15;
  if (text.split("\n\n").length >= 3) score += 20;
  if (text.length >= 800 && text.length <= 1900) score += 15;
  score = Math.min(100, score);
  const tip =
    score >= 80
      ? "Strong hook and structure — ship it."
      : first.length > 90
        ? "Shorten your first line — LinkedIn cuts it off around 210 characters."
        : "Add a question, a number, or more line breaks to lift reach.";
  return { score, tip };
}

function LinkedInComposerPage() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [media, setMedia] = useState<ComposerMedia[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [scheduledFor, setScheduledFor] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "publish" | "schedule" | "draft">(null);

  const publish = useServerFn(publishToLinkedIn);

  const chars = content.length;
  const hashtags = (content.match(/#\w+/g) || []).length;
  const emojis = (content.match(/\p{Extended_Pictographic}/gu) || []).length;
  const lines = content.split("\n").length;
  const { score, tip } = useMemo(() => hookScore(content), [content]);

  const applyTemplate = (body: string) => {
    setContent(body);
    toast.success("Template loaded — customize the bracketed parts");
  };

  const suggestHashtags = () => {
    const common = ["#Leadership", "#Marketing", "#Startups", "#AI", "#SaaS"];
    setContent((c) => c.trim() + "\n\n" + common.slice(0, 3).join(" "));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const buildPayload = (status: "published" | "draft" | "scheduled") => {
    const images = media.filter((m) => m.kind === "image");
    const video = media.find((m) => m.kind === "video");
    const doc = media.find((m) => m.kind === "document");
    let mediaKind: "none" | "images" | "video" | "document" | "article" = "none";
    let mediaItems: { path?: string; url?: string; altText?: string; title?: string }[] = [];
    if (video) {
      mediaKind = "video";
      mediaItems = [{ path: video.path, title: video.name }];
    } else if (doc) {
      mediaKind = "document";
      mediaItems = [{ path: doc.path, title: doc.name }];
    } else if (images.length > 0) {
      mediaKind = "images";
      mediaItems = images.map((m) => ({ path: m.path, altText: m.altText || "" }));
    } else if (linkUrl.trim()) {
      mediaKind = "article";
      mediaItems = [{ url: linkUrl.trim() }];
    }
    return {
      commentary: content.trim(),
      visibility,
      mediaKind,
      mediaItems,
      firstComment: firstComment.trim() || undefined,
      status,
      scheduledFor: status === "scheduled" ? new Date(scheduledFor).toISOString() : undefined,
    };
  };

  const run = async (status: "published" | "draft" | "scheduled") => {
    if (!content.trim()) return toast.error("Write something first");
    if (status === "scheduled" && !scheduledFor) return toast.error("Pick a date and time");
    setBusy(status === "published" ? "publish" : status === "scheduled" ? "schedule" : "draft");
    try {
      const res: any = await publish({ data: buildPayload(status) });
      if (res?.error) throw new Error(res.error);
      if (status === "published") {
        toast.success(res?.url ? "Published to LinkedIn" : "Published");
        if (res?.firstCommentError) toast.warning(res.firstCommentError);
      } else if (status === "scheduled") {
        toast.success("Scheduled");
      } else {
        toast.success("Saved as draft");
      }
    } catch (e: any) {
      toast.error(e?.message || "Publishing failed");
    } finally {
      setBusy(null);
    }
  };

  const btnBase =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2]/10">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">LinkedIn Composer</h1>
          <p className="text-xs text-muted-foreground">
            Text, images, video and PDF carousels — publish, schedule or save as a draft.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px_300px]">
        {/* Editor */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Your post</label>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{chars} / 3000</span>
              <span>{lines} lines</span>
              <span>{hashtags} tags</span>
              <span>{emojis} emojis</span>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 3000))}
            rows={14}
            placeholder="Start typing, or pick a template on the right →"
            className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40"
          />

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Media
            </p>
            <LinkedInMediaPanel media={media} onChange={setMedia} />
          </div>

          {media.length === 0 && (
            <div className="mt-4">
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Link2 className="h-3 w-3" /> Link preview (optional)
              </label>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              First comment (great place for links)
            </label>
            <textarea
              value={firstComment}
              onChange={(e) => setFirstComment(e.target.value.slice(0, 1250))}
              rows={2}
              placeholder="Drop your link here so the post itself keeps full reach…"
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "CONNECTIONS")}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="PUBLIC">Anyone</option>
              <option value="CONNECTIONS">Connections only</option>
            </select>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => run("published")}
              disabled={!!busy || !content.trim()}
              className={`${btnBase} bg-[#0A66C2] px-4 text-white hover:bg-[#0956a8]`}
            >
              {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publish now
            </button>
            <button
              onClick={() => run("scheduled")}
              disabled={!!busy || !content.trim()}
              className={`${btnBase} border border-border text-foreground hover:bg-accent`}
            >
              {busy === "schedule" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
              Schedule
            </button>
            <button
              onClick={() => run("draft")}
              disabled={!!busy || !content.trim()}
              className={`${btnBase} border border-border text-foreground hover:bg-accent`}
            >
              {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save draft
            </button>
            <button onClick={copy} disabled={!content.trim()} className={`${btnBase} border border-border text-foreground hover:bg-accent`}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
            </button>
            <button onClick={suggestHashtags} disabled={!content.trim()} className={`${btnBase} border border-border text-foreground hover:bg-accent`}>
              <Wand2 className="h-3.5 w-3.5" /> Suggest hashtags
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live LinkedIn preview
          </p>
          <LinkedInPreview
            content={content}
            media={media}
            firstComment={firstComment}
            authorName={(user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "Your name"}
            authorHeadline="Posting with PostSpark"
            avatarUrl={(user?.user_metadata as any)?.avatar_url || null}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Hook strength</h2>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#0A66C2] transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{score}/100 — {tip}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0A66C2]" />
              <h2 className="text-sm font-semibold text-foreground">Templates</h2>
            </div>
            <div className="mt-3 space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.body)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-[#0A66C2] hover:bg-[#0A66C2]/5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span>{t.emoji}</span> {t.name}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {t.body.split("\n")[0]}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
              💡 Tip: Posts with 3+ line breaks and 1200–1800 chars typically get the best reach.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
