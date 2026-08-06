import { AlertTriangle, CheckCircle2, Clock, Instagram, Loader2, RefreshCw, Unlink, XCircle } from "lucide-react";

type Props = {
  conn: any;
  authError: string | null;
  connecting: boolean;
  busy: string | null;
  onConnect: () => void;
  onReconnect: () => void;
  onRefresh: () => void;
  onDisconnect: () => void;
};

function relative(iso: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days < 0) return "expired";
  if (days === 0) return "expires today";
  if (days === 1) return "expires tomorrow";
  return `expires in ${days} days`;
}

export default function InstagramStatusPanel({
  conn,
  authError,
  connecting,
  busy,
  onConnect,
  onReconnect,
  onRefresh,
  onDisconnect,
}: Props) {
  const connected = !!conn?.connected;
  const expiresAt: string | null = conn?.tokenExpiresAt ?? null;
  const expiry = relative(expiresAt);
  const expiringSoon = expiresAt ? new Date(expiresAt).getTime() - Date.now() < 7 * 86_400_000 : false;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`rounded-xl p-2.5 ${
              connected && !authError
                ? "bg-emerald-500/15 text-emerald-500"
                : authError
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {connected && !authError ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : authError ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Connection status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {connected ? (
                <>
                  Connected as <span className="font-medium text-foreground">@{conn.username || "instagram"}</span>
                  {conn.accountType ? ` · ${String(conn.accountType).toLowerCase()}` : ""}
                </>
              ) : (
                "No Instagram account is connected yet."
              )}
            </p>
            {connected && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {expiresAt ? (
                  <>
                    Token valid until {new Date(expiresAt).toLocaleString()}
                    {expiry ? (
                      <span className={expiringSoon ? "font-medium text-amber-500" : ""}> ({expiry})</span>
                    ) : null}
                  </>
                ) : (
                  "Token expiry unknown — refresh to update."
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {connected ? (
            <>
              {authError && (
                <button
                  onClick={onReconnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Instagram className="h-3.5 w-3.5" />}
                  Reconnect Instagram
                </button>
              )}
              <button
                onClick={onRefresh}
                disabled={busy === "refresh"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted disabled:opacity-50"
              >
                {busy === "refresh" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Refresh
              </button>
              <button
                onClick={onDisconnect}
                disabled={busy === "disconnect"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted disabled:opacity-50"
              >
                {busy === "disconnect" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
                Disconnect Instagram
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
              Connect Instagram
            </button>
          )}
        </div>
      </div>

      {authError && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          {authError} Reconnecting takes a few seconds and keeps your scheduled posts intact.
        </p>
      )}

      {connected && expiringSoon && !authError && (
        <p className="mt-4 rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          PostSpark renews this token automatically before it expires. You can also reconnect any time.
        </p>
      )}
    </section>
  );
}
