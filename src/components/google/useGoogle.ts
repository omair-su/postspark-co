import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getGoogleAuthUrl, getGoogleStatus } from "@/lib/google.functions";

export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  tokenExpiresAt: string | null;
  hasRefreshToken: boolean;
  redirectUri: string;
}

/** Shared Google connection state + bearer headers for serverFn calls. */
export function useGoogleStatus() {
  const { session } = useAuth();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeaders: any = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : {};

  const refresh = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r: any = await getGoogleStatus({
        headers: { Authorization: `Bearer ${session.access_token}` },
      } as any);
      setStatus(r);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Kick off consent in a popup so the user never loses their draft. */
  const connect = useCallback(
    async (returnTo?: string) => {
      if (!session) return;
      const r: any = await getGoogleAuthUrl({
        data: { returnTo: returnTo ?? window.location.pathname },
        headers: { Authorization: `Bearer ${session.access_token}` },
      } as any);
      if (r?.url) window.location.href = r.url;
    },
    [session?.access_token],
  );

  return { status, loading, refresh, connect, authHeaders };
}
