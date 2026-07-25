/**
 * Threads OAuth return URL — the exact path registered in the Meta dashboard
 * under the Threads use case:
 *
 *   https://postspark.co/auth/threads/callback
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyMetaOAuthState, completeThreadsOAuth } from "@/lib/metaPublish.functions";
import { getSafePublicBaseUrl } from "@/lib/siteUrls";

export const Route = createFileRoute("/auth/threads/callback")({
  head: () => ({
    meta: [
      { title: "Connecting Threads — PostSpark" },
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
          console.error("[threads-callback] error or missing params", {
            error: err,
            hasCode: Boolean(code),
            hasState: Boolean(state),
          });
          return Response.redirect(
            `${base}/dashboard/settings/threads?threads=error:${q}`,
            302,
          );
        }
        const verified = await verifyMetaOAuthState(state);
        if (!verified) {
          console.error("[threads-callback] invalid state");
          return Response.redirect(
            `${base}/dashboard/settings/threads?threads=error:invalid_state`,
            302,
          );
        }
        const result = await completeThreadsOAuth(code, verified.userId);
        if (!result.ok) {
          const q = encodeURIComponent(result.error || "connect_failed");
          console.error("[threads-callback] completion failed", result);
          return Response.redirect(
            `${base}/dashboard/settings/threads?threads=error:${q}`,
            302,
          );
        }
        return Response.redirect(
          `${base}/dashboard/settings/threads?threads=connected`,
          302,
        );
      },
    },
  },
  component: () => null,
});
