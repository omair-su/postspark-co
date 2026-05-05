import * as React from 'react';
import { render } from '@react-email/components';
import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhook, EventName, getPaddleClient, type PaddleEnv } from '@/lib/paddle.server';
import { WelcomePaidEmail } from '@/lib/email-templates/welcome-paid';
import { PaymentFailedEmail } from '@/lib/email-templates/payment-failed';
import { SubscriptionCanceledEmail } from '@/lib/email-templates/subscription-canceled';

const SITE_NAME = 'PostSpark';
const FROM_DOMAIN = 'postspark.co';
const SENDER_DOMAIN = 'hello.postspark.co';
const ROOT_DOMAIN = 'postspark.co';

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

function planNameFromProductId(productId: string | undefined): string {
  if (productId === 'agency_plan') return 'Agency';
  if (productId === 'pro_plan') return 'Pro';
  return 'Premium';
}

async function enqueueEmail(opts: {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  label: string;
}) {
  const messageId = crypto.randomUUID();
  const supabase = getSupabase();
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: opts.label,
    recipient_email: opts.toEmail,
    status: 'pending',
  });
  await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: opts.toEmail,
      from: `${SITE_NAME} <hello@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      purpose: 'transactional',
      label: opts.label,
      queued_at: new Date().toISOString(),
    },
  });
}

async function alreadySent(label: string, toEmail: string, sinceMinutes: number): Promise<boolean> {
  const supabase = getSupabase();
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('email_send_log')
    .select('id')
    .eq('template_name', label)
    .eq('recipient_email', toEmail)
    .gte('created_at', since)
    .limit(1);
  return !!(data && data.length);
}

async function sendWelcomeEmail(toEmail: string, planName: string, paddleSubId: string) {
  try {
    // Idempotency: don't re-send welcome for same paddle subscription within 30 days
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('email_send_log')
      .select('id')
      .eq('template_name', 'welcome_paid')
      .eq('recipient_email', toEmail)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .limit(1);
    if (existing && existing.length) return;

    const element = React.createElement(WelcomePaidEmail, {
      planName,
      dashboardUrl: `https://${ROOT_DOMAIN}/dashboard`,
      manageBillingUrl: `https://${ROOT_DOMAIN}/dashboard/settings`,
    });
    const html = await render(element);
    const text = await render(element, { plainText: true });
    await enqueueEmail({
      toEmail,
      subject: `Welcome to ${SITE_NAME} ${planName} 🎉`,
      html,
      text,
      label: 'welcome_paid',
    });
  } catch (e) {
    console.error('Failed to send welcome email:', e);
  }
}

async function sendPaymentFailedEmail(toEmail: string, planName: string) {
  try {
    if (await alreadySent('payment_failed', toEmail, 60 * 24)) return; // max 1/day
    const element = React.createElement(PaymentFailedEmail, {
      planName,
      manageBillingUrl: `https://${ROOT_DOMAIN}/dashboard/settings`,
    });
    const html = await render(element);
    const text = await render(element, { plainText: true });
    await enqueueEmail({
      toEmail,
      subject: 'Action needed: your PostSpark payment failed',
      html,
      text,
      label: 'payment_failed',
    });
  } catch (e) {
    console.error('Failed to send payment-failed email:', e);
  }
}

async function sendCanceledEmail(toEmail: string, planName: string, endsOn: string | null) {
  try {
    if (await alreadySent('subscription_canceled', toEmail, 60 * 24 * 7)) return; // max 1/week
    const element = React.createElement(SubscriptionCanceledEmail, {
      planName,
      endsOn: endsOn ?? undefined,
      resubscribeUrl: `https://${ROOT_DOMAIN}/#pricing`,
    });
    const html = await render(element);
    const text = await render(element, { plainText: true });
    await enqueueEmail({
      toEmail,
      subject: 'Your PostSpark subscription has been canceled',
      html,
      text,
      label: 'subscription_canceled',
    });
  } catch (e) {
    console.error('Failed to send canceled email:', e);
  }
}

async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email ?? null;
}

async function getEmailForSubscription(paddleSubscriptionId: string): Promise<{ email: string | null; productId: string | null }> {
  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, product_id')
    .eq('paddle_subscription_id', paddleSubscriptionId)
    .maybeSingle();
  if (!sub) return { email: null, productId: null };
  const email = await getUserEmail(sub.user_id);
  return { email, productId: sub.product_id ?? null };
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }
  const item = items[0];
  const priceId = item.price?.importMeta?.externalId;
  const productId = item.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping subscription: missing importMeta.externalId', {
      rawPriceId: item.price?.id,
      rawProductId: item.product?.id,
    });
    return;
  }
  await getSupabase().from('subscriptions').upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'paddle_subscription_id' }
  );
  const email = await getUserEmail(userId);
  if (email) await sendWelcomeEmail(email, planNameFromProductId(productId), id);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customerId, customData } = data;
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;

  if (priceId && productId) {
    const userId = customData?.userId;
    await getSupabase().from('subscriptions').upsert(
      {
        ...(userId ? { user_id: userId } : {}),
        paddle_subscription_id: id,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        current_period_start: currentBillingPeriod?.startsAt,
        current_period_end: currentBillingPeriod?.endsAt,
        cancel_at_period_end: scheduledChange?.action === 'cancel',
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'paddle_subscription_id' }
    );
  } else {
    await getSupabase()
      .from('subscriptions')
      .update({
        status,
        current_period_start: currentBillingPeriod?.startsAt,
        current_period_end: currentBillingPeriod?.endsAt,
        cancel_at_period_end: scheduledChange?.action === 'cancel',
        updated_at: new Date().toISOString(),
      })
      .eq('paddle_subscription_id', id)
      .eq('environment', env);
  }

  // If subscription transitioned to past_due, also email the user
  if (status === 'past_due') {
    const { email, productId: pid } = await getEmailForSubscription(id);
    if (email) await sendPaymentFailedEmail(email, planNameFromProductId(pid ?? undefined));
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { id, currentBillingPeriod } = data;
  await getSupabase()
    .from('subscriptions')
    .update({
      status: 'canceled',
      current_period_end: currentBillingPeriod?.endsAt ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  const { email, productId } = await getEmailForSubscription(id);
  if (email) {
    await sendCanceledEmail(
      email,
      planNameFromProductId(productId ?? undefined),
      currentBillingPeriod?.endsAt ?? null
    );
  }
}

async function handleTransactionPaymentFailed(data: any, _env: PaddleEnv) {
  const subId = data?.subscriptionId;
  if (!subId) return;
  const { email, productId } = await getEmailForSubscription(subId);
  if (email) await sendPaymentFailedEmail(email, planNameFromProductId(productId ?? undefined));
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionPaymentFailed:
      await handleTransactionPaymentFailed(event.data, env);
      break;
    default:
      console.log('Unhandled Paddle event:', event.eventType);
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error('Paddle webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
