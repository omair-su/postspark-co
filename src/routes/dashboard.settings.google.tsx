import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleDocsIcon, GoogleDriveIcon, GoogleGIcon } from "@/components/google/GoogleIcons";
import { useGoogleStatus } from "@/components/google/useGoogle";
import { disconnectGoogle, listGoogleDocExports } from "@/lib/google.functions";

export const Route = createFileRoute("/dashboard/settings/google")({
  head: () => ({
    meta: [
      { title: "Google Workspace Integration — PostSpark" },
      {
        name: "description",
        content:
          "Connect Google Drive and Google Docs to PostSpark: import documents as content sources and export AI-generated content back to Docs.",
      },
      { property: "og:title", content: "Google Workspace Integration — PostSpark" },
      {
        property: "og:description",
        content: "Import from Drive, export to Docs — all inside PostSpark.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoogleSettingsPage,
});

function GoogleSettingsPage() {
  const { status, loading, refresh, connect, authHeaders } = useGoogleStatus();
  const [busy, setBusy] = useState(false);
  const [exports, setExports] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("google_connected")) toast.success("Google Workspace connected");
    const err = p.get("google_error");
    if (err) toast.error(`Google connection failed: ${err.replace(/_/g, " ")}`);
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    listGoogleDocExports(authHeaders as any)
      .then((r: any) => setExports(r ?? []))
      .catch(() => setExports([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.connected]);

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 1500);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectGoogle(authHeaders as any);
      toast.success("Google disconnected");
      await refresh();
      setExports([]);
    } catch (e: any) {
      toast.error(e?.message || "Could not disconnect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        to="/dashboard/settings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-3">
          <GoogleGIcon size={28} />
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Google Workspace
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Import documents from Drive and Docs as content sources, and push finished content back
          into a Google Doc.
        </p>
      </header>

      <section className="lux-panel rounded-2xl border border-border bg-card p-5">
        {loading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !status?.configured ? (
          <p className="text-sm text-muted-foreground">
            Google isn't configured for this workspace yet — the Google OAuth client credentials are
            missing.
          </p>
        ) : status.connected ? (
          <div className="flex flex-wrap items-center gap-4">
            {status.avatarUrl ? (
              <img src={status.avatarUrl} alt="" className="h-11 w-11 rounded-full" />
            ) : (
              <GoogleGIcon size={40} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {status.displayName || "Google account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{status.email}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Drive &amp; Docs connected
                {status.hasRefreshToken ? " · stays signed in" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => connect("/dashboard/settings/google")}>
                Re-authorize
              </Button>
              <Button variant="ghost" onClick={handleDisconnect} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <GoogleDriveIcon size={30} />
              <GoogleDocsIcon size={26} />
            </div>
            <p className="text-sm text-muted-foreground">
              PostSpark will request read access to your Drive files, plus permission to create and
              edit the documents it makes for you. You can revoke access any time.
            </p>
            <Button onClick={() => connect("/dashboard/settings/google")}>
              <GoogleGIcon size={16} /> Connect Google account
            </Button>
          </div>
        )}
      </section>

      {status?.configured && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Redirect URI</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add this exact value to your Google Cloud OAuth client → Authorized redirect URIs.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-xs text-foreground">
              {status.redirectUri}
            </code>
            <button
              onClick={() => copy(status.redirectUri, "uri")}
              className="text-muted-foreground hover:text-primary"
              aria-label="Copy redirect URI"
            >
              {copied === "uri" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </section>
      )}

      {exports.length > 0 && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Recent exports</h2>
          <ul className="mt-3 divide-y divide-border">
            {exports.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <GoogleDocsIcon size={16} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {e.document_title || "Untitled"}
                </span>
                {e.source_tool && (
                  <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:block">
                    {e.source_tool}
                  </span>
                )}
                <a
                  href={e.google_doc_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Open document"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
