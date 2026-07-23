/**
 * Meta Graph API webhook receiver.
 *
 *  Verify (GET):  Meta calls with ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 *                 We echo hub.challenge if the verify token matches META_WEBHOOK_VERIFY_TOKEN.
 *
 *  Events (POST): Meta signs the raw body with the app secret.
 *                 Header:  X-Hub-Signature-256: sha256=<hex>
 *                 We verify HMAC-SHA256, then store the event in webhook_events.
 *
 * URL to paste in Meta dashboard: https://postspark.co/api/webhooks/meta
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header) return false;
  try {
    const provided = header.replace(/^sha256=/i, "");
    const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhooks/meta")({
  server: {
    handlers: {
      // Verify handshake: Meta calls this once when you set up the webhook.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();
        const appSecret = process.env.META_APP_SECRET;
        if (!appSecret) {
          console.error("[meta-webhook] META_APP_SECRET not configured");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        const sig = request.headers.get("x-hub-signature-256");
        const valid = verifyMetaSignature(rawBody, sig, appSecret);

        let payload: any = {};
        try {
          payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          payload = { _raw: rawBody };
        }

        const supabase = admin();
        const object = payload?.object || "unknown";
        const entries: any[] = payload?.entry || [];

        // Store one row per top-level entry so we can display them individually.
        try {
          if (entries.length) {
            for (const entry of entries) {
              const changes: any[] = entry?.changes || entry?.messaging || [entry];
              for (const change of changes) {
                await supabase.from("webhook_events").insert({
                  platform: object,
                  event_type: change?.field || change?.event || "update",
                  payload: { entry, change },
                  signature: sig || null,
                  processed: valid,
                  error_message: valid ? null : "invalid_signature",
                });
              }
            }
          } else {
            await supabase.from("webhook_events").insert({
              platform: object,
              event_type: "ping",
              payload,
              signature: sig || null,
              processed: valid,
              error_message: valid ? null : "invalid_signature",
            });
          }
        } catch (e) {
          console.error("[meta-webhook] insert error", e);
        }

        // Meta expects a 200 quickly; retry storm otherwise.
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
