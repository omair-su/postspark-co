import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Google OAuth callback. Runs server-side, stores the tokens, then bounces the
 * user back to wherever they started the connect flow.
 */
export const Route = createFileRoute("/auth/google/callback")({
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.searchStr || "");
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    const fail = (msg: string) => {
      throw redirect({ to: "/dashboard/settings/google", search: { google_error: msg } as any });
    };

    if (oauthError) fail(oauthError);
    if (!code || !state) fail("missing_code");

    const { verifyGoogleState, exchangeGoogleCode, fetchGoogleProfile } = await import(
      "@/lib/google.server"
    );
    const { saveGoogleAccount } = await import("@/lib/googleAccount.server");

    const verified = await verifyGoogleState(state!);
    if (!verified) fail("invalid_state");

    const { tokens, error } = await exchangeGoogleCode(code!);
    if (!tokens?.access_token) fail(error || "token_exchange_failed");

    const profile = await fetchGoogleProfile(tokens!.access_token);
    if (!profile?.id) fail("profile_failed");

    try {
      await saveGoogleAccount(verified!.userId, tokens!, profile!);
    } catch (e: any) {
      console.error("[google-callback] save failed", e);
      fail("save_failed");
    }

    throw redirect({
      to: verified!.returnTo || "/dashboard/settings/google",
      search: { google_connected: "1" } as any,
    });
  },
  component: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Connecting your Google account…
    </div>
  ),
});
