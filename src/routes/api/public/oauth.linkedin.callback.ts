import { createFileRoute } from "@tanstack/react-router";
import { verifyOAuthState } from "@/lib/socialPublish.functions";

export const Route = createFileRoute("/api/public/oauth/linkedin/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const errDesc = url.searchParams.get("error_description");
        const base = process.env.PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
        const redirect = (msg: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${base}/dashboard/settings?linkedin=${encodeURIComponent(msg)}` },
          });

        if (err) return redirect(`error:${errDesc || err}`);
        if (!code || !state) return redirect("error:missing_params");

        const verified = await verifyOAuthState(state);
        if (!verified) return redirect("error:invalid_state");

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        if (!clientId || !clientSecret) return redirect("error:not_configured");

        const redirectUri = `${(process.env.PUBLIC_BASE_URL || "https://postspark.co").replace(/\/$/, "")}/api/public/oauth/linkedin/callback`;

        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        if (!tokenRes.ok) {
          const txt = await tokenRes.text();
          console.error("LinkedIn token exchange failed", tokenRes.status, txt);
          return redirect("error:token_exchange");
        }
        const tok = await tokenRes.json();
        const accessToken: string = tok.access_token;
        const expiresIn: number = tok.expires_in || 5184000; // ~60 days
        const scopes: string = tok.scope || "";

        // Fetch OIDC userinfo for member urn + display name
        let sub: string | null = null;
        let name = "LinkedIn account";
        let email: string | null = null;
        try {
          const infoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (infoRes.ok) {
            const j = await infoRes.json();
            sub = j?.sub || null;
            name = j?.name || j?.given_name || name;
            email = j?.email || null;
          }
        } catch {
          /* non-fatal */
        }
        if (!sub) return redirect("error:no_member_id");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
        const platformUserId = `urn:li:person:${sub}`;

        const { data: existing } = await supabaseAdmin
          .from("social_accounts")
          .select("id")
          .eq("user_id", verified.userId)
          .eq("platform", "linkedin")
          .maybeSingle();

        const row = {
          user_id: verified.userId,
          platform: "linkedin",
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          scopes,
          platform_user_id: platformUserId,
          platform_username: name,
          platform_email: email,
        } as any;

        if (existing) {
          await supabaseAdmin.from("social_accounts").update(row).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("social_accounts").insert(row);
        }

        return redirect("connected");
      },
    },
  },
});
