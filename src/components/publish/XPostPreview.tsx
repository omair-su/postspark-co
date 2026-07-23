import { useMemo } from "react";
import { Heart, MessageCircle, Repeat2, BarChart3, Bookmark, Share, BadgeCheck } from "lucide-react";

interface Props {
  handle?: string;
  displayName?: string;
  avatarUrl?: string | null;
  text: string;
  mediaUrls: string[];
  mediaTypes?: ("image" | "video")[];
  replyText?: string | null;
}

/**
 * Renders a live, high-fidelity mock of how the tweet(s) will appear on X.
 * Uses on-brand PostSpark surfaces (dark card) rather than exact X colors,
 * but mirrors the exact layout: avatar, handle, body, media grid, actions.
 */
export function XPostPreview({
  handle = "you",
  displayName = "You",
  avatarUrl,
  text,
  mediaUrls,
  mediaTypes = [],
  replyText,
}: Props) {
  const linkified = useMemo(() => renderWithLinks(text), [text]);
  const replyLinkified = useMemo(() => (replyText ? renderWithLinks(replyText) : null), [replyText]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <TweetCard
        handle={handle}
        displayName={displayName}
        avatarUrl={avatarUrl}
        body={linkified}
        mediaUrls={mediaUrls}
        mediaTypes={mediaTypes}
      />
      {replyText ? (
        <div className="border-t border-border">
          <div className="px-4 pt-3 text-xs text-muted-foreground">Replying to @{handle}</div>
          <TweetCard
            handle={handle}
            displayName={displayName}
            avatarUrl={avatarUrl}
            body={replyLinkified!}
            mediaUrls={[]}
            mediaTypes={[]}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}

function TweetCard({
  handle,
  displayName,
  avatarUrl,
  body,
  mediaUrls,
  mediaTypes,
  compact,
}: {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  body: React.ReactNode;
  mediaUrls: string[];
  mediaTypes: ("image" | "video")[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "p-3" : "p-4"}>
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-sm font-semibold bg-primary/20 text-primary">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold truncate">{displayName}</span>
            <BadgeCheck className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground truncate">@{handle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">now</span>
          </div>
          <div className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-6">
            {body}
          </div>
          {mediaUrls.length > 0 ? (
            <MediaGrid urls={mediaUrls} types={mediaTypes} />
          ) : null}
          <div className="mt-3 flex max-w-md items-center justify-between text-muted-foreground text-xs">
            <Action icon={<MessageCircle className="h-4 w-4" />} label="0" />
            <Action icon={<Repeat2 className="h-4 w-4" />} label="0" />
            <Action icon={<Heart className="h-4 w-4" />} label="0" />
            <Action icon={<BarChart3 className="h-4 w-4" />} label="0" />
            <div className="flex items-center gap-3">
              <Bookmark className="h-4 w-4" />
              <Share className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Action({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MediaGrid({ urls, types }: { urls: string[]; types: ("image" | "video")[] }) {
  if (urls.length === 0) return null;
  const gridCls =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
      ? "grid-cols-2"
      : "grid-cols-2";
  return (
    <div className={`mt-3 grid ${gridCls} gap-1 overflow-hidden rounded-2xl border border-border`}>
      {urls.slice(0, 4).map((u, i) => {
        const t = types[i] ?? (u.match(/\.(mp4|mov|webm)(\?|$)/i) ? "video" : "image");
        return (
          <div key={i} className="relative aspect-video bg-muted">
            {t === "video" ? (
              <video src={u} className="h-full w-full object-cover" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u} alt={`Media ${i + 1}`} className="h-full w-full object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Highlight URLs, @mentions, and #hashtags for a tweet-authentic look.
function renderWithLinks(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(https?:\/\/\S+|@[A-Za-z0-9_]+|#[A-Za-z0-9_]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={idx++} className="text-primary">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
