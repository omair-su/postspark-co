/**
 * Cron worker: publish due LinkedIn scheduled_posts.
 *
 * Auth: requires the Supabase service role key in the `apikey` (or
 * `Authorization: Bearer`) header — the anon key is public and cannot gate this.
 */
import { createFileRoute } from "@tanstack/react-router";
import { processScheduledPosts } from "@/lib/scheduledPublishing.server";

export const Route = createFileRoute("/api/public/hooks/publish-scheduled-linkedin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const provided =
          request.headers.get("apikey") ||
          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        if (!serviceKey || !provided || provided !== serviceKey) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Compatibility endpoint: the existing cron now drives the unified worker.
        const summary = await processScheduledPosts(supabaseAdmin);
        return Response.json({ ok: true, ...summary });
      },
    },
  },
});
