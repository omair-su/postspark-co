// WhatsApp Cloud API helper (server-only).
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

export const WHATSAPP_API_VERSION = "v21.0";

export type WaEventType =
  | "post_published"
  | "post_failed"
  | "scheduled_reminder"
  | "approval_request"
  | "account_connected"
  | "subscription";

export function normalizePhone(input: string): string {
  const digits = (input || "").replace(/[^\d]/g, "");
  return digits;
}

interface SendParams {
  to: string; // E.164 without '+'
  body: string;
}

/**
 * Sends a plain text message via the WhatsApp Cloud API. In practice,
 * business-initiated messages require approved templates; freeform text
 * only works inside the 24h customer service window. We ship both:
 * - `sendWhatsAppText` for testing/session messages
 * - `sendWhatsAppTemplate` for production notifications
 */
export async function sendWhatsAppText({ to, body }: SendParams): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, error: "WhatsApp not configured" };
  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: true, body },
        }),
      },
    );
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    const messageId = data?.messages?.[0]?.id;
    return { ok: true, messageId };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export async function sendWhatsAppTemplate(params: {
  to: string;
  template: string;
  lang?: string;
  bodyParams?: string[];
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, error: "WhatsApp not configured" };
  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.to,
          type: "template",
          template: {
            name: params.template,
            language: { code: params.lang || "en_US" },
            components: params.bodyParams?.length
              ? [
                  {
                    type: "body",
                    parameters: params.bodyParams.map((v) => ({ type: "text", text: v })),
                  },
                ]
              : [],
          },
        }),
      },
    );
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

// Server-side notification templates (rendered as plain text — the actual
// WhatsApp approved template controls the final wording in production).
export function renderNotificationBody(
  event: WaEventType,
  data: Record<string, string> = {},
): string {
  switch (event) {
    case "post_published":
      return `✅ PostSpark: Your ${data.platform || "post"} was published${
        data.url ? ` — ${data.url}` : ""
      }.`;
    case "post_failed":
      return `⚠️ PostSpark: Publishing to ${data.platform || "your account"} failed. ${
        data.reason || "Tap the app to retry."
      }`;
    case "scheduled_reminder":
      return `⏰ PostSpark reminder: "${data.title || "Scheduled post"}" goes live ${
        data.when || "soon"
      }.`;
    case "approval_request":
      return `📝 PostSpark: A client approval request is waiting for you. ${data.url || ""}`;
    case "account_connected":
      return `🔗 PostSpark: ${data.platform || "Your account"} is now connected.`;
    case "subscription":
      return `💳 PostSpark: ${data.message || "Subscription update."}`;
  }
}
