import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listFacebookPages, getMetaAuthUrl, disconnectMeta } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import { Instagram, Loader2, CheckCircle2, AlertCircle, ArrowRight, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings/instagram")({
  head: () => ({
    meta: [
      { title: "Instagram — PostSpark" },
      {
        name: "description",
        content: "Connect Instagram Business/Creator accounts through Facebook Pages and publish from PostSpark.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InstagramSettings,
});

type Page = {
  id: string;
  page_id: string;
  page_name: string | null;
  page_picture_url: string | null;
  page_followers_count: number | null;
  is_default: boolean | null;
  instagram_business_account_id: string | null;
};

function InstagramSettings() {
  const { session } = useAuth();
  const authHeaders = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : ({} as any);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const r: any = await listFacebookPages(authHeaders);
      setPages(r?.pages || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const linked = pages.filter((p) => p.instagram_business_account_id);
  const unlinked = pages.filter((p) => !p.instagram_business_account_id);
  const anyFacebook = pages.length > 0;

  const handleConnect = async () => {
    setBusy("connect");
    try {
      const r: any = await getMetaAuthUrl(authHeaders);
      if (r?.error) throw new Error(r.error);
      if (r?.url) window.location.href = r.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start OAuth");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-start gap-3">
        <div className="rounded-lg bg-pink-500/15 p-2.5 text-pink-400">
          <Instagram className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Instagram</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            PostSpark publishes to Instagram Business or Creator accounts linked to a Facebook Page you manage.
          </p>
        </div>
        {linked.length > 0 && (
          <Link
            to="/dashboard/publish/instagram"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open composer <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </header>

      {!anyFacebook && !loading && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Connect Facebook first</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Instagram publishing runs through the Meta Graph API via a linked Facebook Page.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/dashboard/settings/facebook"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Go to Facebook settings <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={handleConnect}
              disabled={busy === "connect"}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {busy === "connect" && <Loader2 className="h-4 w-4 animate-spin" />}
              Reauthorize Meta
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : anyFacebook ? (
        <>
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Linked Instagram accounts ({linked.length})
            </h2>
            {linked.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-amber-400" />
                <p className="text-sm text-foreground">No Instagram Business account is linked to your Pages.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  In Facebook: Page → Settings → Linked Accounts → Instagram, then reconnect here.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={busy === "connect"}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {busy === "connect" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reauthorize Meta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {linked.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                    {p.page_picture_url ? (
                      <img src={p.page_picture_url} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Instagram className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-base font-medium text-foreground">
                          {p.page_name || "Instagram account"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> IG linked
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {(p.page_followers_count ?? 0).toLocaleString()} FB followers
                        </span>
                        <span className="font-mono">IG ID {p.instagram_business_account_id}</span>
                      </div>
                    </div>
                    <Link
                      to="/dashboard/publish/instagram"
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Publish
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {unlinked.length > 0 && (
            <section className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pages without a linked Instagram account
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {unlinked.map((p) => (
                  <li key={p.id}>• {p.page_name || p.page_id}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Required permissions</h3>
            <ul className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <li>• <code>instagram_basic</code></li>
              <li>• <code>instagram_content_publish</code></li>
              <li>• <code>pages_show_list</code></li>
              <li>• <code>pages_read_engagement</code></li>
              <li>• <code>business_management</code></li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                onClick={handleConnect}
                disabled={busy === "connect"}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                {busy === "connect" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Reauthorize
              </button>
              <button
                onClick={async () => {
                  if (!confirm("Disconnect Meta (Facebook + Instagram + Threads)?")) return;
                  setBusy("disc");
                  await disconnectMeta(authHeaders);
                  setBusy(null);
                  toast.success("Disconnected");
                  refresh();
                }}
                disabled={busy === "disc"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                <Trash2 className="h-3.5 w-3.5" /> Disconnect
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
