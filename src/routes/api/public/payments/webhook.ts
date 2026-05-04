import * as React from 'react';
import { render } from '@react-email/components';
import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhook, EventName, type PaddleEnv } from '@/lib/paddle.server';
import { WelcomePaidEmail } from '@/lib/email-templates/welcome-paid';

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

async function sendWelcomeEmail(toEmail: string, planName: string) {
  try {
    const element = React.createElement(WelcomePaidEmail, {
      planName,
      dashboardUrl: `https://${ROOT_DOMAIN}/dashboard`,
      manageBillingUrl: `https://${ROOT_DOMAIN}/dashboard/settings`,
    });
    const html = await render(element);
    const text = await render(element, { plainText: true });

    const messageId = crypto.randomUUID();
    const supabase = getSupabase();

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'welcome_paid',
      recipient_email: toEmail,
      status: 'pending',
    });

    await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: toEmail,
        from: `${SITE_NAME} <hello@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Welcome to PostSpark ${planName} 🎉`,
        html,
        text,
        purpose: 'transactional',
        label: 'welcome_paid',
        queued_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('Failed to send welcome email:', e);
  }
}

async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email ?? null;
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

  // Send welcome email (best-effort)
  const email = await getUserEmail(userId);
  if (email) {
    await sendWelcomeEmail(email, planNameFromProductId(productId));
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customerId, customData } = data;

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;

  // Use upsert so plan switches (Pro -> Agency, etc.) update price_id/product_id too
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
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase()
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
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
