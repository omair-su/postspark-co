import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Copy,
  Share2,
  Sparkles,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  downloadLinkedInVideo,
  getDownloaderUsage,
} from "@/lib/linkedinDownloader.functions";

type Usage = { used: number; limit: number; plan: string };

type Result = {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
};

export function LinkedInDownloaderTool({ initialUrl = "" }: { initialUrl?: string }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const runDownload = useServerFn(downloadLinkedInVideo);
  const fetchUsage = useServerFn(getDownloaderUsage);

  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUsage({})
      .then((u) => setUsage(u))
      .catch(() => {});
  }, [user, fetchUsage]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!user) {
      navigate({
        to: "/signup",
        search: { redirect: "/tools/linkedin-video-downloader" } as any,
      });
      return;
    }

    if (!url.trim()) {
      setError("Paste a LinkedIn post URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await runDownload({ data: { url: url.trim() } });
      if (!res.ok) {
        if (res.error === "LIMIT_REACHED") {
          setUpgradeOpen(true);
        } else {
          setError(res.error);
        }
        return;
      }
      setResult({
        videoUrl: res.videoUrl,
        posterUrl: res.posterUrl,
        title: res.title,
      });
      // Refresh usage
      fetchUsage({})
        .then((u) => setUsage(u))
        .catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.videoUrl);
    toast.success("Video URL copied");
  }

  async function onShare() {
    if (!result) return;
    const data = {
      title: result.title || "LinkedIn video",
      text: "Video downloaded with PostSpark",
      url: result.videoUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* user dismissed */
      }
    } else {
      navigator.clipboard.writeText(result.videoUrl);
      toast.success("Link copied — share away");
    }
  }

  const remaining =
    usage && usage.limit > 0 ? Math.max(0, usage.limit - usage.used) : null;
  const atLimit = usage && usage.limit > 0 && usage.used >= usage.limit;

  return (
    <section className="mx-auto -mt-8 mb-4 max-w-3xl px-4 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/posts/..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="LinkedIn video URL"
            required
            maxLength={500}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || authLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download
              </>
            )}
          </button>
        </form>

        {/* Usage chip */}
        {user && usage && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {usage.limit === -1
                ? "Unlimited downloads on your plan"
                : `${usage.used} / ${usage.limit} free downloads used this month${
                    remaining !== null ? ` · ${remaining} left` : ""
                  }`}
            </span>
            {usage.limit > 0 && (
              <Link
                to="/pricing"
                className="font-semibold text-primary hover:underline"
              >
                Upgrade
              </Link>
            )}
          </div>
        )}

        {!user && !authLoading && (
          <p className="mt-3 text-xs text-muted-foreground">
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create a free account
            </Link>{" "}
            to download up to 3 LinkedIn videos every month.
          </p>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !result && (
          <div className="mt-5 animate-pulse rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Extracting the public video stream from LinkedIn…
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Check className="h-4 w-4" /> Video ready
            </div>
            {result.title && (
              <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                {result.title}
              </p>
            )}
            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-black">
              <video
                src={result.videoUrl}
                poster={result.posterUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={result.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Download MP4
              </a>
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Copy className="h-4 w-4" /> Copy URL
              </button>
              <button
                type="button"
                onClick={onShare}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
              <Link
                to="/dashboard/repurpose"
                search={{ source: url } as any}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Sparkles className="h-4 w-4" /> Repurpose this video
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade modal */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setUpgradeOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border">
            <button
              onClick={() => setUpgradeOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">
              You've used your 3 free downloads
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Upgrade to Pro for unlimited LinkedIn downloads plus the full
              repurposing suite (tweets, carousels, Reels scripts, newsletters).
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {[
                "Unlimited LinkedIn video downloads",
                "Unlimited AI content repurposing",
                "Brand Voice + Brand Kit",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/pricing"
                onClick={() => setUpgradeOpen(false)}
                className="flex-1 rounded-lg gradient-electric px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                See pricing →
              </Link>
              <button
                onClick={() => setUpgradeOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
