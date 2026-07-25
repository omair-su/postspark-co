import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getThreadsAuthUrl, disconnectMeta } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import { AtSign, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings/threads")({
  head: () => ({
    meta: [
      { title: "Threads — PostSpark" },
      {
        name: "description",
        content: "Connect Threads through your Instagram Business account and publish from PostSpark.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ThreadsSettings,
});

function ThreadsSettings() {
  const { session, user } = useAuth();
  const [threadsAcct, setThreadsAcct] = useState<any>(null);
  const [igLinked, setIgLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const authHeaders = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : ({} as any);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const [t, p] = await Promise.all([
      supabase
        .from("social_accounts")
        .select("id, platform_user_id, platform_username, scopes, token_expires_at, metadata")
        .eq("user_id", user.id)
        .eq("platform", "threads")
        .maybeSingle(),
      supabase
        .from("social_pages")
        .select("instagram_business_account_id")
        .eq("user_id", user.id)
        .eq("platform", "facebook")
        .not("instagram_business_account_id", "is", null)
        .limit(1),
    ]);
    setThreadsAcct(t.data);
    setIgLinked((p.data || []).length > 0);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Show toast when returning from OAuth callback.
    const params = new URLSearchParams(window.location.search);
    const status = params.get("threads");
    if (status === "connected") toast.success("Threads connected");
    else if (status?.startsWith("error:")) toast.error(`Threads connect failed: ${decodeURIComponent(status.slice(6))}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const r: any = await getThreadsAuthUrl({ ...authHeaders });
      if (r?.error) throw new Error(r.error);
      if (r?.url) window.location.href = r.url;
    } catch (e: any) {
      toast.error(e?.message || "Failed to start Threads connect");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Threads? (This also affects other Meta connections since they share credentials.)")) return;
    try {
      await disconnectMeta({ ...authHeaders });
      toast.success("Disconnected");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Disconnect failed");
    }
  };


  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-start gap-3">
        <div className="rounded-lg bg-foreground/10 p-2.5 text-foreground">
          <AtSign className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Threads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Threads posting uses the Threads Graph API and the Instagram account linked to your Facebook Page.
          </p>
        </div>
        {threadsAcct && (
          <Link
            to="/dashboard/publish/threads"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open composer <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : threadsAcct ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Threads connected
          </div>
          <div className="mt-3 space-y-1 text-sm text-foreground">
            <div>
              <span className="text-muted-foreground">Username:</span>{" "}
              {threadsAcct.platform_username || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Threads user ID:</span>{" "}
              <span className="font-mono">{threadsAcct.platform_user_id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Scopes:</span> {threadsAcct.scopes || "threads_business_basic"}
            </div>
            {threadsAcct.token_expires_at && (
              <div>
                <span className="text-muted-foreground">Token expires:</span>{" "}
                {new Date(threadsAcct.token_expires_at).toLocaleString()}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              to="/dashboard/publish/threads"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Publish a thread <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4" /> Threads is not connected yet
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Threads publishing needs the <code>threads_business_basic</code> and{" "}
            <code>threads_content_publish</code> permissions, granted through the Instagram account linked to a
            Facebook Page.
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground">
            <li>
              Make sure an Instagram Business or Creator account is linked to a Facebook Page you manage.{" "}
              <Link to="/dashboard/settings/instagram" className="text-primary underline">
                Check Instagram
              </Link>
              .
            </li>
            <li>
              In the Instagram app, open your profile → the "@" icon → follow the prompt to create/claim your Threads
              profile. Toggle <b>Allow the Threads API</b> on for the linked account.
            </li>
            <li>
              Come back and reauthorize Meta from{" "}
              <Link to="/dashboard/settings/facebook" className="text-primary underline">
                Facebook settings
              </Link>{" "}
              — Threads will attach automatically once available.
            </li>
          </ol>

          {!igLinked && (
            <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              You don't have an Instagram account linked yet. Start there — Threads follows from it.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Character limits</h3>
        <p className="text-xs text-muted-foreground">
          Threads posts allow up to 500 characters each. PostSpark auto-splits longer content into a numbered chain of
          replies.
        </p>
      </section>
    </div>
  );
}
