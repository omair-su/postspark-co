import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getMetaAuthUrl,
  listFacebookPages,
  setDefaultFacebookPage,
  disconnectMeta,
} from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import {
  Facebook,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Users,
  Star,
  Trash2,
  ArrowRight,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/settings/facebook")({
  head: () => ({
    meta: [
      { title: "Facebook Pages — PostSpark" },
      {
        name: "description",
        content:
          "Connect Facebook Pages to PostSpark, choose a default publishing Page, and manage permissions.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FacebookSettings,
});

type Page = {
  id: string;
  page_id: string;
  page_name: string | null;
  page_category: string | null;
  page_picture_url: string | null;
  page_followers_count: number | null;
  is_default: boolean | null;
  instagram_business_account_id: string | null;
};

function FacebookSettings() {
  const { session } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const authHeaders = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : {};

  const refresh = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const r: any = await listFacebookPages(authHeaders as any);
      setPages(r.pages || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load Pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleConnect = async () => {
    setBusy("connect");
    try {
      const r: any = await getMetaAuthUrl(authHeaders as any);
      if (r?.error) throw new Error(r.error);
      if (r?.url) window.location.href = r.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start Facebook OAuth");
    } finally {
      setBusy(null);
    }
  };

  const handleSetDefault = async (pageRowId: string) => {
    setBusy(pageRowId);
    try {
      const r: any = await setDefaultFacebookPage({ ...(authHeaders as any), data: { pageRowId } });
      if (r?.error) throw new Error(r.error);
      toast.success("Default publishing Page updated");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to set default");
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Facebook / Instagram / Threads from PostSpark? Tokens and Pages will be removed.")) return;
    setBusy("disconnect");
    try {
      await disconnectMeta(authHeaders as any);
      toast.success("Meta disconnected");
      setPages([]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to disconnect");
    } finally {
      setBusy(null);
    }
  };

  const isConnected = pages.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-start gap-3">
        <div className="rounded-lg bg-[#1877F2]/15 p-2.5 text-[#1877F2]">
          <Facebook className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Facebook Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect the Pages you manage. Pick a default and start publishing directly from PostSpark.
          </p>
        </div>
        {isConnected && (
          <Link
            to="/dashboard/publish/facebook"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open composer <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </header>

      {/* Connect card */}
      {!isConnected && !loading && (
        <section className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Connect Facebook</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You'll be redirected to Facebook to authorize PostSpark. We request:
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <li>• <code>pages_show_list</code> — list your Pages</li>
                <li>• <code>pages_manage_posts</code> — publish content</li>
                <li>• <code>pages_read_engagement</code> — Page metadata</li>
                <li>• <code>business_management</code> — manage assets</li>
                <li>• <code>instagram_basic</code> — read IG account</li>
                <li>• <code>instagram_content_publish</code> — post to IG</li>
              </ul>
              <button
                onClick={handleConnect}
                disabled={busy === "connect"}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1877F2]/90 disabled:opacity-60"
              >
                {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
                Connect Facebook
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Connected Pages */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Pages…
        </div>
      ) : isConnected ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Connected Pages ({pages.length})
            </h2>
            <button
              onClick={handleDisconnect}
              disabled={busy === "disconnect"}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" /> Disconnect
            </button>
          </div>

          {pages.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              {p.page_picture_url ? (
                <img
                  src={p.page_picture_url}
                  alt={p.page_name || "Page"}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Facebook className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-medium text-foreground">{p.page_name || "Untitled"}</span>
                  {p.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                  {p.instagram_business_account_id && (
                    <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[11px] font-medium text-pink-400">
                      IG linked
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {p.page_category && <span>{p.page_category}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {(p.page_followers_count ?? 0).toLocaleString()}
                  </span>
                  <span className="font-mono">ID {p.page_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!p.is_default && (
                  <button
                    onClick={() => handleSetDefault(p.id)}
                    disabled={busy === p.id}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Set default"}
                  </button>
                )}
                <a
                  href={`https://facebook.com/${p.page_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted"
                  title="Open on Facebook"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/dashboard/publish/facebook"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <CheckCircle2 className="h-4 w-4" /> Publish to Facebook
            </Link>
            <Link
              to="/dashboard/settings/instagram"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Instagram settings
            </Link>
            <Link
              to="/dashboard/settings/threads"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Threads settings
            </Link>
            <button
              onClick={handleConnect}
              disabled={busy === "connect"}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reconnect / refresh Pages
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
