/**
 * Threads Uninstall callback — Meta POSTs a signed_request here when a user
 * deauthorizes PostSpark's Threads app. We remove their Threads token.
 *
 * URL: https://postspark.co/api/public/webhooks/threads/uninstall
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

function parseSignedRequest(signed: string, appSecret: string): any | null {
  const [encSig, encPayload] = signed.split(".");
  if (!encSig || !encPayload) return null;
  const sig = base64UrlDecode(encSig);
  const expected = createHmac("sha256", appSecret).update(encPayload).digest();
  if (sig.length !== expected.length || !sig.equals(expected)) return null;
  try {
    return JSON.parse(base64UrlDecode(encPayload).toString("utf8"));
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/webhooks/threads/uninstall")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const appSecret = process.env.META_THREADS_APP_SECRET;
        const form = await request.formData().catch(() => null);
        const signed = form?.get("signed_request");
        if (!appSecret || typeof signed !== "string") {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        const parsed = parseSignedRequest(signed, appSecret);
        const threadsUserId = parsed?.user_id ? String(parsed.user_id) : null;
        if (!threadsUserId) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } },
        );
        await supabase
          .from("social_accounts")
          .delete()
          .eq("platform", "threads")
          .eq("platform_user_id", threadsUserId);

        const confirmationCode = Buffer.from(threadsUserId).toString("hex");
        return new Response(
          JSON.stringify({
            url: `https://postspark.co/data-deletion?ref=${confirmationCode}`,
            confirmation_code: confirmationCode,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
