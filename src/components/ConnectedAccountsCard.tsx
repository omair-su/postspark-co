import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getConnectedSocials,
  getTikTokAuthUrl,
  getLinkedInAuthUrl,
  getXAuthUrl,
  disconnectSocial,
} from "@/lib/socialPublish.functions";
import { getMetaAuthUrl, disconnectMeta } from "@/lib/metaPublish.functions";
import { toast } from "sonner";
import { Loader2, Link2Off, CheckCircle2, Linkedin, Twitter, Facebook } from "lucide-react";
import { useSearch, useNavigate } from "@tanstack/react-router";

type Account = {
  platform: string;
  platform_username: string | null;
  token_expires_at: string | null;
};

type Platform = "tiktok" | "linkedin" | "twitter" | "facebook";

export function ConnectedAccountsCard() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tiktok?: string; linkedin?: string; x?: string; facebook?: string };

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
        toast.error(res.error);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
      }
    } finally {
      setConnecting(null);
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
  }: {
    platform: Platform;
    label: string;
    emoji?: string;
    icon?: React.ReactNode;
    tagline: string;
    account: Account | undefined;
    accentClass: string;
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
          <button
            onClick={() => handleDisconnect(platform, label)}
            disabled={disconnecting === platform}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            {disconnecting === platform ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Link2Off className="h-3 w-3" />
            )}
            Disconnect
          </button>
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
      <Row
        platform="facebook"
        label="Facebook & Instagram"
        icon={<Facebook className="h-4 w-4 text-[#1877F2]" />}
        tagline="Publish to your Facebook Pages and linked Instagram Business accounts."
        account={facebook}
        accentClass="bg-[#1877F2] hover:bg-[#1466d6]"
      />
    </div>
  );
}
