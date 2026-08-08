import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { searchReelsByHashtag } from "@/lib/reelsSearch.functions";
import { Search, Loader2, ExternalLink, Video, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Reel = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  permalink: string;
  caption: string;
  timestamp: string;
};

interface Props {
  onSelect?: (r: Reel) => void;
}

export function ReelsSearchPanel({ onSelect }: Props) {
  const { session } = useAuth();
  const authHeaders = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : ({} as any);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"top" | "recent">("top");
  const [results, setResults] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchReelsByHashtag({
        data: { hashtag: q.trim(), type },
        ...authHeaders,
      } as any);
      if (!(res as any).success) {
        const err = (res as any).error;
        if (err === "NO_IG_ACCOUNT") {
          setError("Connect an Instagram Business account through a Facebook Page to use hashtag discovery.");
        } else if (err === "IG_STANDALONE_ONLY") {
          setError("Your Instagram account is connected for publishing. Hashtag discovery is a separate Meta capability that requires an Instagram Business account linked to a Facebook Page.");
        } else if (err === "HASHTAG_NOT_FOUND") {
          setError("No results for that hashtag.");
        } else {
          setError(err || "Search failed");
        }
        setResults([]);
      } else {
        setResults((res as any).results as Reel[]);
        if (!(res as any).results?.length) setError("No Reel-style videos found for this tag.");
      }
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Video className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Reels search</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          Instagram
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="hashtag (e.g. productivity)"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="top">Top</option>
          <option value="recent">Recent</option>
        </select>
        <button
          onClick={doSearch}
          disabled={loading || !q.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
          <span>{error}</span>
        </div>
      ) : null}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {results.map((r) => (
            <div
              key={r.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-background"
            >
              <div className="aspect-[9/16] w-full overflow-hidden bg-muted">
                {r.thumbnailUrl ? (
                  <img
                    src={r.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{r.caption}</p>
                <div className="mt-2 flex items-center gap-1">
                  {onSelect ? (
                    <button
                      onClick={() => {
                        onSelect(r);
                        toast.success("Added to B-roll");
                      }}
                      className="flex-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                    >
                      Use as B-roll
                    </button>
                  ) : null}
                  <a
                    href={r.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-border p-1 text-muted-foreground hover:bg-accent"
                    title="Open on Instagram"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
