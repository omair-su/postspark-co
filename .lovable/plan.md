## Phase D — Stickiness & SEO

Four feature areas across two turns. Turn 1 = Calendar Planner + SEO upgrade. Turn 2 = Marketplace + Streaks/Digest.

---

### Turn 1

#### 1. 30-day AI Calendar Planner (#10)
- New server fn `generatePlan` in `src/lib/calendar.functions.ts` → Claude call that returns 30 days of post ideas (date, platform, hook, topic, angle) given user's niche + active brand voice + brand kit tone.
- New "AI Plan" button on `dashboard.calendar.tsx` opens a dialog: niche/topic + platforms + cadence (daily/3x/weekly).
- On generate: insert N rows into `scheduled_posts` (status=`draft`, `scheduled_for` spread across next 30 days). Each row links back via `outputs` JSON or content body.
- Counts as 1 credit (planning, not per-post). Uses `checkRepurposeQuota`.
- Inline "Regenerate day" button per draft → calls `generatePlan` with single-day scope.

#### 2. SEO competitor-aware outline + internal links (#11)
- Extend `src/lib/seoBlog.functions.ts` with new fn `generateOutline` (separate from full blog).
- Inputs: keyword, optional 1-3 competitor URLs.
- Server-side (`seoBlog.server.ts`):
  - If competitor URLs: fetch + extract H1/H2/H3 via simple HTML parse (no new dep — cheerio already common, fallback to regex).
  - Pass competitor headings + keyword to Claude → returns outline (H2/H3 tree) + suggested internal links (from user's existing `blog_posts` where `status='published'`).
- New tab "Outline + Competitors" on `dashboard.seo-blog.tsx` with competitor URL inputs and outline preview before full generation.
- Internal links rendered as a checklist; selected ones auto-injected into final markdown.

---

### Turn 2

#### 3. Swipe file + public template marketplace (#14, #17)
- DB migration: add `is_public boolean default false`, `category text`, `description text`, `use_count int default 0`, `slug text unique` to `templates`. Keep existing RLS (own-user write); add new policy "Public templates viewable by all".
- New route `src/routes/templates.gallery.tsx` (public) → lists `templates` where `is_public=true`. Filter by category, search by name.
- New route `src/routes/templates.$slug.tsx` (public detail page, SEO head with template name + description).
- "Use this template" button (auth-gated) → server fn `cloneTemplate` copies row to current user, increments `use_count`.
- Add toggle "Publish to gallery" + category picker on `dashboard.templates.tsx`.
- Add "Browse marketplace" link in templates page header.

#### 4. Streaks + weekly digest email (#16, #15)
- DB migration: add `streak_days int default 0`, `last_active_date date` to `profiles`.
- New server fn `pingStreak` called from dashboard mount. If `last_active_date = today`: noop. If `= yesterday`: `streak_days++`. Else reset to 1.
- Streak badge in `DashboardLayout` header next to brand switcher: "🔥 5-day streak".
- Weekly digest email:
  - New transactional email template via `email_domain--scaffold_transactional_email` named `weekly_digest` (subject, hero, stats: posts created this week, current streak, top performing post).
  - New cron route `src/routes/api/public/hooks/weekly-digest.ts` — iterates active users, computes stats from `repurpose_jobs` last 7 days, calls `sendTransactionalEmail`.
  - pg_cron schedule: every Monday 9 AM.
- Settings toggle "Weekly digest emails" on `dashboard.settings.tsx` → new `email_prefs` jsonb on profiles (or simple `weekly_digest_enabled boolean`).

---

### Files / deps
- edit: `src/lib/calendar.functions.ts`, `src/routes/dashboard.calendar.tsx`, `src/lib/seoBlog.functions.ts`, `src/server/seoBlog.server.ts`, `src/routes/dashboard.seo-blog.tsx`, `src/lib/templates.functions.ts`, `src/routes/dashboard.templates.tsx`, `src/components/DashboardLayout.tsx`, `src/routes/dashboard.settings.tsx`
- new: `src/routes/templates.gallery.tsx`, `src/routes/templates.$slug.tsx`, `src/lib/streak.functions.ts`, `src/routes/api/public/hooks/weekly-digest.ts`
- migrations: `templates` marketplace columns, `profiles` streak + digest pref columns
- cron: weekly digest Monday 9am
- email: `weekly_digest` transactional template
- no new npm deps needed

After approval I'll ship Turn 1 first, then Turn 2.
