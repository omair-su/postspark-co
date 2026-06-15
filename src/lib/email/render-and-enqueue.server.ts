// Server-only helper to render a registered email template and enqueue it
// directly into the transactional pgmq queue (bypasses the auth-gated
// /lovable/email/transactional/send route — for use by cron hooks and
// admin server functions that already hold service-role credentials).
import * as React from "react";
import { render } from "@react-email/components";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "PostSpark";
const SENDER_DOMAIN = "hello.postspark.co";
const FROM_DOMAIN = "postspark.co";

function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface SendOpts {
  templateName: string;
  to: string;
  templateData?: Record<string, any>;
  idempotencyKey: string;
  /** Service-role Supabase client. */
  supabase: any;
}

export async function renderAndEnqueueEmail({ templateName, to, templateData = {}, idempotencyKey, supabase }: SendOpts): Promise<{ status: "queued" | "duplicate" | "suppressed" | "error"; reason?: string }> {
  const template = TEMPLATES[templateName];
  if (!template) return { status: "error", reason: `Unknown template ${templateName}` };

  const recipient = (template.to || to || "").toLowerCase();
  if (!recipient) return { status: "error", reason: "Missing recipient" };

  // Idempotency: if any log row already exists for this key, skip.
  const { data: existing } = await supabase
    .from("email_send_log")
    .select("id")
    .eq("message_id", idempotencyKey)
    .limit(1)
    .maybeSingle();
  if (existing) return { status: "duplicate" };

  // Suppression
  const { data: suppressed } = await supabase
    .from("suppressed_emails").select("id").eq("email", recipient).maybeSingle();
  if (suppressed) {
    await supabase.from("email_send_log").insert({
      message_id: idempotencyKey, template_name: templateName,
      recipient_email: recipient, status: "suppressed",
    });
    return { status: "suppressed" };
  }

  // Unsubscribe token (reuse if present)
  let token: string | null = null;
  const { data: existingTok } = await supabase
    .from("email_unsubscribe_tokens").select("token,used_at").eq("email", recipient).maybeSingle();
  if (existingTok && !existingTok.used_at) token = existingTok.token;
  else if (!existingTok) {
    const t = newToken();
    await supabase.from("email_unsubscribe_tokens").upsert(
      { token: t, email: recipient }, { onConflict: "email", ignoreDuplicates: true },
    );
    const { data: stored } = await supabase
      .from("email_unsubscribe_tokens").select("token").eq("email", recipient).maybeSingle();
    token = stored?.token ?? t;
  } else {
    return { status: "suppressed" };
  }

  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject = typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  await supabase.from("email_send_log").insert({
    message_id: idempotencyKey, template_name: templateName,
    recipient_email: recipient, status: "pending",
  });

  const { error: enqErr } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: idempotencyKey,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: token,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqErr) {
    await supabase.from("email_send_log").insert({
      message_id: idempotencyKey, template_name: templateName,
      recipient_email: recipient, status: "failed", error_message: "enqueue failed",
    });
    return { status: "error", reason: enqErr.message };
  }
  return { status: "queued" };
}
