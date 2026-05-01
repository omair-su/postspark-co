import { Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, ThumbsUp, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Platform = "twitter" | "linkedin" | "instagram" | "facebook";

function platformFor(typeId: string): Platform | null {
  if (typeId === "tweets" || typeId === "thread") return "twitter";
  if (typeId === "linkedin") return "linkedin";
  if (typeId === "instagram") return "instagram";
  if (typeId === "facebook") return "facebook";
  return null;
}

// Split content into discrete posts based on numbered markers (1. 2. 3. or 1) 2)).
function splitIntoPosts(content: string): string[] {
  const cleaned = content
    .replace(/^#+\s.*$/gm, "") // strip markdown headers
    .replace(/^\*\*[^*]+\*\*\s*:?\s*$/gm, "") // strip bold-only labels
    .trim();

  // Match items starting with "1." / "1)" at line start
  const matches = cleaned.split(/(?=^\s*\d{1,2}[.)]\s)/m).map((s) => s.trim()).filter(Boolean);
  if (matches.length > 1) {
    return matches.map((m) => m.replace(/^\d{1,2}[.)]\s*/, "").trim());
  }
  // Fallback: split on double newlines
  const blocks = cleaned.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s.length > 20);
  return blocks.length ? blocks : [cleaned];
}

interface Props {
  typeId: string;
  content: string;
}

export function VisualPreview({ typeId, content }: Props) {
  const platform = platformFor(typeId);
  if (!platform) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Visual preview not available for this format yet.
      </div>
    );
  }

  const posts = splitIntoPosts(content).slice(0, 6);

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <PlatformCard key={i} platform={platform} text={post} />
      ))}
    </div>
  );
}

function PlatformCard({ platform, text }: { platform: Platform; text: string }) {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "You";
  const handle = (user?.email || "you").split("@")[0];
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  if (platform === "twitter") return <TwitterCard name={name} handle={handle} avatar={avatar} text={text} />;
  if (platform === "linkedin") return <LinkedInCard name={name} avatar={avatar} text={text} />;
  if (platform === "instagram") return <InstagramCard handle={handle} avatar={avatar} text={text} />;
  return <FacebookCard name={name} avatar={avatar} text={text} />;
}

function Avatar({ avatar, name, size = 40 }: { avatar?: string; name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  if (avatar) {
    return <img src={avatar} alt="" style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold"
    >
      {initial}
    </div>
  );
}

function TwitterCard({ name, handle, avatar, text }: { name: string; handle: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900 p-4 text-zinc-900 dark:text-zinc-100 shadow-sm">
      <div className="flex gap-3">
        <Avatar avatar={avatar} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold truncate">{name}</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-blue-500 flex-shrink-0"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>
            <span className="text-zinc-500 truncate">@{handle} · 2m</span>
            <MoreHorizontal className="ml-auto h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-1 text-[15px] leading-snug whitespace-pre-wrap break-words">{text}</p>
          <div className="mt-3 flex items-center justify-between text-zinc-500 max-w-xs">
            <button className="flex items-center gap-1.5 text-xs hover:text-blue-500"><MessageCircle className="h-4 w-4" /> 24</button>
            <button className="flex items-center gap-1.5 text-xs hover:text-green-500"><Repeat2 className="h-4 w-4" /> 89</button>
            <button className="flex items-center gap-1.5 text-xs hover:text-pink-500"><Heart className="h-4 w-4" /> 412</button>
            <button className="flex items-center gap-1.5 text-xs hover:text-blue-500"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInCard({ name, avatar, text }: { name: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm">
      <div className="p-4">
        <div className="flex gap-2">
          <Avatar avatar={avatar} name={name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-zinc-500 truncate">Content Creator · 1st</div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1">2h · <Globe className="h-3 w-3" /></div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-zinc-500" />
        </div>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words">{text}</p>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>👍 ❤️ 💡 1,247</span>
        <span>184 comments · 32 reposts</span>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-4 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ThumbsUp className="h-4 w-4" /> Like</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><MessageCircle className="h-4 w-4" /> Comment</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Repeat2 className="h-4 w-4" /> Repost</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Send className="h-4 w-4" /> Send</button>
      </div>
    </div>
  );
}

function InstagramCard({ handle, avatar, text }: { handle: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm overflow-hidden max-w-md">
      <div className="flex items-center gap-2 p-3">
        <div className="rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
          <Avatar avatar={avatar} name={handle} size={32} />
        </div>
        <span className="text-sm font-semibold">{handle}</span>
        <MoreHorizontal className="ml-auto h-4 w-4" />
      </div>
      <div className="aspect-square bg-gradient-to-br from-primary/30 via-primary-glow/30 to-primary/20 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl mb-2">📸</div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Your image goes here</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-6 w-6" />
          <MessageCircle className="h-6 w-6" />
          <Send className="h-6 w-6" />
          <Bookmark className="ml-auto h-6 w-6" />
        </div>
        <div className="text-sm font-semibold">2,486 likes</div>
        <p className="mt-1 text-sm whitespace-pre-wrap break-words"><span className="font-semibold">{handle}</span> {text}</p>
      </div>
    </div>
  );
}

function FacebookCard({ name, avatar, text }: { name: string; avatar?: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm">
      <div className="p-3">
        <div className="flex items-center gap-2">
          <Avatar avatar={avatar} name={name} />
          <div>
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1">3h · <Globe className="h-3 w-3" /></div>
          </div>
          <MoreHorizontal className="ml-auto h-5 w-5 text-zinc-500" />
        </div>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words">{text}</p>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-3 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ThumbsUp className="h-4 w-4" /> Like</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><MessageCircle className="h-4 w-4" /> Comment</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Send className="h-4 w-4" /> Share</button>
      </div>
    </div>
  );
}
