
# LinkedIn Composer — Premium Upgrade Plan

## Where it stands today (verified)

- `publishToLinkedIn` (`src/lib/socialPublish.functions.ts`) supports **text only, one image URL, or one article link**. No video, no multi-image, no documents.
- The composer page (`src/routes/dashboard.linkedin.tsx`) has **no media UI at all** — just a textarea, templates and a hashtag helper.
- `PostToLinkedInButton` accepts a `mediaUrl` prop but nothing in the composer ever sets it.
- There is **no file storage bucket in the project** — users currently cannot upload anything anywhere.
- The stock library (`StockPickerDialog` / Unsplash + Pexels) exists and works, but is not wired into LinkedIn.
- LinkedIn **scheduling is not implemented** — the scheduler cron only handles X (`api/public/hooks/publish-scheduled-x`). Drafts are stored but never published.
- Only one LinkedIn account per user; no organization/company Page posting.

## What we'll build

### 1. Media foundation (new)
- Create a private `post-media` storage bucket with per-user RLS (`user_id` folder prefix) and signed-URL reads.
- Upload widget: drag & drop, paste-from-clipboard, progress bar, client-side validation (images ≤10MB, video ≤200MB / ≤10 min, PDF ≤100MB).
- Media library tab: recent uploads + previously generated PostSpark images, reusable across posts.

### 2. Stock library inside the composer
- "Search stock" button opens the existing `StockPickerDialog` (photos + videos) directly in the LinkedIn composer.
- Selected stock assets are copied server-side into `post-media` so LinkedIn always fetches from a stable URL, and Unsplash download tracking still fires.

### 3. Real LinkedIn media publishing
Extend `publishToLinkedIn` to a proper media pipeline:
- **Multi-image posts** (up to 9) via `/rest/images` init → PUT → `content.multiImage`.
- **Video posts** via `/rest/videos?action=initializeUpload`, chunked part uploads, `finalizeUpload`, then post with `content.media` (video URN), including thumbnail + title.
- **Document/carousel PDF posts** via `/rest/documents` (the highest-reach LinkedIn format).
- Keep article/link posts, add **auto link-preview fetch** (title/description/thumb).
- Alt text per image (accessibility + reach), title for video/document.

### 4. Composer UX — premium pass
- Two-pane layout: editor left, **pixel-accurate LinkedIn feed preview** right (avatar, name, "see more" truncation at 210 chars, image grid layout matching LinkedIn's 1/2/3/4+ tiling, video player, document carousel).
- Rich helpers: bold/italic Unicode formatter, emoji picker, bullet/arrow inserters, **hook strength meter**, readability + "first 3 lines" hook warning, hashtag suggester driven by post content (AI, not the current hardcoded list).
- AI actions: Rewrite in Brand Voice, Shorten, Add hook, Generate CTA, Generate comment-bait question — reusing the existing Claude server functions and the user's Brand Voice / Brand Kit.
- Draft autosave, draft list, duplicate post, and a template gallery upgrade.
- Light/dark safe styling using existing semantic tokens (no hardcoded dark cards).

### 5. Scheduling & queue
- Generalize the X scheduler cron into a shared `publish-scheduled` handler that also drains LinkedIn rows in `scheduled_posts` (media URLs included), with retry + failure logging into `publishing_logs`.
- Date/time picker + "best time to post" suggestions in the composer; scheduled posts show in the existing Content Calendar.
- Optional **first comment** auto-post (link-in-comment strategy) after publish.

### 6. Reliability fixes
- Refresh-token handling + clear reconnect prompt (LinkedIn tokens expire in 60 days; today it just errors out).
- Validate the account has `w_member_social` before showing Publish; inline connection diagnostics like the X panel.
- Surface LinkedIn's real error body (currently truncated to 200 chars with no user guidance) with mapped, human messages for 401/403/422/426.
- Post-publish: store `platform_post_id`, link to the live post, and pull like/comment counts into `post_metrics`.

### 7. Nice-to-have (phase 2, only if you want it)
- Company/organization Page posting (`w_organization_social`) with a page picker like the Facebook one.
- Multi-post carousels/series and repurpose → LinkedIn one-click handoff.

## Technical notes

- New: `src/lib/linkedinMedia.server.ts` (image/video/document upload state machine), `src/lib/media.functions.ts` (signed upload URLs, list, delete).
- Rewrite: `src/routes/dashboard.linkedin.tsx` into components under `src/components/linkedin/` (`Composer`, `MediaTray`, `LinkedInPreview`, `ScheduleBar`, `AiAssistBar`).
- `publishToLinkedIn` input becomes `media: { kind: 'none'|'images'|'video'|'document'|'article', items: [...] }` with backward-compatible handling of the old `mediaUrl` prop used by `PostToLinkedInButton`.
- Migration: `post-media` bucket policies + `scheduled_posts` reuse of `media_urls` (already exists) and a `first_comment` column.
- LinkedIn API version stays `202506`; video upload requires the Versioned REST API with `LinkedIn-Version` header on every call.

## Suggested order

1. Storage bucket + upload/stock media tray + multi-image publish (biggest visible win).
2. Composer redesign with accurate preview + AI assist.
3. Video + document posting.
4. Scheduling/queue + first comment.
5. Reliability, metrics, org pages.
