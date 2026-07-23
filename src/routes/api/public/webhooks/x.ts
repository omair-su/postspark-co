import { createFileRoute } from "@tanstack/react-router";

/**
 * X (Twitter) webhook receiver.
 *
 * Handles Account Activity `user.revoke` events (user removed PostSpark
 * from their authorized apps in X settings) by disconnecting the stored
 * social account. Verifies signature via HMAC-SHA256 of the raw request
 * body using X_CLIENT_SECRET.
 *
 * Also implements the CRC challenge for X's webhook subscription check.
 */

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacBase64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/webhooks/x")({
  server: {
    handlers: {
      // CRC challenge — X pings this to verify the webhook.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const crc = url.searchParams.get("crc_token");
        const secret = process.env.X_CLIENT_SECRET;
        if (!crc || !secret) {
          return new Response("missing crc_token or secret", { status: 400 });
        }
        const token = "sha256=" + (await hmacBase64(secret, crc));
        return Response.json({ response_token: token });
      },

      POST: async ({ request }) => {
        const secret = process.env.X_CLIENT_SECRET;
        if (!secret) return new Response("not configured", { status: 500 });

        const rawBody = await request.text();
        const provided =
          request.headers.get("x-twitter-webhooks-signature") ||
          request.headers.get("x-hub-signature-256") ||
          request.headers.get("x-signature") ||
          "";

        const expectedHex = await hmacHex(secret, rawBody);
        const expectedB64 = "sha256=" + (await hmacBase64(secret, rawBody));

        const norm = provided.replace(/^sha256=/, "").toLowerCase();
        const ok =
          timingSafeEqualHex(norm, expectedHex) || provided === expectedB64;
        if (!ok) {
          console.warn("[x-webhook] invalid signature");
          return new Response("invalid signature", { status: 401 });
        }

        let payload: any = null;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        // Persist for debugging (best-effort).
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const revoke = payload?.user_event?.revoke || payload?.revoke || null;
          if (revoke) {
            const platformUserId = String(
              revoke?.source?.user_id ?? revoke?.target?.user_id ?? revoke?.user_id ?? "",
            );
            if (platformUserId) {
              await supabaseAdmin
                .from("social_accounts")
                .delete()
                .eq("platform", "twitter")
                .eq("platform_user_id", platformUserId);
              console.log("[x-webhook] revoked", platformUserId);
            }
          }
        } catch (e) {
          console.error("[x-webhook] processing error", e);
        }

        return new Response("ok");
      },
    },
  },
});
