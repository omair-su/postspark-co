/**
 * Meta Deauthorize + Data Deletion callback.
 *
 * When a user removes PostSpark from their Facebook account, Meta POSTs
 * a signed request here. We delete tokens + pages for that user.
 *
 * URL: https://postspark.co/api/webhooks/meta/deauthorize
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

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const Route = createFileRoute("/api/public/webhooks/meta/deauthorize")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const appSecret = process.env.META_APP_SECRET;
        if (!appSecret) return new Response(JSON.stringify({ ok: true }), { status: 200 });

        const form = await request.formData().catch(() => null);
        const signed = form?.get("signed_request");
        if (!signed || typeof signed !== "string") {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        const parsed = parseSignedRequest(signed, appSecret);
        const metaUserId = parsed?.user_id as string | undefined;
        if (!metaUserId) return new Response(JSON.stringify({ ok: true }), { status: 200 });

        const supabase = admin();
        // Delete tokens + pages for this Meta user id
        await supabase
          .from("social_accounts")
          .delete()
          .eq("platform_user_id", metaUserId)
          .in("platform", ["facebook", "instagram", "threads"]);
        await supabase
          .from("social_pages")
          .delete()
          .eq("platform", "facebook")
          // no direct FK to meta user; page rows are deleted when parent social_accounts is deleted
          // via the ON DELETE CASCADE on social_account_id.
          .is("social_account_id", null);

        // Meta expects a JSON body with a confirmation URL + code so the user
        // can check deletion status. We reuse our data-deletion page.
        const confirmationCode = Buffer.from(metaUserId).toString("hex");
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
