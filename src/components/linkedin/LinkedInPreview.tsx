import { useState } from "react";
import { Globe, ThumbsUp, MessageSquare, Repeat2, Send, FileText } from "lucide-react";
import type { ComposerMedia } from "./LinkedInMediaPanel";

interface Props {
  content: string;
  media: ComposerMedia[];
  authorName?: string;
  authorHeadline?: string;
  avatarUrl?: string | null;
  firstComment?: string;
}

/** Pixel-close approximation of a LinkedIn feed card, including the
 *  "…see more" truncation at ~210 characters. */
export function LinkedInPreview({
  content,
  media,
  authorName = "Your name",
  authorHeadline = "Your headline",
  avatarUrl,
  firstComment,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const truncated = content.length > 210 && !expanded;
  const shown = truncated ? content.slice(0, 210) + "…" : content;
  const images = media.filter((m) => m.kind === "image");
  const video = media.find((m) => m.kind === "video");
  const doc = media.find((m) => m.kind === "document");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-2.5 p-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {authorName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{authorName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{authorHeadline}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            now · <Globe className="h-3 w-3" />
          </p>
        </div>
      </div>

      <div className="px-3 pb-3 text-sm leading-relaxed text-foreground">
        <span className="whitespace-pre-wrap">{shown || "Your post preview appears here…"}</span>
        {truncated && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1 text-[13px] font-medium text-muted-foreground hover:underline"
          >
            see more
          </button>
        )}
      </div>

      {video && (
        <video src={video.url} controls playsInline className="max-h-[420px] w-full bg-black object-contain" />
      )}

      {!video && doc && (
        <div className="flex items-center gap-3 border-y border-border bg-muted/40 px-4 py-6">
          <FileText className="h-8 w-8 text-[#0A66C2]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{doc.name}</p>
            <p className="text-[11px] text-muted-foreground">Document carousel · swipe on LinkedIn</p>
          </div>
        </div>
      )}

      {!video && !doc && images.length > 0 && (
        <div
          className={
            images.length === 1
              ? "block"
              : images.length === 2
                ? "grid grid-cols-2 gap-0.5"
                : "grid grid-cols-2 gap-0.5"
          }
        >
          {images.slice(0, 4).map((m, i) => (
            <div key={m.path + i} className="relative">
              <img
                src={m.url}
                alt={m.altText || ""}
                className={`w-full object-cover ${images.length === 1 ? "max-h-[480px]" : "h-40"}`}
              />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold text-white">
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[12px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> Like</span>
        <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Comment</span>
        <span className="inline-flex items-center gap-1.5"><Repeat2 className="h-4 w-4" /> Repost</span>
        <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" /> Send</span>
      </div>

      {firstComment?.trim() && (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            First comment
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-foreground">{firstComment}</p>
        </div>
      )}
    </div>
  );
}
