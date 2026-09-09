/**
 * Cron sweep for background image renders.
 *
 * A render whose tab was closed or cancelled still finishes upstream; this
 * endpoint claims those `image_jobs` rows, saves the finished image to the
 * owner's library and settles the reserved credit. Service-role bearer only.
 */
import { createFileRoute } from "@tanstack/react-router";
import { sweepImageJobs } from "@/lib/imageJobs.server";

export const Route = createFileRoute("/api/public/cron/image-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        const auth = request.headers.get("authorization") || "";
        if (!expected || auth !== `Bearer ${expected}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        const out = await sweepImageJobs(25);
        return new Response(JSON.stringify(out), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
