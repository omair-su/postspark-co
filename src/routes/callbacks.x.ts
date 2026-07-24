// X (Twitter) OAuth callback registered in the X developer portal as
// https://postspark.co/callbacks/x — this route mirrors the logic in
// src/routes/api/public/oauth.x.callback.ts so whichever URL is registered
// on X works.
import { createFileRoute } from "@tanstack/react-router";
import { verifyXOAuthState } from "@/lib/socialPublish.functions";
import { getSafeExplicitUrl, getSafePublicBaseUrl } from "@/lib/siteUrls";

export const Route = createFileRoute("/callbacks/x")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const errDesc = url.searchParams.get("error_description");
        const base = getSafePublicBaseUrl();
        const redirect = (msg: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${base}/dashboard/settings?x=${encodeURIComponent(msg)}` },
          });

        if (err) return redirect(`error:${errDesc || err}`);
        if (!code || !state) return redirect("error:missing_params");

        const verified = await verifyXOAuthState(state);
        if (!verified) return redirect("error:invalid_state");

        const clientId = process.env.X_CLIENT_ID;
        const clientSecret = process.env.X_CLIENT_SECRET;
        if (!clientId || !clientSecret) return redirect("error:not_configured");

        const redirectUri =
          getSafeExplicitUrl(process.env.X_REDIRECT_URI) ||
          `${getSafePublicBaseUrl().replace(/\/$/, "")}/callbacks/x`;

        const basic = btoa(`${clientId}:${clientSecret}`);
        const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basic}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: verified.codeVerifier,
          }),
        });
        if (!tokenRes.ok) {
          const txt = await tokenRes.text();
          console.error("X token exchange failed", tokenRes.status, txt);
          return redirect("error:token_exchange");
        }
        const tok: any = await tokenRes.json();
        const accessToken: string = tok.access_token;
        const refreshToken: string | undefined = tok.refresh_token;
        const expiresIn: number = tok.expires_in || 7200;
        const scopes: string = tok.scope || "";

        let username = "X account";
        let platformUserId = "";
        try {
          const meRes = await fetch("https://api.x.com/2/users/me?user.fields=username,name", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (meRes.ok) {
            const j: any = await meRes.json();
            platformUserId = j?.data?.id || "";
            username = j?.data?.username ? `@${j.data.username}` : j?.data?.name || username;
          }
        } catch {
          /* non-fatal */
        }
        if (!platformUserId) return redirect("error:no_user_id");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        const { data: existing } = await supabaseAdmin
          .from("social_accounts")
          .select("id, refresh_token")
          .eq("user_id", verified.userId)
          .eq("platform", "twitter")
          .maybeSingle();

        if (existing) {
          await supabaseAdmin
            .from("social_accounts")
            .update({
              access_token: accessToken,
              refresh_token: refreshToken || existing.refresh_token || undefined,
              token_expires_at: tokenExpiresAt,
              scopes,
              platform_user_id: platformUserId,
              platform_username: username,
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin.from("social_accounts").insert({
            user_id: verified.userId,
            platform: "twitter",
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
            token_expires_at: tokenExpiresAt,
            scopes,
            platform_user_id: platformUserId,
            platform_username: username,
          } as any);
        }

        return redirect("connected");
      },
    },
  },
});
