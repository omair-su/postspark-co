import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getConnectedSocials,
  getTikTokAuthUrl,
  getLinkedInAuthUrl,
  getXAuthUrl,
  disconnectSocial,
  getXIntegrationDebug,
  testXPublish,
} from "@/lib/socialPublish.functions";
import { getMetaAuthUrl, disconnectMeta } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import { Loader2, Link2Off, CheckCircle2, Linkedin, Twitter, Facebook } from "lucide-react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";

type Account = {
  platform: string;
  platform_username: string | null;
  token_expires_at: string | null;
};

type Platform = "tiktok" | "linkedin" | "twitter" | "facebook";

type XDebug = {
  connected: boolean;
  username: string | null;
  accountId: string | null;
  scopes: string[];
  missingScopes: string[];
  scopeStatus: "ok" | "missing" | "not_connected";
  tokenExpiresAt: string | null;
  connectionUpdatedAt: string | null;
  lastPublishAttempt: {
    action?: string | null;
    status?: string | null;
    error_message?: string | null;
    created_at?: string | null;
  } | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export function ConnectedAccountsCard() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);
  const [testing, setTesting] = useState(false);
  const [xDebug, setXDebug] = useState<XDebug | null>(null);
  const [xDebugLoading, setXDebugLoading] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tiktok?: string; linkedin?: string; x?: string; facebook?: string };

  const refresh = async () => {
    if (!session) return;
    setLoading(true);
    setXDebugLoading(true);
    try {
      const res = await getConnectedSocials({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setAccounts((res.accounts as Account[]) || []);
      const debug = await getXIntegrationDebug({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setXDebug(debug as XDebug);
    } finally {
      setLoading(false);
      setXDebugLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Handle OAuth return (both TikTok & LinkedIn)
  useEffect(() => {
    const handle = (label: string, val?: string) => {
      if (!val) return false;
      if (val === "connected") {
        toast.success(`${label} connected successfully ✓`);
      } else {
        toast.error(`${label} connection failed: ${val.replace(/^error:/, "")}`);
      }
      return true;
    };
    let hit = false;
    hit = handle("TikTok", search?.tiktok) || hit;
    hit = handle("LinkedIn", search?.linkedin) || hit;
    hit = handle("X (Twitter)", search?.x) || hit;
    hit = handle("Facebook", search?.facebook) || hit;
    if (hit) {
      refresh();
      navigate({ to: "/dashboard/settings", replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.tiktok, search?.linkedin, search?.x, search?.facebook]);

  const tiktok = accounts.find((a) => a.platform === "tiktok");
  const linkedin = accounts.find((a) => a.platform === "linkedin");
  const twitter = accounts.find((a) => a.platform === "twitter");
  const facebook = accounts.find((a) => a.platform === "facebook");

  const handleConnect = async (platform: Platform) => {
    if (!session) return;
    setConnecting(platform);
    try {
      const fn =
        platform === "tiktok" ? getTikTokAuthUrl :
        platform === "linkedin" ? getLinkedInAuthUrl :
        platform === "facebook" ? getMetaAuthUrl :
        getXAuthUrl;
      const res: any = await fn({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res?.error) {
        if (platform === "facebook") {
          console.error("[Meta OAuth] server returned an OAuth setup error", res);
        }
        toast.error(res.error);
        return;
      }
      if (res?.url) {
        if (platform === "facebook") {
          const redirectUri = res?.diagnostics?.redirectUri || new URL(res.url).searchParams.get("redirect_uri");
          console.info("[Meta OAuth] complete OAuth URL before redirect", res.url);
          console.info("[Meta OAuth] redirect_uri", redirectUri);
          console.info("[Meta OAuth] callback URI", res?.diagnostics?.callbackUri || redirectUri);
          console.info("[Meta OAuth] auth provider", res?.diagnostics?.authProvider || "Custom Meta Graph OAuth");
          console.info("[Meta OAuth] current environment", res?.diagnostics?.currentEnvironment || null);
          console.info("[Meta OAuth] redirect checks", res?.diagnostics?.checks || null);
          if (res?.diagnostics?.checks?.exactMatchToConfiguredMetaRedirect === false) {
            console.error("[Meta OAuth] redirect_uri mismatch", {
              actual: res.diagnostics.redirectUri,
              expected: res.diagnostics.configuredMetaRedirectUri,
              checks: res.diagnostics.checks,
            });
          }
        }
        window.location.href = res.url;
      }
    } catch (e: any) {
      if (platform === "facebook") {
        console.error("[Meta OAuth] failed before redirect", e);
      }
      toast.error(e?.message || "Could not start connection");
    } finally {
      setConnecting(null);
    }
  };

  const handleTestPublish = async () => {
    if (!session) return;
    setTesting(true);
    try {
      const res: any = await testXPublish({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res?.error) toast.error(res.error);
      else toast.success("Test tweet posted successfully");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Test post failed");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async (platform: Platform, label: string) => {
    if (!session) return;
    if (!confirm(`Disconnect ${label}? You can reconnect anytime.`)) return;
    setDisconnecting(platform);
    try {
      if (platform === "facebook") {
        await disconnectMeta({
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        await disconnectSocial({
          data: { platform },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      toast.success(`${label} disconnected`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Could not disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  const Row = ({
    platform,
    label,
    emoji,
    icon,
    tagline,
    account,
    accentClass,
    manageTo,
  }: {
    platform: Platform;
    label: string;
    emoji?: string;
    icon?: React.ReactNode;
    tagline: string;
    account: Account | undefined;
    accentClass: string;
    manageTo?: "/dashboard/settings/facebook" | "/dashboard/settings/instagram" | "/dashboard/settings/threads";
  }) => (
    <div className="mt-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon || (
              <span className="text-base" aria-hidden>
                {emoji}
              </span>
            )}
            <p className="text-sm font-semibold text-foreground">{label}</p>
            {account && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            )}
          </div>
          {loading ? (
            <p className="mt-1 text-xs text-muted-foreground">Loading…</p>
          ) : account ? (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-foreground">
                ● Connected as{" "}
                <span className="font-semibold">
                  {platform === "tiktok" ? "@" : ""}
                  {account.platform_username || label.toLowerCase() + "_user"}
                </span>
              </p>
              {account.token_expires_at && (
                <p className="text-[11px] text-muted-foreground">
                  Token valid until {new Date(account.token_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{tagline}</p>
          )}
        </div>

        {account ? (
          <div className="flex shrink-0 items-center gap-2">
            {manageTo && (
              <Link
                to={manageTo}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Manage
              </Link>
            )}
            {platform === "twitter" && (
              <button
                onClick={handleTestPublish}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test Post"}
              </button>
            )}
            <button
              onClick={() => handleDisconnect(platform, label)}
              disabled={disconnecting === platform}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              {disconnecting === platform ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Link2Off className="h-3 w-3" />
              )}
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleConnect(platform)}
            disabled={connecting === platform}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${accentClass}`}
          >
            {connecting === platform && <Loader2 className="h-3 w-3 animate-spin" />}
            Connect {label} →
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🔗
        </span>
        <h2 className="text-sm font-semibold text-foreground">Connected Accounts</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Connect your social accounts to publish directly from PostSpark.
      </p>

      <Row
        platform="tiktok"
        label="TikTok"
        emoji="🎵"
        tagline="Publish videos and scripts straight to TikTok."
        account={tiktok}
        accentClass="gradient-electric"
      />

      <Row
        platform="linkedin"
        label="LinkedIn"
        icon={<Linkedin className="h-4 w-4 text-[#0A66C2]" />}
        tagline="Publish posts, images, and articles directly to your LinkedIn feed."
        account={linkedin}
        accentClass="bg-[#0A66C2] hover:bg-[#0956a8]"
      />
      <Row
        platform="twitter"
        label="X (Twitter)"
        icon={<Twitter className="h-4 w-4 text-foreground" />}
        tagline="Publish tweets, threads, images, and videos directly to your X account."
        account={twitter}
        accentClass="bg-black hover:bg-neutral-800"
      />
      {twitter && (
        <div className="mt-2 rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">X debug</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {xDebugLoading ? "Checking connection…" : xDebug?.scopeStatus === "ok" ? "Ready to publish" : "Reconnect recommended"}
              </p>
            </div>
            <button
              onClick={handleTestPublish}
              disabled={testing || xDebugLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Test Publish
            </button>
          </div>
          <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
            <div>
              <span className="text-foreground">Scopes:</span>{" "}
              {xDebug?.scopes?.length ? xDebug.scopes.join(", ") : "none reported"}
            </div>
            <div>
              <span className="text-foreground">Missing:</span>{" "}
              {xDebug?.missingScopes?.length ? xDebug.missingScopes.join(", ") : "none"}
            </div>
            <div>
              <span className="text-foreground">Token expires:</span>{" "}
              {xDebug?.tokenExpiresAt ? new Date(xDebug.tokenExpiresAt).toLocaleString() : "unknown"}
            </div>
            <div>
              <span className="text-foreground">Last attempt:</span>{" "}
              {xDebug?.lastPublishAttempt?.created_at
                ? `${xDebug.lastPublishAttempt.status || "unknown"} · ${new Date(xDebug.lastPublishAttempt.created_at).toLocaleString()}`
                : "none"}
            </div>
          </div>
          {xDebug?.lastErrorMessage ? (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {xDebug.lastErrorCode ? `${xDebug.lastErrorCode}: ` : ""}{xDebug.lastErrorMessage}
            </p>
          ) : null}
        </div>
      )}
      <Row
        platform="facebook"
        label="Facebook & Instagram"
        icon={<Facebook className="h-4 w-4 text-[#1877F2]" />}
        tagline="Publish to your Facebook Pages and linked Instagram Business accounts."
        account={facebook}
        accentClass="bg-[#1877F2] hover:bg-[#1466d6]"
        manageTo="/dashboard/settings/facebook"
      />
    </div>
  );
}
