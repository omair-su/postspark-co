import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getConnectedSocials, getTikTokAuthUrl, disconnectSocial } from "@/lib/socialPublish.functions";
import { toast } from "sonner";
import { Loader2, Link2Off, CheckCircle2 } from "lucide-react";
import { useSearch, useNavigate } from "@tanstack/react-router";

type Account = { platform: string; platform_username: string | null; token_expires_at: string | null };

export function ConnectedAccountsCard() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tiktok?: string };

  const refresh = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await getConnectedSocials({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setAccounts((res.accounts as Account[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Handle OAuth return
  useEffect(() => {
    if (!search?.tiktok) return;
    if (search.tiktok === "connected") {
      toast.success("TikTok connected successfully ✓");
      refresh();
    } else {
      toast.error(`TikTok connection failed: ${search.tiktok.replace(/^error:/, "")}`);
    }
    navigate({ to: "/dashboard/settings", replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.tiktok]);

  const tiktok = accounts.find((a) => a.platform === "tiktok");

  const handleConnect = async () => {
    if (!session) return;
    setConnecting(true);
    try {
      const res = await getTikTokAuthUrl({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if ("url" in res && res.url) {
        window.location.href = res.url;
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!session) return;
    if (!confirm("Disconnect TikTok? You can reconnect anytime.")) return;
    setDisconnecting(true);
    try {
      await disconnectSocial({
        data: { platform: "tiktok" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      toast.success("TikTok disconnected");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Could not disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🎵
        </span>
        <h2 className="text-sm font-semibold text-foreground">Connected Accounts</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Connect your social accounts to publish directly from PostSpark.
      </p>

      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>
                🎵
              </span>
              <p className="text-sm font-semibold text-foreground">TikTok</p>
              {tiktok && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>
            {loading ? (
              <p className="mt-1 text-xs text-muted-foreground">Loading…</p>
            ) : tiktok ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-xs text-foreground">
                  ● Connected as{" "}
                  <span className="font-semibold">@{tiktok.platform_username || "tiktok_user"}</span>
                </p>
                {tiktok.token_expires_at && (
                  <p className="text-[11px] text-muted-foreground">
                    Token valid until {new Date(tiktok.token_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Publish videos and scripts straight to TikTok.
              </p>
            )}
          </div>

          {tiktok ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex shrink-0 items-center gap-1.5 rounded-lg gradient-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {connecting && <Loader2 className="h-3 w-3 animate-spin" />}
              Connect TikTok Account →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
