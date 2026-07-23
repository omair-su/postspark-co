# Meta Direct Publishing & Social Management Hub — Deep Implementation Plan

## Executive Summary
Add first-class **Facebook Pages**, **Instagram Professional**, and **Threads** direct publishing, plus **WhatsApp notifications** and a **Reels/search research** feature, to PostSpark. This turns the existing X-only publishing flow into a multi-platform social command center.

We will also build the connection hub, unified composer, calendar/queue, analytics, webhook receiver, token manager, and an **admin review screen** so you can record clean demos for Meta App Review Advanced Access.

## What we verified in the codebase
- `social_accounts` and `scheduled_posts` already exist and are reused for X, TikTok, LinkedIn, YouTube.
- X OAuth, TikTok OAuth, LinkedIn OAuth, and webhook handlers follow the pattern: `/api/public/oauth/<platform>/callback`, `/callbacks/<platform>`, `/api/public/webhooks/<platform>`.
- **No Meta connector** exists in Lovable connectors, so this must be a custom Meta Graph API integration.
- Dark theme / Tailwind v4 is active; no `framer-motion`.
- `data-deletion.tsx` already exists for Meta compliance.

## Phase 0 — Meta App Dashboard & Secrets (must happen first)

1. In **Meta Developers → App → Products** add:
   - Facebook Login
   - Instagram Graph API
   - Threads API
   - WhatsApp Business Platform (only if you want WhatsApp notifications)
