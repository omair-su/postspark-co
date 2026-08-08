import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { searchReelsByHashtag, getReelsCapability } from "@/lib/reelsSearch.functions";
import { Search, Loader2, ExternalLink, Video, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

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

type Capability = { mode: string; canSearch: boolean; username: string | null } | null;

const CAPABILITY_COPY: Record<string, { text: string; action?: { label: string; to: string } }> = {
  NO_IG_ACCOUNT: {
    text: "No Instagram connection yet. Hashtag discovery needs an Instagram Business account linked to a Facebook Page.",
    action: { label: "Connect Facebook", to: "/dashboard/settings/facebook" },
  },
  NO_IG_BUSINESS_ON_PAGE: {
    text: "Facebook is connected, but none of your Pages has a linked Instagram Business account. Link one in Meta, then pick the Page here.",
    action: { label: "Choose a Page", to: "/dashboard/settings/facebook" },
  },
  IG_STANDALONE_ONLY: {
    text: "Your Instagram account is connected for publishing. Hashtag discovery is a separate Meta capability that requires an Instagram Business account linked to a Facebook Page — your existing connection stays intact.",
    action: { label: "Connect Facebook Page", to: "/dashboard/settings/facebook" },
  },
  HASHTAG_NOT_FOUND: { text: "No results for that hashtag." },
};

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
  const [errorAction, setErrorAction] = useState<{ label: string; to: string } | null>(null);
  const [capability, setCapability] = useState<Capability>(null);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    getReelsCapability({ headers: { Authorization: `Bearer ${session.access_token}` } } as any)
      .then((c: any) => { if (alive) setCapability(c); })
      .catch(() => {});
    return () => { alive = false; };
  }, [session]);

  const showError = (code: string) => {
    const copy = CAPABILITY_COPY[code];
    setError(copy?.text || code || "Search failed");
    setErrorAction(copy?.action ?? null);
  };

  const doSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setErrorAction(null);
    try {
      const res = await searchReelsByHashtag({
        data: { hashtag: q.trim(), type },
        ...authHeaders,
      } as any);
      if (!(res as any).success) {
        showError((res as any).error);
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

      {capability ? (
        capability.canSearch ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Hashtag discovery is ready{capability.username ? ` (@${capability.username})` : ""}.</span>
          </div>
        ) : (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
            <div className="space-y-1">
              <p>
                {capability.mode === "standalone_instagram"
                  ? CAPABILITY_COPY.IG_STANDALONE_ONLY.text
                  : capability.mode === "facebook_no_ig"
                    ? CAPABILITY_COPY.NO_IG_BUSINESS_ON_PAGE.text
                    : CAPABILITY_COPY.NO_IG_ACCOUNT.text}
              </p>
              <Link to="/dashboard/settings/facebook" className="font-medium text-primary hover:underline">
                Connect a Facebook Page →
              </Link>
            </div>
          </div>
        )
      ) : null}

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
          disabled={loading || !q.trim() || capability?.canSearch === false}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
          <div className="space-y-1">
            <span>{error}</span>
            {errorAction ? (
              <div>
                <Link to={errorAction.to} className="font-medium text-primary hover:underline">
                  {errorAction.label} →
                </Link>
              </div>
            ) : null}
          </div>
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
