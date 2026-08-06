import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isCurrentUserAdmin } from "@/lib/blogAdmin.functions";
import { getInstagramWebhookHealth, triggerInstagramWebhookTest } from "@/lib/instagram.functions";
import { IG_WEBHOOK_URL, IG_DEAUTHORIZE_URL } from "@/lib/instagramUrls";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Webhook,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/instagram-webhooks")({
  head: () => ({
    meta: [
      { title: "Instagram webhook health — PostSpark" },
      { name: "description", content: "Admin view of Instagram webhook verification status and recent deliveries." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InstagramWebhooksPage,
});

type Event = {
  id: string;
  event_type: string;
  payload: any;
  processed: boolean;
  error_message: string | null;
  created_at: string;
};

function InstagramWebhooksPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const authHeaders: any = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : {};

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate({ to: "/login", search: {} });
      return;
    }
    (async () => {
      try {
        const r = await isCurrentUserAdmin({ ...authHeaders });
        setIsAdmin(!!r?.isAdmin);
      } catch {
        setIsAdmin(false);
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await getInstagramWebhookHealth({ ...authHeaders });
      setData(r);
    } catch (e: any) {
      toast.error(e?.message || "Could not load webhook health");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const runTest = async () => {
    setTesting(true);
    try {
      const r: any = await triggerInstagramWebhookTest({ ...authHeaders });
      if (r?.error) toast.error(r.error);
      else if (r?.verification?.ok) toast.success("Webhook handshake succeeded");
      else toast.error(r?.verification?.detail || "Handshake failed");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="flex items-center gap-2 px-4 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Admins only</h1>
        <p className="mt-1 text-sm text-muted-foreground">This page shows internal webhook diagnostics.</p>
        <Link
          to="/dashboard/instagram"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Instagram
        </Link>
      </div>
    );
  }

  const v = data?.verification;
  const events: Event[] = data?.events || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Webhook className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Instagram webhook health</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verification status and the most recent deliveries Meta sent to PostSpark.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Reload
          </button>
          <button
            onClick={runTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            Run test
          </button>
        </div>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Handshake</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            {v?.ok ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verified
              </>
            ) : v ? (
              <>
                <XCircle className="h-4 w-4 text-rose-500" /> Failing
              </>
            ) : (
              "—"
            )}
          </p>
          {v?.detail && <p className="mt-1 text-[11px] text-muted-foreground">{v.detail}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verify token</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            {v?.verifyTokenConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Configured
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Missing
              </>
            )}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            App credentials {data?.appConfigured ? "present" : "missing"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Events stored</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{(data?.totalEvents ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-6 space-y-2 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          Callback URL: <code className="break-all text-foreground">{IG_WEBHOOK_URL}</code>
        </p>
        <p>
          Deauthorize / deletion URL: <code className="break-all text-foreground">{IG_DEAUTHORIZE_URL}</code>
        </p>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Last 25 events</h2>
      {loading && !events.length ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No Instagram webhook events received yet. Run a test, or comment on one of your posts to trigger one.
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {e.event_type}
                </span>
                <span className="text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                <span
                  className={`ml-auto text-[11px] font-medium ${e.processed ? "text-emerald-500" : "text-amber-500"}`}
                >
                  {e.processed ? "processed" : "pending"}
                </span>
              </div>
              {e.error_message && <p className="mt-1.5 text-[11px] text-rose-500">{e.error_message}</p>}
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted p-2 text-[10px] leading-relaxed text-foreground">
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
