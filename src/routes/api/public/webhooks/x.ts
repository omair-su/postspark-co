/**
 * X (Twitter) webhook handler.
 *
 * Handles:
 *  - CRC challenge (GET) for webhook registration
 *  - user.revoke events (POST) — user removed PostSpark from their X account
 *
 * Security:
 *  - Signature verification uses HMAC-SHA256 of the raw body with X_CLIENT_SECRET,
 *    compared against `x-twitter-webhooks-signature: sha256=<hex>`.
 *  - Public route (bypasses site auth) — signature check keeps random callers out.
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

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  try {
    const provided = header.replace(/^sha256=/i, "");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhooks/x")({
  server: {
    handlers: {
      // CRC challenge for webhook registration.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const crcToken = url.searchParams.get("crc_token");
        const secret = process.env.X_CLIENT_SECRET;
        if (!crcToken || !secret) {
          return new Response(JSON.stringify({ error: "missing crc_token or secret" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const responseToken = createHmac("sha256", secret).update(crcToken).digest("base64");
        return new Response(
          JSON.stringify({ response_token: `sha256=${responseToken}` }),
          { headers: { "Content-Type": "application/json" } },
        );
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();
        const secret = process.env.X_CLIENT_SECRET;
        if (!secret) {
          return new Response(JSON.stringify({ error: "not configured" }), { status: 500 });
        }
        const sig = request.headers.get("x-twitter-webhooks-signature");
        if (!verifySignature(rawBody, sig, secret)) {
          return new Response(JSON.stringify({ error: "invalid signature" }), { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
        }

        const supabase = admin();

        // user.revoke: user removed the app.
        // Shape: { user_event: { revoke: { source: { user_id: "..." }, target: { app_id: "..." } } } }
        const revoke = event?.user_event?.revoke;
        if (revoke) {
          const platformUserId = String(revoke?.source?.user_id ?? "");
          if (platformUserId) {
            const { error } = await supabase
              .from("social_accounts")
              .delete()
              .eq("platform", "twitter")
              .eq("platform_user_id", platformUserId);
            if (error) console.error("[x-webhook] revoke delete error", error);
          }
          return new Response(JSON.stringify({ ok: true, event: "user.revoke" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true, ignored: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
