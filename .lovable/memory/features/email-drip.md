---
name: Email drip & campaigns
description: Onboarding drip (day 0/2/5/7), usage warning, testimonial campaign, render-and-enqueue helper
type: feature
---
# Email drip + campaigns

## Templates (src/lib/email-templates/)
- welcome-day-0, drip-day-2, drip-day-5, drip-day-7 (founding offer w/ live spots)
- usage-warning (sent when free user hits 2/3 in current month)
- testimonial-request ("2 months Pro for a testimonial")
All registered server_only in registry.ts.

## Delivery
- `src/lib/email/render-and-enqueue.server.ts` — renders React Email to html/text, checks suppression, creates unsubscribe token, enqueues to `transactional_emails` queue with idempotency key. Skips on duplicate `message_id` in email_send_log.
- Daily cron at 14:00 UTC: `/api/public/hooks/email-drip` — authenticates via `apikey` header (anon or service-role), iterates DRIPS (day 0/2/5/7), filters auth.users by created_at window, skips paid users for day 5/7. Idempotency key: `<template>-<user_id>`.
- Usage warning: fired inline in `src/lib/repurpose.functions.ts` when count === FREE_MONTHLY_LIMIT - 1. Idempotency key: `usage-warning-<user_id>-<YYYY-MM>`.

## Campaigns
- `src/lib/campaigns.functions.ts` exports `sendTestimonialCampaign` (admin role required, calls `has_role`). UI in `dashboard.testimonials-admin.tsx` → CampaignCard.

## Referral share kit
- `dashboard.referrals.tsx` includes ShareKit with 3 pre-written templates (short, founder story, curiosity hook), share buttons for X/LinkedIn/email + copy text.