2. Paste the exact URLs below into the Meta dashboard (see "Critical URLs" table).
3. Add your own Facebook/Instagram accounts as **Test Users** so standard-access API calls succeed.
4. Store secrets via the secure `add_secret` tool:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_WEBHOOK_VERIFY_TOKEN` (we will generate)
   - `WHATSAPP_PHONE_NUMBER_ID` (optional)
   - `WHATSAPP_BUSINESS_ACCOUNT_ID` (optional)
5. Request the permissions listed in the "Permissions Checklist" table.

## Phase 1 — Database Schema & Backend Foundation

Single migration that:

1. Extends `social_accounts` with:
   - `metadata` JSONB (page/IG/Threads profile data, followers, pictures)
   - `platform_user_id` already exists; we will keep it for the user-level Graph/Threads ID.
2. Creates `social_pages` (one row per Facebook Page a user can publish to):
   - `id`, `user_id`, `social_account_id`, `page_id`, `page_name`, `page_category`, `page_picture_url`, `page_followers_count`, `page_access_token`, `is_default`, `created_at`, `updated_at`
3. Extends `scheduled_posts` with `social_account_id` and `social_page_id` usage.
4. Creates `publishing_logs`:
   - `id`, `user_id`, `scheduled_post_id`, `platform`, `action`, `request_payload`, `response_payload`, `status`, `created_at`
5. Creates `webhook_events`:
   - `id`, `event_type`, `platform`, `payload`, `signature`, `processed`, `error_message`, `created_at`
6. Creates `analytics_cache`:
   - `id`, `user_id`, `platform`, `metric`, `value`, `date`, `updated_at`
7. Creates `account_permissions`:
   - `id`, `user_id`, `platform`, `permission`, `granted`, `requested_at`

All tables get RLS + `GRANT` blocks for `authenticated` and `service_role`.

Backend files:
- `src/lib/metaPublish.functions.ts` — OAuth, token refresh, page fetch, disconnect, publish, schedule, usage.
- `src/lib/meta.server.ts` — Graph API helpers, media upload, container creation, error normalization.
- `src/routes/api/public/oauth/meta/callback.ts` — token exchange (optional, kept alongside the user-requested `/auth/facebook/callback`).
- `src/routes/auth.facebook.callback.tsx` — the exact redirect URL the user requested.
- `src/routes/api/public/webhooks/meta.ts` — webhook receiver.
- `src/routes/api/public/webhooks/meta.deauthorize.ts` — deauthorize callback.

## Phase 2 — Facebook Pages Connection

Pages:
- `/settings/facebook`
- `/publish/facebook`

Features:
- **Connect Facebook** button initiates Meta OAuth with scopes: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `business_management`.
- OAuth callback exchanges code for user access token, then fetches `/me/accounts`.
- Display connected Pages:
  - Page name
  - Page picture
  - Category
  - Follower count
  - Page ID
- Let user pick a **Default Publishing Page**.
- Save page access token and metadata securely.
- Connection testing + error handling + permission validation.

Publishing route `/publish/facebook`:
- Write or generate content
- Attach images / videos
- Preview the post
- Schedule or publish immediately
- Status: Draft, Scheduled, Publishing, Published, Failed
- Show API response log

## Phase 3 — Instagram Connection & Publishing

Pages:
- `/settings/instagram`
- `/publish/instagram`

Features:
- Display Instagram Business/Creator account connected to the selected Facebook Page.
- Show profile picture, username, followers, account status, permissions status.
- Required permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
- Save Instagram user ID, username, profile data, access token, expiry.

Publishing route `/publish/instagram`:
- Photo posts
- Carousel posts
- Video posts
- Reels publishing
- Caption generator, hashtag generator, AI caption rewrite
- Cover/thumbnail selection
- Media preview
- Publishing queue and schedule
- Post status tracking

## Phase 4 — Threads Connection & Publishing

Pages:
- `/settings/threads`
- `/publish/threads`

Features:
- Permission: `threads_business_basic` (plus `threads_content_publish` once available).
- Fetch Threads account ID from the linked Instagram account.
- Thread creation, single post, multi-post thread, AI thread generation
- Thread preview, character counter, auto-split long content
- Schedule thread and publish
- History and analytics

## Phase 5 — WhatsApp Notifications

Page:
- `/settings/whatsapp`

Features:
- Connect WhatsApp Business (Cloud API).
- Notification preferences toggles:
  - Post published
  - Post failed
  - Scheduled reminder
  - Content approval request
  - Account connected
  - Subscription notifications
- Notification templates (server-side) for business-initiated messages.
- Notification center UI showing sent/bounced messages.

## Phase 6 — Unified Publishing Center, Calendar & Reels Search

Pages:
- `/publishing` — unified composer
- `/calendar` — top-level calendar view
- Reels search panel inside **Shorts Studio**

`/publishing` features:
- Left panel: text composer with platform-specific character counters (280 X, 500 Threads, 63206 Facebook, 2200 Instagram).
- Middle panel: evenly spaced platform toggle buttons for Facebook, Instagram, Threads, X, LinkedIn, TikTok, YouTube.
- Right panel: live preview that switches between Facebook post, Instagram feed/Reel, Threads thread, X tweet.
- Footer: **Publish Now** and **Schedule** buttons.
- Generate platform-specific versions from one caption.
- Attach media from Image Studio, Stock Gallery, or device.

`/calendar` features:
- Monthly calendar view with chips per date.
- List view toggle.
- Chips show platform icon, caption snippet, tiny thumbnail, status badge.
- Filters: Draft, Scheduled, Published, Failed, by platform.
- Drag-and-drop rescheduling.
- Daily / Weekly / Monthly views.

Reels search in Shorts Studio:
- Use Instagram hashtag search and Page public content endpoints (with `instagram_public_content_access` and `page_public_content_access`).
- Fallback to existing stock video sources if Meta search returns limited results.
- Add search results as B-roll or reference in Shorts Studio.

## Phase 7 — Webhooks & Logs

Webhook endpoint:
- `/api/webhooks/meta`
- Verifies `X-Hub-Signature-256` HMAC using `META_APP_SECRET`.
- Handles:
  - Publish success/failure updates
  - Permission changes
  - Token expiry
  - Account disconnect
  - Sync updates
- Deauthorize endpoint: `/api/webhooks/meta/deauthorize` deletes user data on app removal.
- Stores every event in `webhook_events`.
- Webhook logs page in the admin review area.

## Phase 8 — Analytics & Admin Review

Page:
- `/analytics` — top-level analytics dashboard
- `/admin/meta-review` — screen-recording studio for Meta App Review

`/analytics` features:
- Metric cards: Total Posts, Published Posts, Scheduled Posts, Connected Accounts, Engagement, Top Posts, Growth Metrics, Platform Breakdown.
- Recent Activity Log table (webhook events): Date/Time, Platform, Event Type, Status, Retry button for errors.
- Charts/trends.

`/admin/meta-review` features:
- Clean demo screens for:
  - Facebook Login flow
  - Instagram Connect flow
  - Facebook Publish flow
  - Instagram Publish flow
  - Threads Publish flow
  - Webhook events
  - Permission usage
  - API response logs
- Step-by-step recording scripts so you can capture the required screen recordings for Meta App Review.

## Phase 9 — Meta App Review & Demo Recordings

For each permission/feature, Meta requires a screen recording showing real usage.

We will provide ready-to-record scripts:
1. `pages_show_list` — open `/settings/facebook`, connect, see page list.
2. `pages_manage_posts` — open `/publish/facebook`, write, attach image, publish.
3. `pages_read_engagement` — page profile picture/followers displayed.
4. `instagram_basic` — `/settings/instagram` shows username, profile pic, followers.
5. `instagram_content_publish` — `/publish/instagram` creates and publishes a photo/Reel.
6. `threads_business_basic` — `/settings/threads` shows connected Threads account.
7. `business_management` — multi-account/workspace selector.
8. Webhooks — `/admin/meta-review` shows a received event.

Before requesting Advanced Access, make each test API call with a test user so the "Request Advanced Access" button becomes active.

## Plan Gating (aligned with existing PostSpark tiers)

| Capability | Free | Pro | Agency |
|---|---|---|---|
| Connect Facebook Pages | 1 page | 3 pages | unlimited |
| Connect Instagram | 1 account | 3 accounts | unlimited |
| Facebook/Instagram posts | 5/month | unlimited | unlimited |
| Schedule posts | ❌ | ✅ | ✅ |
| WhatsApp notifications | ❌ | ✅ | ✅ |
| Reels search | 5/day | unlimited | unlimited |
| Threads publishing | ✅ | ✅ | ✅ |

## Files & Routes Summary

New routes:
- `src/routes/settings.tsx` — layout with `DashboardLayout` + `<Outlet />`
- `src/routes/settings.facebook.tsx` → `/settings/facebook`
- `src/routes/settings.instagram.tsx` → `/settings/instagram`
- `src/routes/settings.threads.tsx` → `/settings/threads`
- `src/routes/settings.whatsapp.tsx` → `/settings/whatsapp`
- `src/routes/integrations.tsx` → `/integrations`
- `src/routes/publishing.tsx` → `/publishing`
- `src/routes/calendar.tsx` → `/calendar`
- `src/routes/analytics.tsx` → `/analytics`
- `src/routes/admin.meta-review.tsx` → `/admin/meta-review`
- `src/routes/auth.facebook.callback.tsx` → `/auth/facebook/callback`
- `src/routes/api/public/webhooks/meta.ts` → `/api/webhooks/meta`
- `src/routes/api/public/webhooks/meta.deauthorize.ts` → `/api/webhooks/meta/deauthorize`

New components:
- `src/components/meta/MetaConnectionCard.tsx`
- `src/components/meta/FacebookPagePicker.tsx`
- `src/components/meta/InstagramAccountCard.tsx`
- `src/components/meta/ThreadsAccountCard.tsx`
- `src/components/meta/UnifiedComposer.tsx`
- `src/components/meta/PlatformSelector.tsx`
- `src/components/meta/PostPreviewCard.tsx` (Facebook/Instagram/Threads/X)
- `src/components/meta/ScheduleDialog.tsx`
- `src/components/meta/WebhookLogTable.tsx`
- `src/components/meta/WhatsAppPreferences.tsx`
- `src/components/meta/MetaReviewStudio.tsx`

New server files:
- `src/lib/metaPublish.functions.ts`
- `src/lib/meta.server.ts`

Updated files:
- `src/components/ConnectedAccountsCard.tsx` — add Facebook, Instagram, Threads, WhatsApp rows.
- `src/components/DashboardLayout.tsx` — add `/publishing`, `/calendar`, `/integrations` nav items.
- `src/routes/dashboard.settings.tsx` — link to new Meta connection pages.
- `src/routes/dashboard.calendar.tsx` — extend for multi-platform status/actions.
- `src/routes/dashboard.shorts-studio.tsx` — add Reels search panel.

## Security & Compliance
- All access tokens stored server-side; never returned to the client.
- OAuth state signed with HMAC-SHA256.
- Webhook signatures verified with HMAC-SHA256.
- Deauthorize callback deletes social tokens and pages for that user.
- Data deletion URL already exists.
- `service_role` only for token storage; authenticated queries are scoped by `user_id` via RLS.

## Critical URLs — Paste These Into Meta Dashboard

| Location in Meta dashboard | URL |
|---|---|
| Facebook Login → Valid OAuth Redirect URIs | `https://postspark.co/auth/facebook/callback` |
| Webhooks → Callback URL | `https://postspark.co/api/webhooks/meta` |
| Webhooks → Verify Token | `META_WEBHOOK_VERIFY_TOKEN` (we generate) |
| Deauthorize Callback URL | `https://postspark.co/api/webhooks/meta/deauthorize` |
| Data Deletion URL | `https://postspark.co/data-deletion` |
| App Domains | `postspark.co`, `www.postspark.co` |
| Privacy Policy URL | `https://postspark.co/privacy` |
| Terms of Service URL | `https://postspark.co/terms` |
| App Icon | Use the existing PostSpark mark from `public/favicon.svg` |

