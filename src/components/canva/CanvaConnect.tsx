import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Loader2, Unplug } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getCanvaAuthUrl, getCanvaStatus, disconnectCanva } from "@/lib/canva.functions";
import { CANVA_SETUP_URLS } from "@/lib/canvaUrls";

export interface CanvaStatus {
  configured: boolean;
  connected: boolean;
  displayName: string | null;
  tokenExpiresAt: string | null;
}

export function useCanvaStatus() {
  const { session } = useAuth();
  const [status, setStatus] = useState<CanvaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeaders = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : ({} as any);

  const refresh = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const r: any = await getCanvaStatus({ ...authHeaders });
      setStatus(r);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  return { status, loading, refresh, authHeaders };
}

export function CanvaBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        borderColor: "rgba(0,196,204,0.4)",
        background: "linear-gradient(135deg, rgba(0,196,204,0.14), rgba(125,42,232,0.14))",
        color: "#7D2AE8",
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: "linear-gradient(135deg,#00C4CC,#7D2AE8)" }}
      />
      Powered by Canva
    </span>
  );
}

export function CanvaConnectButton({
  label = "Connect Canva",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const r: any = await getCanvaAuthUrl({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (r?.error) throw new Error(r.error);
      if (r?.url) window.location.href = r.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start the Canva connection");
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={connect}
      disabled={busy}
      className={className}
      style={{ background: "linear-gradient(135deg,#00C4CC,#7D2AE8)", color: "#fff" }}
    >
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

function CopyRow({ label, field, url, hint }: { label: string; field: string; url: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{field}</div>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-muted px-2 py-1.5 text-xs text-foreground">{url}</code>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Copied");
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function CanvaSetupGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-foreground">Canva app setup URLs</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          {CANVA_SETUP_URLS.map((u) => (
            <CopyRow key={u.url + u.label} {...u} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CanvaConnectionCard({
  status,
  loading,
  onChanged,
}: {
  status: CanvaStatus | null;
  loading: boolean;
  onChanged: () => void;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  const disconnect = async () => {
    if (!session) return;
    setBusy(true);
    try {
      await disconnectCanva({ headers: { Authorization: `Bearer ${session.access_token}` } } as any);
      toast.success("Canva disconnected");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Could not disconnect Canva");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00C4CC,#7D2AE8)" }}
          >
            C
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">Canva</div>
            <div className="text-xs text-muted-foreground">Design &amp; publishing</div>
            {loading ? (
              <div className="mt-2 text-sm text-muted-foreground">Checking connection…</div>
            ) : status?.connected ? (
              <div className="mt-2 space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                </div>
                <div className="text-sm text-foreground">{status.displayName || "Canva account"}</div>
                {status.tokenExpiresAt ? (
                  <div className="text-xs text-muted-foreground">
                    Session valid until {new Date(status.tokenExpiresAt).toLocaleString()}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 max-w-md text-sm text-muted-foreground">
                {status?.configured === false
                  ? "Canva keys are not configured yet for this workspace."
                  : "Connect Canva to design thumbnails, covers and carousels with your own templates, fonts and brand assets."}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status?.connected ? (
            <>
              <Button variant="outline" asChild>
                <a href="https://www.canva.com" target="_blank" rel="noreferrer">
                  Open Canva <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
              <Button variant="ghost" onClick={disconnect} disabled={busy} className="text-destructive">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                Disconnect
              </Button>
            </>
          ) : (
            <CanvaConnectButton />
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {["Your templates", "All your fonts", "Every size", "Export PNG / PDF"].map((f) => (
          <div
            key={f}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-center text-xs font-medium text-foreground"
          >
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
