
# PostSpark — Post-Launch Refinement & Growth Plan

Two priorities go in **Sprint 1** (per your request), followed by a polished audit-fix sprint and a growth sprint.

---

## Sprint 1 — Critical fixes (do first, tonight)

### 1.1 Branded auth emails (replace Lovable logo with PostSpark)

**Problem:** Signup verification, password reset, magic-link, and email-change emails currently render Lovable's default templates (Lovable logo + generic copy). The "Allow PostSpark to send/receive email" page the user sees during signup confirmation also inherits that default branding.

**Root cause:** No custom auth email templates have been scaffolded yet — `supabase/functions/_shared/email-templates/` doesn't exist. Only the transactional templates under `src/lib/email-templates/` are branded.

**Fix:**
1. Scaffold the 6 auth email templates (signup, magic-link, recovery, invite, email-change, reauthentication) into `supabase/functions/_shared/email-templates/` with the auth-email-hook wired to Lovable's email queue.
2. Apply PostSpark brand styling to every template:
   - White email body background (#ffffff) — required even though our app is dark.
   - PostSpark wordmark (lightning icon + "PostSpark") at the top, hosted from `postspark.co`.
   - Electric purple primary CTA button (#7c3aed → #6d28d9 gradient), navy headings (#1a1a2e), Inter font stack.
   - Friendly copy in the PostSpark voice ("Confirm your email to start repurposing", "Welcome to PostSpark — turn 1 post into 30").
   - Footer: postspark.co link, unsubscribe (where applicable), 2026 © PostSpark.
3. Verify `notify.postspark.co` domain is `active`; if still `awaiting_dns`, no action needed — emails go live when DNS verifies.
4. Test with the auth email preview route, then trigger a real signup on staging to confirm the branded version renders.

### 1.2 Daily blogging MVP — publish posts to Google for organic SEO

**Goal:** A simple, reliable workflow where you (admin) can publish a fresh SEO-optimized blog post every day at `postspark.co/blog/<slug>`, indexed by Google through the existing sitemap/RSS.

**What already exists ✅**
- Public blog routes: `/blog`, `/blog/$slug`, `/blog/category/$slug`, `/blog/author/$slug`
- DB tables: `blog_posts`, `blog_categories`, `blog_authors` (with status, slug, content_md, cover_image_url, published_at, meta_title, meta_description, reading_time)
- `sitemap.xml` + `rss.xml` routes
- Markdown sanitizer (just hardened)
- AI SEO blog generator at `/dashboard/seo-blog` (Pro-only, generates title + outline + markdown + FAQ)

**What's missing ❌**
- No "Publish to blog" button — the SEO Blog generator only outputs markdown to copy/paste.
- No admin role gating — anyone Pro could publish to your public blog.
- No editor UI to review/edit/schedule before publishing.
- No automatic cover image, slug uniqueness check, or JSON-LD Article schema on the blog detail page.
- Sitemap may not include blog URLs.

**Sprint 1.2 deliverables:**

1. **Admin role**
   - Add `app_role` enum (`admin`, `user`) and `user_roles` table with the standard `has_role()` security-definer function (per project security rules).
   - Seed your account as `admin`.

2. **Blog admin page** at `/dashboard/blog-admin` (admin-only, hidden from sidebar for non-admins):
   - List posts (draft / scheduled / published) with status filter.
   - "New post" → form with title, slug (auto-generated, editable, uniqueness checked), category, author, cover image upload, excerpt, meta_title, meta_description, content_md (markdown editor with live preview), publish status, scheduled_at.
   - "Generate with AI" button → reuses the existing `generateBlog` server function, fills the form fields, lets you tweak before saving.
   - "Save draft" / "Publish now" / "Schedule for…" actions.

3. **Daily scheduler** (pg_cron):
   - Cron job runs every 15 min, flips `status='scheduled' AND scheduled_at <= now()` rows to `status='published'` and stamps `published_at`.
   - Lets you batch-prepare a week of posts and have them auto-publish.

4. **SEO hardening on blog detail page**:
   - JSON-LD `Article` schema (headline, author, datePublished, image, publisher).
   - Canonical URL, OG image = cover_image_url.
   - Reading time and breadcrumb structured data.

5. **Sitemap & discovery**:
   - Confirm `sitemap.xml` includes every published blog post with `<lastmod>`.
   - Confirm `rss.xml` lists latest 50 posts.
   - Add a `<link rel="alternate" type="application/rss+xml">` on the blog index.

6. **Google Search Console kickoff** (manual checklist for you):
   - Verify `postspark.co` ownership.
   - Submit `https://postspark.co/sitemap.xml`.
   - Use "URL Inspection → Request Indexing" for each new post (takes 30 seconds/day).

---

## Sprint 2 — Audit refinements (this week)

These are real issues I found while re-auditing. None are launch-blockers, but each polishes the experience.

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 1 | Dashboard home | "Suggest content" widget guidance prompts are still slightly generic — they don't pre-pause to ask the user for their actual lesson | Already changed to non-autorun; verify the wording one more pass |
| 2 | Image Studio history | Confirm generated images list reloads after refresh and shows correct count (was reported broken) | Re-test, fix `generated_images` query if pagination off |
| 3 | Templates page | Some sections clipped due to scroll container | Audit `dashboard.templates.tsx` for `overflow-hidden` on outer wrapper |
| 4 | Hook Lab | Verify Pro-gating + usage counter increments correctly |
| 5 | Brand Voice | Confirm "auto-apply" toggle persists per generation |
| 6 | Calendar | Drag-to-reschedule UX, mobile usability |
| 7 | Onboarding | After first repurpose, push user to `/dashboard` (not stuck on success screen) |
| 8 | Settings → Billing | Show current period_end + "Cancel keeps access until X" message |
| 9 | 404 / error boundaries | Confirm every loader-route has both `errorComponent` and `notFoundComponent` |
| 10 | Mobile nav | Test sidebar drawer on iOS Safari |

---

## Sprint 3 — Growth & monetization (next week)

Now that we're live with traffic (200 visitors / 696 pageviews this week, mostly from US + PK), we lean into conversion.

1. **Landing page A/B**: hero headline test ("Turn 1 Post Into 30" vs "AI Content Repurposing for Creators"). Track with Lovable analytics.
2. **Blog content engine** (built in Sprint 1.2): publish 1 post/day for 30 days targeting long-tail keywords ("how to repurpose linkedin posts", "youtube to twitter thread", "blog to social media tool"). Each post links to `/signup` with a contextual CTA.
3. **Referral program polish**: in-app share card with one-click X / LinkedIn share text, leaderboard for top referrers.
4. **Lifecycle emails** (transactional infra already exists):
   - Day 1 after signup: "Did your first repurpose work?" with a tutorial GIF.
   - Day 3: "Here's what other creators made this week" (Gallery highlights).
   - Day 7 (if still free): "Unlock unlimited for $19" with a 20% first-month code.
5. **Product Hunt launch checklist**: Hunter assets, gallery video, first-comment script, friendly upvoter list.
6. **Public roadmap voting**: let users upvote `/roadmap` items (writes to `roadmap_votes`).

---

## Technical notes (for the agent)

- Auth emails: use `email_domain--scaffold_auth_email_templates`, then brand-style the 6 templates. White body BG mandatory.
- Blog admin page: gate with `_authenticated/` parent + a server-side `has_role(auth.uid(), 'admin')` check on every mutation server function. Never trust the client.
- Blog scheduler: `cron.schedule('publish-scheduled-posts', '*/15 * * * *', $$ UPDATE blog_posts SET status='published', published_at=now() WHERE status='scheduled' AND scheduled_at <= now() $$)` — pure SQL, no HTTP needed.
- Slug uniqueness: enforce `UNIQUE` on `blog_posts.slug` (likely already there) + auto-suffix `-2`, `-3` on collision in the form.
- Cover image upload: reuse the existing `generated_images` storage bucket or add a `blog-covers` bucket with public read.
- JSON-LD: render in `head()` of `blog.$slug.tsx` from loader data.

---

## Recommended order tonight

1. **Auth email branding** (1.1) — 20 min, immediately visible to every new signup.
2. **Blog admin + scheduler** (1.2) — 60–90 min, unlocks daily SEO publishing starting tomorrow.
3. Publish your first 3 backlog posts using the new admin page.
4. Submit sitemap to Google Search Console.

After Sprint 1 ships, we move to Sprint 2 audit refinements. Approve this plan and I'll start with auth email branding.
