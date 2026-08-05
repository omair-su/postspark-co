/**
 * Instagram OAuth return URL — register this exact value in the Meta dashboard
 * under Instagram → API setup with Instagram login → Business login settings:
 *
 *   https://postspark.co/auth/instagram/callback
 */
import { createFileRoute } from "@tanstack/react-router";
import { completeInstagramOAuth, verifyInstagramState } from "@/lib/instagram.server";
import { getSafePublicBaseUrl } from "@/lib/siteUrls";

export const Route = createFileRoute("/auth/instagram/callback")({
  head: () => ({
    meta: [
      { title: "Connecting Instagram — PostSpark" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error_description") || url.searchParams.get("error");
        const base = getSafePublicBaseUrl().replace(/\/$/, "");
        const back = (q: string) => Response.redirect(`${base}/dashboard/instagram?instagram=${q}`, 302);

        if (err || !code || !state) {
          console.error("[instagram-callback] missing params", { err, hasCode: Boolean(code) });
          return back(`error:${encodeURIComponent(err || "missing_code")}`);
        }
        const verified = await verifyInstagramState(state);
        if (!verified) {
          console.error("[instagram-callback] invalid state");
          return back("error:invalid_state");
        }
        const result = await completeInstagramOAuth(code, verified.userId);
        if (!result.ok) {
          console.error("[instagram-callback] completion failed", result.error);
          return back(`error:${encodeURIComponent(result.error || "connect_failed")}`);
        }
        return back("connected");
      },
    },
  },
  component: () => null,
});
