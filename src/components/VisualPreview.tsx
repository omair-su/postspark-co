import { useState } from "react";
import {
  Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, ThumbsUp,
  Globe, Music, Mail, Copy, Check, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { parsePieces, limitFor, type Piece } from "@/lib/pieces";
import { BrandGlyph, type BrandKey } from "@/components/BrandIcon";

type Platform = "twitter" | "threads" | "linkedin" | "instagram" | "facebook" | "tiktok" | "email" | "doc";

function chromeFor(piece: Piece): Platform {
  if (piece.format === "tweets") return "twitter";
  if (piece.format === "thread") return "threads";
  if (piece.format === "linkedin") return "linkedin";
  if (piece.format === "instagram") return "instagram";
  if (piece.format === "facebook") return "facebook";
  if (piece.format === "tiktok") return "tiktok";
  if (piece.format === "email") return "email";
  return "doc";
}

const BRAND_FOR: Record<string, BrandKey> = {
  tweets: "tweets",
  thread: "thread",
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
};

interface Props {
  typeId: string;
  content: string;
  /** Optional label override, e.g. "Tweets". */
  label?: string;
}

/**
 * One generated post = exactly ONE preview card. Never splits a single post
 * into fragments — segmentation comes from `parsePieces`, not from guessing.
 */
export function VisualPreview({ typeId, content, label }: Props) {
  const pieces = parsePieces(typeId, content);

  if (!pieces.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Nothing to preview yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider">
          {pieces.length} {pieces.length === 1 ? "post" : "posts"} {label ? `· ${label}` : ""}
        </span>
        <span>Each card is one complete, publishable post</span>
      </div>
      {pieces.map((piece) => (
        <PieceCard key={piece.id} piece={piece} />
      ))}
    </div>
  );
}

function PieceCard({ piece }: { piece: Piece }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "You";
  const handle = (user?.email || "you").split("@")[0]!;
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const chrome = chromeFor(piece);
  const limit = limitFor(piece.platform);
  const len = piece.text.length;
  const pct = Math.min(100, Math.round((len / limit) * 100));
  const state = len > limit ? "over" : pct > 85 ? "near" : "ok";
  const brand = BRAND_FOR[piece.format];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(piece.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-transparent p-3 shadow-sm">
      {/* Card meta bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
          {brand ? <BrandGlyph brand={brand} size={12} /> : <FileText className="h-3 w-3" />}
          {piece.total > 1 ? `Post ${piece.index} of ${piece.total}` : piece.document ? "Full document" : "Post"}
        </span>
        {!piece.document && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              state === "over"
                ? "bg-red-500/10 text-red-500"
                : state === "near"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <span className="relative inline-block h-2 w-2 rounded-full bg-current" />
            {len.toLocaleString()} / {limit.toLocaleString()}
          </span>
        )}
        <button
          onClick={copy}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy post</>}
        </button>
      </div>

      {chrome === "twitter" && <TwitterCard name={name} handle={handle} avatar={avatar} text={piece.text} />}
      {chrome === "threads" && <ThreadsCard handle={handle} avatar={avatar} piece={piece} />}
      {chrome === "linkedin" && <LinkedInCard name={name} avatar={avatar} text={piece.text} />}
      {chrome === "instagram" && <InstagramCard handle={handle} avatar={avatar} text={piece.text} />}
      {chrome === "facebook" && <FacebookCard name={name} avatar={avatar} text={piece.text} />}
      {chrome === "tiktok" && <TikTokCard handle={handle} avatar={avatar} text={piece.text} />}
      {chrome === "email" && <EmailCard name={name} text={piece.text} />}
      {chrome === "doc" && <DocCard format={piece.format} text={piece.text} />}
    </div>
  );
}

/* ------------------------------------------------------------------ chrome */

function Avatar({ avatar, name, size = 40 }: { avatar?: string; name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  if (avatar) {
    return <img src={avatar} alt="" style={{ width: size, height: size }} className="flex-shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-bold text-primary-foreground"
    >
      {initial}
    </div>
  );
}

function DocCard({ format, text }: { format: string; text: string }) {
  const slides = format === "carousel" ? splitSlides(text) : null;
  if (slides && slides.length > 1) return <CarouselCard slides={slides} />;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
        <FileText className="h-3.5 w-3.5 text-zinc-500" />
        <span className="font-semibold capitalize">{format}</span>
      </div>
      <div className="max-h-[520px] overflow-auto p-5">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function splitSlides(text: string): string[] {
  const parts = text
    .split(/\n(?=\s*slide\s*\d{1,2}\s*[:.)-]?)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [text];
}

function CarouselCard({ slides }: { slides: string[] }) {
  const [i, setI] = useState(0);
  const slide = slides[Math.min(i, slides.length - 1)] ?? "";
  return (
    <div className="rounded-xl border border-border bg-white p-4 text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 via-primary-glow/10 to-primary/5 p-6">
        <p className="whitespace-pre-wrap text-center text-[15px] font-semibold leading-snug">{slide}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          className="rounded-lg border border-border px-2 py-1 disabled:opacity-40"
          disabled={i === 0}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="font-semibold">Slide {i + 1} / {slides.length}</span>
        <button
          onClick={() => setI((v) => Math.min(slides.length - 1, v + 1))}
          className="rounded-lg border border-border px-2 py-1 disabled:opacity-40"
          disabled={i >= slides.length - 1}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmailCard({ name, text }: { name: string; text: string }) {
  // Keep the WHOLE email in one card: subject options + preview text + body.
  const subjectMatch = text.match(/^\s*(?:subject(?:\s+line)?(?:\s+options)?)\s*:?\s*(.*)$/im);
  const firstLine = text.split("\n").find((l) => l.trim())?.trim() || "";
  const headline =
    (subjectMatch?.[1]?.trim() || firstLine).replace(/^★\s*/, "").slice(0, 120) || "Your newsletter";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
        <Mail className="h-3.5 w-3.5 text-zinc-500" />
        <span className="font-semibold">Inbox</span>
        <span className="ml-auto text-zinc-500">9:24 AM</span>
      </div>
      <div className="px-5 pt-4">
        <div className="text-base font-bold leading-snug">{headline}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{name}</span>
          <span>· to me</span>
        </div>
      </div>
      <div className="max-h-[560px] overflow-auto px-5 pb-5 pt-3">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function ThreadsCard({ handle, avatar, piece }: { handle: string; avatar?: string; piece: Piece }) {
  const chain = piece.chain?.length ? piece.chain : [piece.text];
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      {chain.map((post, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Avatar avatar={avatar} name={handle} size={36} />
            {i < chain.length - 1 && <div className="my-1 w-[2px] flex-1 rounded bg-zinc-200 dark:bg-zinc-700" />}
          </div>
          <div className={`min-w-0 flex-1 ${i < chain.length - 1 ? "pb-4" : ""}`}>
            <div className="flex items-center gap-1 text-sm">
              <span className="truncate font-bold">{handle}</span>
              <span className="truncate text-zinc-500">· {i === 0 ? "2m" : "1m"}</span>
              <MoreHorizontal className="ml-auto h-4 w-4 text-zinc-500" />
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-snug">{post}</p>
            <div className="mt-2 flex items-center gap-5 text-zinc-500">
              <Heart className="h-4 w-4" />
              <MessageCircle className="h-4 w-4" />
              <Repeat2 className="h-4 w-4" />
              <Send className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
      {chain.length > 1 && (
        <p className="mt-3 border-t border-zinc-200 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800">
          Connected chain · {chain.length} posts publish as one thread
        </p>
      )}
    </div>
  );
}

function TikTokCard({ handle, avatar, text }: { handle: string; avatar?: string; text: string }) {
  return (
    <div className="relative mx-auto max-w-[300px] overflow-hidden rounded-2xl bg-black text-white shadow-xl" style={{ aspectRatio: "9 / 16" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/40 via-cyan-400/20 to-black" />
      <div className="absolute bottom-20 right-3 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center text-[11px]">
          <Avatar avatar={avatar} name={handle} size={44} />
          <div className="-mt-2 h-5 w-5 rounded-full bg-pink-500 text-center text-xs font-bold leading-5">+</div>
        </div>
        <div className="flex flex-col items-center text-[11px]"><Heart className="h-7 w-7" /> 84.2K</div>
        <div className="flex flex-col items-center text-[11px]"><MessageCircle className="h-7 w-7" /> 1.2K</div>
        <div className="flex flex-col items-center text-[11px]"><Send className="h-7 w-7" /> Share</div>
        <Music className="h-6 w-6 animate-pulse" />
      </div>
      <div className="absolute inset-x-3 bottom-3 right-16 max-h-[65%] overflow-auto">
        <div className="text-sm font-bold">@{handle}</div>
        <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-snug text-white/95">{text}</p>
      </div>
    </div>
  );
}

function TwitterCard({ name, handle, avatar, text }: { name: string; handle: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex gap-3">
        <Avatar avatar={avatar} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="truncate font-bold">{name}</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 fill-blue-500"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>
            <span className="truncate text-zinc-500">@{handle} · 2m</span>
            <MoreHorizontal className="ml-auto h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-snug">{text}</p>
          <div className="mt-3 flex max-w-xs items-center justify-between text-zinc-500">
            <span className="flex items-center gap-1.5 text-xs"><MessageCircle className="h-4 w-4" /> 24</span>
            <span className="flex items-center gap-1.5 text-xs"><Repeat2 className="h-4 w-4" /> 89</span>
            <span className="flex items-center gap-1.5 text-xs"><Heart className="h-4 w-4" /> 412</span>
            <span className="flex items-center gap-1.5 text-xs"><Send className="h-4 w-4" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInCard({ name, avatar, text }: { name: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="p-4">
        <div className="flex gap-2">
          <Avatar avatar={avatar} name={name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="truncate text-xs text-zinc-500">Content Creator · 1st</div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">2h · <Globe className="h-3 w-3" /></div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-zinc-500" />
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-relaxed">{text}</p>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-1.5 text-xs text-zinc-500 dark:border-zinc-800">
        <span>👍 ❤️ 💡 1,247</span>
        <span>184 comments · 32 reposts</span>
      </div>
      <div className="grid grid-cols-4 border-t border-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <span className="flex items-center justify-center gap-1.5 py-2"><ThumbsUp className="h-4 w-4" /> Like</span>
        <span className="flex items-center justify-center gap-1.5 py-2"><MessageCircle className="h-4 w-4" /> Comment</span>
        <span className="flex items-center justify-center gap-1.5 py-2"><Repeat2 className="h-4 w-4" /> Repost</span>
        <span className="flex items-center justify-center gap-1.5 py-2"><Send className="h-4 w-4" /> Send</span>
      </div>
    </div>
  );
}

function InstagramCard({ handle, avatar, text }: { handle: string; avatar?: string; text: string }) {
  return (
    <div className="max-w-md overflow-hidden rounded-xl border border-border bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex items-center gap-2 p-3">
        <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <Avatar avatar={avatar} name={handle} size={32} />
        </div>
        <span className="text-sm font-semibold">{handle}</span>
        <MoreHorizontal className="ml-auto h-4 w-4" />
      </div>
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-primary/30 via-primary-glow/30 to-primary/20">
        <div className="px-6 text-center">
          <div className="mb-2 text-4xl">📸</div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Your image goes here</p>
        </div>
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center gap-3">
          <Heart className="h-6 w-6" />
          <MessageCircle className="h-6 w-6" />
          <Send className="h-6 w-6" />
          <Bookmark className="ml-auto h-6 w-6" />
        </div>
        <div className="text-sm font-semibold">2,486 likes</div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm"><span className="font-semibold">{handle}</span> {text}</p>
      </div>
    </div>
  );
}

function FacebookCard({ name, avatar, text }: { name: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
      <div className="p-3">
        <div className="flex items-center gap-2">
          <Avatar avatar={avatar} name={name} />
          <div>
            <div className="text-sm font-semibold">{name}</div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">3h · <Globe className="h-3 w-3" /></div>
          </div>
          <MoreHorizontal className="ml-auto h-5 w-5 text-zinc-500" />
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-relaxed">{text}</p>
      </div>
      <div className="grid grid-cols-3 border-t border-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <span className="flex items-center justify-center gap-1.5 py-2"><ThumbsUp className="h-4 w-4" /> Like</span>
        <span className="flex items-center justify-center gap-1.5 py-2"><MessageCircle className="h-4 w-4" /> Comment</span>
        <span className="flex items-center justify-center gap-1.5 py-2"><Send className="h-4 w-4" /> Share</span>
      </div>
    </div>
  );
}
