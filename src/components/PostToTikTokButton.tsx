import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { publishToTikTok } from "@/lib/socialPublish.functions";
import { getConnectedSocials } from "@/lib/socialPublish.functions";
import { toast } from "sonner";
import { Loader2, X, Music2 } from "lucide-react";

interface Props {
  /** Text content that will be adapted into a TikTok caption/script */
  content: string;
  /** Optional pre-uploaded HTTPS video URL — required to actually publish */
  videoUrl?: string;
  className?: string;
}

/**
 * Reusable "🎵 TikTok Script →" button for content-output pages.
 * - If TikTok not connected → prompt link to Settings
 * - If connected → opens a panel to review/publish (needs videoUrl to submit)
 */
export function PostToTikTokButton({ content, videoUrl, className }: Props) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [title, setTitle] = useState(content.slice(0, 150));
  const [publishing, setPublishing] = useState(false);

  const openPanel = async () => {
    if (!session) {
      toast.error("Sign in to post to TikTok");
      return;
    }
    setOpen(true);
    setChecking(true);
    try {
      const res = await getConnectedSocials({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const tt = (res.accounts || []).find((a: any) => a.platform === "tiktok");
      setConnected(!!tt);
      setUsername(tt?.platform_username || null);
    } finally {
      setChecking(false);
    }
  };

  const handlePublish = async () => {
    if (!session) return;
    if (!videoUrl) {
      toast.error("A video URL is required for TikTok. Generate/upload a video first.");
      return;
    }
    setPublishing(true);
    try {
      const res = await publishToTikTok({
        data: {
          videoUrl,
          title: title.slice(0, 150),
          privacyLevel: "PUBLIC_TO_EVERYONE",
          disableDuet: false,
          disableComment: false,
          disableStitch: false,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success("Sent to TikTok — check the app to finish publishing");
        setOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.message || "TikTok publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <button
        onClick={openPanel}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        }
      >
        <Music2 className="h-3.5 w-3.5" />
        TikTok Script →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !publishing && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Post to TikTok</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={publishing}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {checking ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking TikTok connection…
              </div>
            ) : connected === false ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-foreground">
                  Connect your TikTok account first to post directly from PostSpark.
                </p>
                <Link
                  to="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground"
                  onClick={() => setOpen(false)}
                >
                  Connect TikTok in Settings →
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {username && (
                  <p className="text-xs text-muted-foreground">
                    Publishing as <span className="font-semibold text-foreground">@{username}</span>
                  </p>
                )}
                <div>
                  <label className="text-xs font-medium text-foreground">Caption / Title (max 150)</label>
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 150))}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{title.length}/150</p>
                </div>

                {!videoUrl && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ No video attached. Generate or upload a video in Shorts Studio, then use "Post
                    to TikTok" from there to publish.
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={publishing}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing || !videoUrl}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-electric px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {publishing && <Loader2 className="h-3 w-3 animate-spin" />}
                    Publish to TikTok
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
