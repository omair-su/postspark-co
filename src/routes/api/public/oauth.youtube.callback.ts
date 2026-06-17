import { createFileRoute } from "@tanstack/react-router";
import { verifyOAuthState } from "@/lib/socialPublish.functions";

export const Route = createFileRoute("/api/public/oauth/youtube/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const base = process.env.PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
        const redirect = (msg: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${base}/dashboard/shorts-studio?yt=${encodeURIComponent(msg)}` },
          });

        if (error) return redirect(`error:${error}`);
        if (!code || !state) return redirect("error:missing_params");

        const verified = verifyOAuthState(state);
        if (!verified) return redirect("error:invalid_state");

        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
        if (!clientId || !clientSecret) return redirect("error:not_configured");

        const redirectUri = `${(process.env.PUBLIC_BASE_URL || "https://postspark.co").replace(/\/$/, "")}/api/public/oauth/youtube/callback`;

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });
        if (!tokenRes.ok) {
          const txt = await tokenRes.text();
          console.error("YT token exchange failed", tokenRes.status, txt);
          return redirect("error:token_exchange");
        }
        const tok = await tokenRes.json();
        const accessToken: string = tok.access_token;
        const refreshToken: string | undefined = tok.refresh_token;
        const expiresIn: number = tok.expires_in || 3600;
        const scopes: string = tok.scope || "";

        // Fetch the channel for display
        let channelName = "YouTube channel";
        let channelId = "";
        try {
          const ch = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (ch.ok) {
            const j = await ch.json();
            channelName = j?.items?.[0]?.snippet?.title || channelName;
            channelId = j?.items?.[0]?.id || "";
          }
        } catch (e) { /* non-fatal */ }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        // upsert by (user_id, platform)
        const { data: existing } = await supabaseAdmin
          .from("social_accounts")
          .select("id, refresh_token")
          .eq("user_id", verified.userId)
          .eq("platform", "youtube")
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from("social_accounts").update({
            access_token: accessToken,
            refresh_token: refreshToken || existing.refresh_token,
            token_expires_at: tokenExpiresAt,
            scopes,
            platform_user_id: channelId || null,
            platform_username: channelName,
          }).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("social_accounts").insert({
            user_id: verified.userId,
            platform: "youtube",
            access_token: accessToken,
            refresh_token: refreshToken || null,
            token_expires_at: tokenExpiresAt,
            scopes,
            platform_user_id: channelId || null,
            platform_username: channelName,
          } as any);
        }

        return redirect("connected");
      },
    },
  },
});
