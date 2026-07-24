/**
 * Facebook OAuth return URL — the exact path registered in the Meta dashboard.
 *
 *   https://postspark.co/auth/facebook/callback
 *
 * Meta calls this with ?code=... and ?state=... after the user approves.
 * We verify the state, exchange the code server-side, fetch Pages, then
 * redirect back to /dashboard/settings.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { verifyMetaOAuthState, completeMetaOAuth } from "@/lib/metaPublish.functions";
import { getSafePublicBaseUrl } from "@/lib/siteUrls";

export const Route = createFileRoute("/auth/facebook/callback")({
  head: () => ({
    meta: [
      { title: "Connecting Facebook — PostSpark" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const base = getSafePublicBaseUrl().replace(/\/$/, "");

        if (err || !code || !state) {
          const q = encodeURIComponent(err || "missing_code");
          console.error("[meta-callback] OAuth returned an error or missing parameters", {
            error: err,
            hasCode: Boolean(code),
            hasState: Boolean(state),
            requestUrl: url.toString(),
          });
          return Response.redirect(`${base}/dashboard/settings?facebook=error:${q}`, 302);
        }
        const verified = await verifyMetaOAuthState(state);
        if (!verified) {
          console.error("[meta-callback] invalid OAuth state", { requestUrl: url.toString() });
          return Response.redirect(`${base}/dashboard/settings?facebook=error:invalid_state`, 302);
        }
        const result = await completeMetaOAuth(code, verified.userId);
        if (!result.ok) {
          const q = encodeURIComponent(result.error || "connect_failed");
          console.error("[meta-callback] OAuth completion failed", result);
          return Response.redirect(`${base}/dashboard/settings?facebook=error:${q}`, 302);
        }
        return Response.redirect(`${base}/dashboard/settings?facebook=connected`, 302);
      },
    },
  },
  component: () => null,
});
