/**
 * Instagram webhook receiver (comments, mentions, messages).
 *
 * URL:          https://postspark.co/api/public/webhooks/instagram
 * Verify token: INSTAGRAM_WEBHOOK_VERIFY_TOKEN
 *
 * GET  → Meta subscription handshake (echoes hub.challenge)
 * POST → signed delivery (X-Hub-Signature-256 = HMAC-SHA256 of the raw body
 *        using the Instagram App Secret)
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

export const Route = createFileRoute("/api/public/webhooks/instagram")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge") ?? "";
        const expected =
          process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && expected && token === expected) {
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const secret = process.env.INSTAGRAM_APP_SECRET;
        const raw = await request.text();
        if (!secret || !verifySignature(raw, request.headers.get("x-hub-signature-256"), secret)) {
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
          const entries: any[] = payload?.entry || [];
          for (const entry of entries) {
            const changes: any[] = entry?.changes || [];
            const messaging: any[] = entry?.messaging || [];
            for (const change of changes) {
              await supabase.from("webhook_events").insert({
                platform: "instagram",
                event_type: change?.field || "change",
                payload: { entry_id: entry?.id ?? null, value: change?.value ?? null },
                processed: false,
              });
            }
            for (const message of messaging) {
              await supabase.from("webhook_events").insert({
                platform: "instagram",
                event_type: "message",
                payload: { entry_id: entry?.id ?? null, value: message },
                processed: false,
              });
            }
          }
        } catch (e) {
          console.error("[instagram-webhook] store failed", e);
        }

        // Always 200 so Meta doesn't disable the subscription.
        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});
