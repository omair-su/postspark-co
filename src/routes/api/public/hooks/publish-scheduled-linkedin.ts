/**
 * Cron worker: publish due LinkedIn scheduled_posts.
 *
 * Auth: requires the Supabase service role key in the `apikey` (or
 * `Authorization: Bearer`) header — the anon key is public and cannot gate this.
 */
import { createFileRoute } from "@tanstack/react-router";

const BATCH_SIZE = 10;
const MAX_ERR_LEN = 500;

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
        const { publishLinkedInForUser } = await import("@/lib/linkedinPublish.server");

        const now = new Date().toISOString();
        const { data: due, error: selErr } = await supabaseAdmin
          .from("scheduled_posts")
          .select("id, user_id, content, media_url, media_urls, media_type, first_comment")
          .eq("platform", "linkedin")
          .eq("status", "scheduled")
          .lte("scheduled_for", now)
          .order("scheduled_for", { ascending: true })
          .limit(BATCH_SIZE);

        if (selErr) {
          console.error("[cron-linkedin] select error", selErr);
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
          const { data: claimed } = await supabaseAdmin
            .from("scheduled_posts")
            .update({ status: "publishing" })
            .eq("id", row.id)
            .eq("status", "scheduled")
            .select("id")
            .maybeSingle();
          if (!claimed) {
            skipped++;
            continue;
          }

          const arr = Array.isArray((row as any).media_urls)
            ? ((row as any).media_urls as string[]).filter((u) => typeof u === "string")
            : [];
          const mediaPaths = arr.length ? arr : row.media_url ? [row.media_url] : [];

          try {
            const out = await publishLinkedInForUser(supabaseAdmin, row.user_id, {
              content: row.content || "",
              mediaPaths,
              mediaType: (row as any).media_type ?? null,
              firstComment: (row as any).first_comment ?? null,
            });
            if (out.error) {
              failed++;
              await supabaseAdmin
                .from("scheduled_posts")
                .update({ status: "failed", publish_error: out.error.slice(0, MAX_ERR_LEN) })
                .eq("id", row.id);
              continue;
            }
            published++;
            await supabaseAdmin
              .from("scheduled_posts")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
                platform_post_id: out.postId ?? null,
                publish_error: out.commentError
                  ? `Post published, first comment failed: ${out.commentError}`.slice(0, MAX_ERR_LEN)
                  : null,
              })
              .eq("id", row.id);
          } catch (e: any) {
            failed++;
            console.error("[cron-linkedin] publish threw", row.id, e);
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
          JSON.stringify({ ok: true, found: rows.length, published, failed, skipped }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
