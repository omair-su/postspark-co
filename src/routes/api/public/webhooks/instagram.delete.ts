/**
 * Instagram Deauthorize + Data Deletion callback.
 *
 * Meta POSTs a signed_request here when a user removes PostSpark from their
 * Instagram account or requests deletion of their data. We delete their
 * Instagram connection plus Instagram publishing history.
 *
 * URL (both fields in the Meta dashboard):
 *   https://postspark.co/api/public/webhooks/instagram/delete
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

export const Route = createFileRoute("/api/public/webhooks/instagram/delete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const appSecret = process.env.INSTAGRAM_APP_SECRET;
        const form = await request.formData().catch(() => null);
        const signed = form?.get("signed_request");
        const confirmation = Math.random().toString(36).slice(2, 12);
        const respond = () =>
          new Response(
            JSON.stringify({
              url: "https://postspark.co/privacy",
              confirmation_code: confirmation,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );

        if (!appSecret || typeof signed !== "string") return respond();
        const parsed = parseSignedRequest(signed, appSecret);
        const igUserId = parsed?.user_id ? String(parsed.user_id) : null;
        if (!igUserId) return respond();

        try {
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } },
          );
          const { data: accounts } = await supabase
            .from("social_accounts")
            .select("id, user_id")
            .eq("platform", "instagram")
            .eq("platform_user_id", igUserId);

          for (const acct of accounts || []) {
            await supabase
              .from("publishing_logs")
              .delete()
              .eq("user_id", acct.user_id)
              .eq("platform", "instagram");
            await supabase
              .from("scheduled_posts")
              .delete()
              .eq("user_id", acct.user_id)
              .eq("platform", "instagram");
            await supabase.from("social_accounts").delete().eq("id", acct.id);
          }
        } catch (e) {
          console.error("[instagram-delete] cleanup failed", e);
        }

        return respond();
      },
    },
  },
});
