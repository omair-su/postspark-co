/**
 * Canva OAuth return URL — the exact path registered in the Canva Developer
 * dashboard under Authentication → Authorized redirects:
 *
 *   https://postspark.co/auth/canva/callback
 */
import { createFileRoute } from "@tanstack/react-router";
import { completeCanvaOAuth } from "@/lib/canvaOps.server";
import { getSafePublicBaseUrl } from "@/lib/siteUrls";

export const Route = createFileRoute("/auth/canva/callback")({
  head: () => ({
    meta: [
      { title: "Connecting Canva — PostSpark" },
      { name: "description", content: "Finishing your Canva connection for PostSpark." },
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
        const dest = `${base}/dashboard/settings/canva`;

        if (err || !code || !state) {
          const q = encodeURIComponent(err || "missing_code");
          return Response.redirect(`${dest}?canva=error:${q}`, 302);
        }

        const result = await completeCanvaOAuth(code, state);
        if (!result.ok) {
          return Response.redirect(
            `${dest}?canva=error:${encodeURIComponent(result.error || "connect_failed")}`,
            302,
          );
        }
        return Response.redirect(`${dest}?canva=connected`, 302);
      },
    },
  },
  component: () => null,
});
