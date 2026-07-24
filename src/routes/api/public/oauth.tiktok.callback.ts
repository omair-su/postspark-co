import { createFileRoute } from "@tanstack/react-router";
import { verifyOAuthState } from "@/lib/socialPublish.functions";
import { getSafePublicBaseUrl } from "@/lib/siteUrls";

export const Route = createFileRoute("/api/public/oauth/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const base = getSafePublicBaseUrl();
        const redirect = (msg: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${base}/dashboard/settings?tiktok=${encodeURIComponent(msg)}` },
          });

        if (err) return redirect(`error:${err}`);
        if (!code || !state) return redirect("error:missing_params");

        const verified = await verifyOAuthState(state);
        if (!verified) return redirect("error:invalid_state");

        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        if (!clientKey || !clientSecret) return redirect("error:not_configured");

        const redirectUri = `${getSafePublicBaseUrl().replace(/\/$/, "")}/api/public/oauth/tiktok/callback`;

        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });
        if (!tokenRes.ok) {
          const txt = await tokenRes.text();
          console.error("TikTok token exchange failed", tokenRes.status, txt);
          return redirect("error:token_exchange");
        }
        const tok = await tokenRes.json();
        const accessToken: string = tok.access_token;
        const refreshToken: string | undefined = tok.refresh_token;
        const openId: string | undefined = tok.open_id;
        const expiresIn: number = tok.expires_in || 86400;
        const scopes: string = tok.scope || "";

        // Fetch display name for UI
        let username = "TikTok account";
        try {
          const infoRes = await fetch(
            "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,username",
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          if (infoRes.ok) {
            const j = await infoRes.json();
            username = j?.data?.user?.username || j?.data?.user?.display_name || username;
          }
        } catch {
          /* non-fatal */
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        const { data: existing } = await supabaseAdmin
          .from("social_accounts")
          .select("id, refresh_token")
          .eq("user_id", verified.userId)
          .eq("platform", "tiktok")
          .maybeSingle();

        if (existing) {
          await supabaseAdmin
            .from("social_accounts")
            .update({
              access_token: accessToken,
              refresh_token: refreshToken || existing.refresh_token || undefined,
              token_expires_at: tokenExpiresAt,
              scopes,
              platform_user_id: openId || undefined,
              platform_username: username,
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin.from("social_accounts").insert({
            user_id: verified.userId,
            platform: "tiktok",
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
            token_expires_at: tokenExpiresAt,
            scopes,
            platform_user_id: openId || undefined,
            platform_username: username,
          } as any);
        }

        return redirect("connected");
      },
    },
  },
});