## Permissions Checklist — Request These in App Review

| Platform | Permission | Why Meta needs it |
|---|---|---|
| Facebook | `pages_show_list` | List Pages the user manages so they can pick one. |
| Facebook | `pages_manage_posts` | Create, edit, and publish video/text posts to a Page. |
| Facebook | `pages_read_engagement` | Read Page metadata, profile picture, follower count. |
| Facebook | `business_management` | Manage business assets across Pages and Instagram accounts. |
| Instagram | `instagram_basic` | Read Instagram Business account profile info. |
| Instagram | `instagram_content_publish` | Create organic feed photo, video, carousel, and Reel posts. |
| Instagram | `instagram_manage_insights` *(optional)* | Pull performance data for analytics. |
| Threads | `threads_business_basic` | Fetch the Threads account ID linked to an Instagram account. |
| Search | `instagram_public_content_access` | Hashtag search for Reels/content research. |
| Search | `page_public_content_access` | Read public Page posts/videos for research. |

## Open Decisions / Need From You
1. **Meta App ID and App Secret** — please paste or save via `add_secret` when we start Phase 0.
2. **WhatsApp Business phone number ID and WABA ID** — only if you want WhatsApp notifications.
3. **The PDF you mentioned** did not attach to this chat. If it contains app IDs, permission lists, or screenshots, please paste the relevant text.
4. **Existing `/dashboard/publish` (X-only)** — do you want to keep it as-is and build the new unified composer at `/publishing`, or replace `/dashboard/publish` with the unified multi-platform composer?

This plan is designed so that every page we build is a real, functional feature you can use for the API test calls and screen recordings Meta requires for Advanced Access.