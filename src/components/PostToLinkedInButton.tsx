import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { publishToLinkedIn, getConnectedSocials } from "@/lib/socialPublish.functions";
import { toast } from "sonner";
import { Loader2, X, Linkedin, Globe, Users as UsersIcon, Image as ImageIcon, LinkIcon, CheckCircle2, ExternalLink } from "lucide-react";

interface Props {
  /** Text content that will be adapted into the LinkedIn commentary */
  content: string;
  /** Optional media (image URL). Video posts require the video API — image is what the composer supports. */
  mediaUrl?: string;
  /** Optional article/link to attach */
  linkUrl?: string;
  className?: string;
  label?: string;
}

const MAX_LEN = 3000;

export function PostToLinkedInButton({ content, mediaUrl, linkUrl, className, label }: Props) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [commentary, setCommentary] = useState(content.slice(0, MAX_LEN));
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [publishing, setPublishing] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  useEffect(() => {
    setCommentary(content.slice(0, MAX_LEN));
  }, [content]);

  const openPanel = async () => {
    if (!session) {
      toast.error("Sign in to post to LinkedIn");
      return;
    }
    setOpen(true);
    setSuccessUrl(null);
    setChecking(true);
    try {
      const res = await getConnectedSocials({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const li = (res.accounts || []).find((a: any) => a.platform === "linkedin");
      setConnected(!!li);
      setUsername(li?.platform_username || null);
    } finally {
      setChecking(false);
    }
  };

  const submit = async (status: "published" | "draft") => {
    if (!session) return;
    if (!commentary.trim()) {
      toast.error("Write something to post");
      return;
    }
    setPublishing(true);
    try {
      const res = await publishToLinkedIn({
        data: {
          commentary: commentary.slice(0, MAX_LEN),
          visibility,
          mediaUrl,
          linkUrl,
          status,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if (status === "draft") {
        toast.success("Saved as LinkedIn draft");
        setOpen(false);
      } else {
        toast.success("Posted to LinkedIn ✓");
        setSuccessUrl((res as any).url || null);
      }
    } catch (e: any) {
      toast.error(e?.message || "LinkedIn publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const remaining = MAX_LEN - commentary.length;
  const hashtagCount = (commentary.match(/#\w+/g) || []).length;

  return (
    <>
      <button
        onClick={openPanel}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        }
      >
        <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
        {label || "Post to LinkedIn"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !publishing && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2]/10">
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Post to LinkedIn</h3>
                  {username && (
                    <p className="text-[11px] text-muted-foreground">
                      as <span className="font-semibold text-foreground">{username}</span>
                    </p>
                  )}
                </div>
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
                <Loader2 className="h-4 w-4 animate-spin" /> Checking LinkedIn connection…
              </div>
            ) : connected === false ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-foreground">
                  Connect your LinkedIn account first to post directly from PostSpark.
                </p>
                <Link
                  to="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0956a8]"
                  onClick={() => setOpen(false)}
                >
                  Connect LinkedIn in Settings →
                </Link>
              </div>
            ) : successUrl !== null ? (
              <div className="mt-5 space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">Posted to LinkedIn!</p>
                <div className="flex justify-center gap-2">
                  {successUrl && (
                    <a
                      href={successUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0956a8]"
                    >
                      View post <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <textarea
                    value={commentary}
                    onChange={(e) => setCommentary(e.target.value.slice(0, MAX_LEN))}
                    rows={8}
                    placeholder="Write something insightful…"
                    className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{hashtagCount} hashtag{hashtagCount === 1 ? "" : "s"}</span>
                    <span className={remaining < 100 ? "text-amber-600 font-semibold" : ""}>
                      {commentary.length}/{MAX_LEN}
                    </span>
                  </div>
                </div>

                {mediaUrl && (
                  <div className="rounded-lg border border-border bg-muted/30 p-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <ImageIcon className="h-3 w-3" /> Attached image
                    </div>
                    <img
                      src={mediaUrl}
                      alt="Attached"
                      className="mt-2 max-h-48 w-full rounded object-cover"
                    />
                  </div>
                )}

                {linkUrl && !mediaUrl && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{linkUrl}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-foreground">Visibility</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility("PUBLIC")}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        visibility === "PUBLIC"
                          ? "border-[#0A66C2] bg-[#0A66C2]/5 text-[#0A66C2]"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" /> Anyone
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("CONNECTIONS")}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        visibility === "CONNECTIONS"
                          ? "border-[#0A66C2] bg-[#0A66C2]/5 text-[#0A66C2]"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      <UsersIcon className="h-3.5 w-3.5" /> Connections
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => submit("draft")}
                    disabled={publishing}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={() => submit("published")}
                    disabled={publishing || !commentary.trim()}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0956a8] disabled:opacity-50"
                  >
                    {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Post now
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
