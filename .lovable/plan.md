# Fix: Threads publishing is completely non-functional

## Confirmed root cause
`completeMetaOAuth` in `src/lib/metaPublish.functions.ts` only ever upserts `social_accounts` with `platform: "facebook"`. No code path writes a `platform: "threads"` row, but both `src/routes/dashboard.settings.threads.tsx` and `src/routes/dashboard.publish.threads.tsx`, plus `publishToThreads`, gate on that row's existence. Threads uses a **separate OAuth flow** at `threads.net/oauth/authorize` — it is not part of Facebook Login, so "reauthorize Meta" cannot ever attach it.

## Plan

### 1. Meta developer app config (user action)
- In the Meta app dashboard → "Use cases" → add **Threads API** (`threads_business_basic`, and `threads_content_publish` if approved).
- Add valid OAuth redirect URI: `https://postspark.co/auth/threads/callback`.
- Copy Threads App ID + App Secret (separate from Facebook App ID/Secret).

### 2. Secrets
Request via `add_secret`:
- `META_THREADS_APP_ID`
- `META_THREADS_APP_SECRET`

### 3. Server functions (new, in `src/lib/metaPublish.functions.ts`)
- `getThreadsAuthUrl()` — build `https://threads.net/oauth/authorize?...` with scope `threads_business_basic,threads_content_publish` and redirect to `/auth/threads/callback`.
- `completeThreadsOAuth({ code })`:
  1. POST `https://graph.threads.net/oauth/access_token` (short-lived).
  2. GET `https://graph.threads.net/access_token?grant_type=th_exchange_token` (long-lived, 60d).
  3. GET `https://graph.threads.net/v1.0/me?fields=id,username`.
  4. Upsert `social_accounts` with `platform: "threads"`, `platform_user_id`, `platform_username`, `access_token`, `token_expires_at`, `scopes`.
- Keep existing `publishToThreads` unchanged (it already reads the row correctly).

### 4. Callback route
Create `src/routes/auth.threads.callback.tsx` mirroring `auth.facebook.callback.tsx`: call `completeThreadsOAuth`, then redirect to `/dashboard/settings/threads?threads=connected`.

### 5. UI wiring (`src/routes/dashboard.settings.threads.tsx`)
Replace the "reauthorize via Facebook" instructions with a direct **Connect Threads** button that calls `getThreadsAuthUrl` and `window.location.href`s to the returned URL. Keep the IG-linked info as an optional hint, not a requirement.

### 6. Disconnect
Add a Threads branch in the existing disconnect helper to delete the `platform: "threads"` row.

### 7. Verify
- Click Connect Threads → return to settings with green "connected" state.
- Publish a single post and a 2-post auto-split thread from `/dashboard/publish/threads`.
- Confirm `publishing_logs` rows with `platform: "threads"`.

## Out of scope
- Threads analytics/insights (separate endpoint, can follow later).
- Video uploads (needs polling loop like IG).
