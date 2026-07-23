/**
 * Cron worker: publish due X (Twitter) scheduled_posts.
 *
 * Auth: `apikey: <SUPABASE_ANON_KEY>` header. This route lives under
 * `/api/public/*` so it bypasses site-level auth; the anon key check keeps
 * random callers out. The pg_cron job is configured to send this header.
 *
 * Strategy:
 *  1) Select up to N due rows where platform='twitter' and status='scheduled'.
 *  2) For each row, atomically transition status 'scheduled' -> 'publishing'
 *     (guards against double-publish if two workers overlap).
 *  3) Publish via helper. On success mark 'published' with platform_post_id.
 *     On failure mark 'failed' with publish_error (bounded).
 */
import { createFileRoute } from "@tanstack/react-router";

const BATCH_SIZE = 15; // per invocation; cron runs every minute
const MAX_ERR_LEN = 500;

export const Route = createFileRoute("/api/public/hooks/publish-scheduled-x")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided =
          request.headers.get("apikey") ||
          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        if (!anonKey || provided !== anonKey) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { publishTweetForUser } = await import("@/lib/xPublish.server");

        const now = new Date().toISOString();
        const { data: due, error: selErr } = await supabaseAdmin
          .from("scheduled_posts")
          .select("id, user_id, content, media_url")
          .eq("platform", "twitter")
          .eq("status", "scheduled")
          .lte("scheduled_for", now)
          .order("scheduled_for", { ascending: true })
          .limit(BATCH_SIZE);

        if (selErr) {
          console.error("[cron-x] select error", selErr);
          return new Response(JSON.stringify({ error: selErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const rows = due ?? [];
        let published = 0;
        let failed = 0;
        let skipped = 0;

        for (const row of rows) {
          // Atomic claim: only proceed if we can flip scheduled -> publishing.
          const { data: claimed, error: claimErr } = await supabaseAdmin
            .from("scheduled_posts")
            .update({ status: "publishing" })
            .eq("id", row.id)
            .eq("status", "scheduled")
            .select("id")
            .maybeSingle();
          if (claimErr || !claimed) {
            skipped++;
            continue;
          }

          const mediaUrls = row.media_url ? [row.media_url] : [];
          try {
            const out = await publishTweetForUser(supabaseAdmin, row.user_id, {
              text: row.content || "",
              mediaUrls,
            });
            if (out.error || !out.tweetId) {
              failed++;
              await supabaseAdmin
                .from("scheduled_posts")
                .update({
                  status: "failed",
                  publish_error: (out.error || "unknown error").slice(0, MAX_ERR_LEN),
                })
                .eq("id", row.id);
              continue;
            }
            published++;
            await supabaseAdmin
              .from("scheduled_posts")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
                platform_post_id: out.tweetId,
                media_url: out.url || row.media_url,
                publish_error: null,
              })
              .eq("id", row.id);
          } catch (e: any) {
            failed++;
            console.error("[cron-x] publish threw", row.id, e);
            await supabaseAdmin
              .from("scheduled_posts")
              .update({
                status: "failed",
                publish_error: (e?.message || "exception").slice(0, MAX_ERR_LEN),
              })
              .eq("id", row.id);
          }
        }

        return new Response(
          JSON.stringify({
            ok: true,
            found: rows.length,
            published,
            failed,
            skipped,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
