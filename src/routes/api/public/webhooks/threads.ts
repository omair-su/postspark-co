/**
 * Threads webhook receiver (Threads use case → Webhooks with Threads).
 *
 * URL:  https://postspark.co/api/public/webhooks/threads
 * Verify token: THREADS_WEBHOOK_VERIFY_TOKEN (falls back to META_WEBHOOK_VERIFY_TOKEN)
 *
 * GET  → Meta subscription handshake (hub.challenge echo)
 * POST → signed event delivery (X-Hub-Signature-256, HMAC of raw body with the
 *        Threads App Secret)
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function verifySignature(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const got = Buffer.from(header.slice(7), "utf8");
  const exp = Buffer.from(expected, "utf8");
  return got.length === exp.length && timingSafeEqual(got, exp);
}

export const Route = createFileRoute("/api/public/webhooks/threads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge") ?? "";
        const expected =
          process.env.THREADS_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && expected && token === expected) {
          return new Response(challenge, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const secret = process.env.META_THREADS_APP_SECRET;
        const raw = await request.text();
        if (
          !secret ||
          !verifySignature(raw, request.headers.get("x-hub-signature-256"), secret)
        ) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any = null;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        try {
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } },
          );
          for (const entry of payload?.entry ?? []) {
            const threadsUserId = entry?.id != null ? String(entry.id) : null;
            let userId: string | null = null;
            if (threadsUserId) {
              const { data } = await supabase
                .from("social_accounts")
                .select("user_id")
                .eq("platform", "threads")
                .eq("platform_user_id", threadsUserId)
                .maybeSingle();
              userId = data?.user_id ?? null;
            }
            if (!userId) continue;
            await supabase.from("publishing_logs").insert({
              user_id: userId,
              platform: "threads",
              action: "webhook",
              status: "success",
              response_payload: entry,
            });
          }
        } catch (e) {
          console.error("[threads-webhook] processing failed", e);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
