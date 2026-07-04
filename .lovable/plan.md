## LinkedIn Direct Publishing Integration

Mirror the TikTok integration pattern to add LinkedIn OAuth (Sign In with LinkedIn using OpenID Connect) + direct post publishing (Share on LinkedIn), with a polished "million-dollar" UX — connected account card, rich composer modal, media support, and one-click publish from any generated output.

### Prerequisites (secrets)
Request via `add_secret`:
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

Redirect URI to add in LinkedIn app: `https://postspark.co/api/public/oauth/linkedin/callback`

Scopes: `openid profile email w_member_social`

### 1. Server functions — extend `src/lib/socialPublish.functions.ts`
- `getLinkedInAuthUrl` — signed-state OAuth URL to `https://www.linkedin.com/oauth/v2/authorization`
- `publishToLinkedIn` — posts via LinkedIn REST `/rest/posts` (LinkedIn-Version header):
  - Text-only post
  - Image post: register upload → PUT image bytes → attach `urn:li:image:...`
  - Video post: same flow with `urn:li:video:...` (from Shorts Studio output)
  - Article/link post: with URL preview
  - Visibility: `PUBLIC` or `CONNECTIONS`
- Reuse `signState` / `verifyOAuthState` helpers
- Records to `scheduled_posts` (platform=`linkedin`, status=`published`, `platform_post_id`, `media_url`)

### 2. OAuth callback route
Create `src/routes/api/public/oauth.linkedin.callback.ts`:
- Verify state, exchange code at `https://www.linkedin.com/oauth/v2/accessToken`
- Fetch profile from `https://api.linkedin.com/v2/userinfo` (OIDC) → `sub` = member URN suffix, name, email, picture
- Upsert into `social_accounts` (platform=`linkedin`, `platform_user_id`=`urn:li:person:{sub}`, `platform_username`=name, tokens, expiry)
- Redirect back to `/dashboard/settings?linkedin=connected`

### 3. Connected Accounts card
Extend `src/components/ConnectedAccountsCard.tsx`:
- Add LinkedIn row (logo, "Connected as {name}", token expiry, Connect/Disconnect)
- Handle `?linkedin=connected` search param toast
- Reuse existing `disconnectSocial` (extend enum to include `linkedin`)

### 4. Reusable "Post to LinkedIn" component
Create `src/components/PostToLinkedInButton.tsx` — premium composer modal:
- Rich text area (3000-char counter, hashtag helper, emoji picker via existing UI)
- Media preview: image / video / link card
- Visibility toggle (Public / Connections only)
- "Post now" / "Save as draft" (draft = scheduled_posts row, status=`draft`)
- Optimistic success state with link to live post
- Connect-first empty state if not linked
- Loading / error states with retry

### 5. Wire the button into output surfaces
Add `<PostToLinkedInButton>` alongside existing publish buttons in:
- `src/routes/dashboard.repurpose.tsx` (per-output card)
- `src/routes/dashboard.image-studio.tsx` (generated images)
- `src/routes/dashboard.thumbnail.tsx`
- Shorts Studio output (video posts)
- Carousel output (multi-image post — LinkedIn document/carousel via multi-image share)

### 6. Standalone LinkedIn Composer tool
Create `src/routes/dashboard.linkedin.tsx`:
- Full page composer: prompt → AI-draft (reuse Claude via `src/server/anthropic.server.ts`) → preview → publish
- Templates (thought leadership, launch announcement, hiring, milestone, story)
- Hook variants using existing `hookLab`
- Character-count optimization, emoji density, hashtag suggestions
- Schedule for later (integrates `scheduled_posts.scheduled_for`)
- Add tool tile to Dashboard grid + tools catalog

### 7. DB / no schema changes
`social_accounts` already supports arbitrary `platform`; no migration needed. `scheduled_posts` already has all required columns.

### Technical notes
- LinkedIn REST API uses `LinkedIn-Version: 202405` + `X-Restli-Protocol-Version: 2.0.0` headers
- Access tokens last 60 days; store `token_expires_at`, prompt reconnect (no refresh token for standard tier unless requested)
- Attribution/author URN format: `urn:li:person:{sub}` from OIDC
- Image/video upload = `/rest/images?action=initializeUpload` then PUT to returned uploadUrl
- All calls server-side (secrets never leak to client)

### Files
**Create:**
- `src/routes/api/public/oauth.linkedin.callback.ts`
- `src/components/PostToLinkedInButton.tsx`
- `src/routes/dashboard.linkedin.tsx`

**Edit:**
- `src/lib/socialPublish.functions.ts` (auth URL + publish + disconnect enum)
- `src/components/ConnectedAccountsCard.tsx` (LinkedIn row)
- `src/routes/dashboard.repurpose.tsx`, `dashboard.image-studio.tsx`, `dashboard.thumbnail.tsx`, Shorts + Carousel output surfaces
- `src/components/DashboardLayout.tsx` + tools catalog (LinkedIn Composer entry)
