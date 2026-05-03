# PostSpark — Review & Next Roadmap

A walkthrough of what you have, what needs polish, and what to build next so the app is ready to charge real money.

---

## 1. Where PostSpark stands today

**Live capability surface (28 routes, 18 server modules):**
- Content engine: Repurpose, SEO Blog, Hook Lab, Import Studio, Brand Voice, Brand Kit, Templates
- Visuals: Image Studio (AI image generation)
- Distribution: Calendar (manual scheduling), public Gallery, History
- Monetization scaffolding: Free / Pro / Agency tiers, usage limits, referrals
- Agency tier: Workspaces, Team seats, Approvals, Agency Analytics, Bulk CSV
- Onboarding wizard, PWA install prompt, Brand Kit auto-apply

**Honest gaps that block real usage:**
1. **No real publishing** — "scheduled posts" never actually post to Twitter/LinkedIn. `social_accounts` table exists but no OAuth, no publisher cron.
2. **No payments** — Pro/Agency upgrade buttons are decorative. No Stripe/Paddle. Plan is set manually in DB.
3. **Analytics is fake** — `post_metrics` table has no writer; the Analytics page only shows local generation counts.
4. **Approval emails not sent** — Agency approval links must be copy-pasted manually.
5. **Team invites not emailed** — same problem; token only.
6. **No admin/observability** — no way to see signups, MRR, errors, AI cost.

---

## 2. Refinements needed on existing features (Sprint 3.5)

Small polish that meaningfully raises quality before adding new surface area.

### Repurpose
- Persist `brand_kit_id` and `workspace_id` on every job (currently `repurpose_jobs` has the columns but the insert doesn't fill them — breaks Agency Analytics rollups).
- Re-run / regenerate a single output type without redoing all of them.
- Per-output edit + save back to history.

### Brand Kit
- Allow multiple brand kits for Agency (DB allows it, UI still single-row).
- Show "applied to: X jobs this month" stat.

### Calendar
- Drag-to-reschedule (currently date-edit only).
- Status filter chips (scheduled / published / failed) and a "publish failures" callout.
- Timezone awareness on schedule picker.

### Team / Workspace
- BrandSwitcher in top bar (planned, never built) so Agency users can switch active client without leaving the page.
- Clear "active workspace = X" indicator.
- Server-scope every query by active workspace (today most still scope by `user_id` only).

### History & Gallery
- Full-text search across past jobs.
- Tag/category filter.
- Bulk delete.

### PWA / Onboarding
- Show install prompt only after the user completes their first repurpose (not at login — too early).
- Add a 1-line "what would you like to do first?" CTA on the dashboard for new users.

### Security & infra
- RLS audit on `social_accounts` (no INSERT/UPDATE policies → users can't connect accounts even when OAuth ships).
- Add INSERT/UPDATE policies on `post_metrics` (currently locked, so the analytics writer can't function).
- Rate-limit AI server functions per user/minute.

---

## 3. Sprint 4 — Make it a real SaaS

Three pillars, in priority order.

### A. Real social publishing (the #1 broken promise)
- Twitter/X OAuth 2.0 + LinkedIn OAuth → write tokens into `social_accounts`.
- "Connect account" UI under Settings.
- Publisher: pg_cron job hits `/api/public/publish-due-posts` every minute, posts due `scheduled_posts` via the platform API, writes back `platform_post_id` / `published_at` / `publish_error`.
- Per-post preview that mirrors how it'll look on the actual platform.

### B. Payments (turn on revenue)
- Stripe Checkout for Pro ($19) and Agency ($49) with monthly + annual.
- Customer portal for cancel/upgrade.
- Webhook → updates `subscriptions` + `profiles.plan`.
- Hard-enforce limits server-side on downgrade.
- 14-day Pro trial on signup (no card) to lift conversion.

### C. Performance analytics (close the loop)
- Cron pulls likes/shares/comments/impressions from Twitter + LinkedIn for posts published in last 30 days, writes to `post_metrics`.
- Analytics page: per-post engagement, best time-of-day, top hooks, brand-kit comparison.
- Weekly email digest ("Your top post this week earned 142 likes").

### D. Email infrastructure (unblocks invites + approvals + digests)
- Resend integration (or Lovable Cloud email).
- Templates: invite, approval request, approval decided, weekly digest, trial ending.

---

## 4. Sprint 5 — Growth & moat

- **Chrome extension**: highlight any text on the web → "Repurpose with PostSpark".
- **Notion / Google Docs import** (currently only paste/upload).
- **AI agent mode**: "Turn this blog into a 30-day content calendar" → fills the calendar end-to-end.
- **Public profile pages** for Gallery (`/u/$handle`) — SEO + virality.
- **Affiliate program** built on top of existing referrals (cash payout, not credits).
- **Admin dashboard** (internal): MRR, signups, churn, AI spend per user.

---

## 5. Recommended order

```text
Sprint 3.5  (1-2 days)  Refinements above — required before charging
Sprint 4A   (2-3 days)  Real Twitter + LinkedIn publishing
Sprint 4B   (1-2 days)  Stripe payments + trial
Sprint 4C   (2 days)    Performance analytics pull
Sprint 4D   (1 day)     Email infra (Resend)
Sprint 5    (later)     Growth surface
```

---

## What I'd like you to decide

1. Do you want me to start with **Sprint 3.5 refinements** (polish existing) or jump straight to **Sprint 4A real publishing** (most-asked feature)?
2. For payments: **Stripe** (default) or **Paddle** (better for non-US sellers, handles VAT)?
3. For email: **Resend** (modern, dev-friendly) or use Lovable Cloud's built-in email?

Reply with your picks and I'll execute.
