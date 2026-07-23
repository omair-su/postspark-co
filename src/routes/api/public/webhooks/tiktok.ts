import { createFileRoute } from '@tanstack/react-router';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// TikTok webhook handler.
// Public endpoint (bypasses auth on published sites). Security = HMAC signature check.
// Served at: https://postspark.co/api/public/webhooks/tiktok

const ACK = { code: 0, message: 'ok' };

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(header, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function handleEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  eventType: string,
  event: any,
): Promise<{ processed: boolean; error?: string }> {
  try {
    const content = event?.content ?? event?.data ?? event ?? {};

    switch (eventType) {
      case 'video.publish.complete':
      case 'video.publish.completed': {
        const publishId = content.publish_id ?? content.share_id ?? content.post_id;
        if (!publishId) return { processed: false, error: 'missing publish_id' };
        await supabase
          .from('scheduled_posts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('provider_post_id', String(publishId));
        return { processed: true };
      }
      case 'video.publish.failed': {
        const publishId = content.publish_id ?? content.share_id ?? content.post_id;
        const errMsg = content.fail_reason ?? content.error ?? 'TikTok publish failed';
        if (!publishId) return { processed: false, error: 'missing publish_id' };
        await supabase
          .from('scheduled_posts')
          .update({ status: 'failed', error_message: String(errMsg) })
          .eq('provider_post_id', String(publishId));
        return { processed: true };
      }
      case 'user.revoke':
      case 'authorization.removed': {
        const openId = content.open_id ?? content.user_open_id;
        if (!openId) return { processed: false, error: 'missing open_id' };
        await supabase
          .from('social_accounts')
          .delete()
          .eq('provider', 'tiktok')
          .eq('provider_account_id', String(openId));
        return { processed: true };
      }
      default:
        return { processed: false, error: `unhandled event: ${eventType}` };
    }
  } catch (e: any) {
    return { processed: false, error: e?.message ?? 'handler error' };
  }
}

export const Route = createFileRoute('/api/public/webhooks/tiktok')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.TIKTOK_CLIENT_SECRET;
        if (!secret) {
          console.error('[tiktok-webhook] TIKTOK_CLIENT_SECRET not configured');
          // Always ack; TikTok retries endlessly on non-200.
          return Response.json(ACK);
        }

        const rawBody = await request.text();
        const signature = request.headers.get('x-tiktok-signature');

        const valid = verifySignature(rawBody, signature, secret);
        if (!valid) {
          console.warn('[tiktok-webhook] invalid signature');
          // Still ack so TikTok stops retrying; log for investigation.
          return Response.json(ACK);
        }

        let payload: any = {};
        try {
          payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          payload = { _raw: rawBody };
        }

        const eventType: string =
          payload?.event ?? payload?.type ?? payload?.event_type ?? 'unknown';

        const supabase = getSupabaseAdmin();

        const { processed, error } = await handleEvent(supabase, eventType, payload);

        try {
          await supabase.from('tiktok_webhook_logs').insert({
            event_type: eventType,
            payload,
            processed,
            error_message: error ?? null,
          });
        } catch (logErr) {
          console.error('[tiktok-webhook] failed to log event', logErr);
        }

        return Response.json(ACK);
      },
    },
  },
});
