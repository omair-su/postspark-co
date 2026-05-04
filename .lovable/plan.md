# PostSpark — Audit & Roadmap to v2

A complete review of what's live, what's broken, and what to build next so PostSpark stops feeling like a demo and starts converting visitors into paying users.

---

## Part 1 — Audit Findings

### A. Critical bugs to fix immediately (Sprint 0 — same day)

1. **Sidebar doesn't scroll (your reported bug)** — confirmed. In `DashboardLayout.tsx` the `<nav>` has `flex-1 space-y-1 px-3 py-4` but **no `overflow-y-auto`**. With 17 nav items + the user/sign-out footer, items below "Settings" get clipped on laptop screens and on mobile. Fix: add `overflow-y-auto` + `min-h-0` to the nav, and make the user-info footer `shrink-0`.

2. **Mobile sidebar height** — the mobile drawer uses the same nav, same bug, plus the close affordance is only the backdrop tap. Add an explicit X button at the top.

3. **Brand switcher in header is hidden on mobile** (`hidden sm:flex`) — Agency users on phones can't switch workspace. Move it into the mobile sidebar.

4. **Image Studio file is 1,163 lines** — single component, hard to debug, likely the source of repeated "no image returned" regressions. Split into `ImageGeneratorForm`, `ImageHistoryGrid`, `ImageEditPanel` and a thin route shell.

5. **Onboarding gate fires on every dashboard mount** — `dashboard.tsx` calls `getOnboardingStatus` on every navigation. Cache the "completed" result in localStorage to remove a server roundtrip per click.

6. **No global error boundary on dashboard routes** — when a server fn throws (e.g. Anthropic 5xx, rate limit), the whole page goes blank instead of showing a retry. Add `errorComponent` to each route with a server fn.

7. **PWA install prompt mounts in dashboard layout** — fires during sign-up flow on mobile, distracting. Memory says it should fire after first repurpose; implement that gate.

### B. Honest gaps (features that look done but aren't)

| Feature | Status | What's missing |
|---|---|---|
| Calendar / scheduled posts | UI works, DB has rows | **No publisher.** Nothing ever posts to Twitter/LinkedIn. No OAuth. |
| Analytics page | Page renders | **No data writer.** `post_metrics` table is empty. Charts show local generation counts only. |
| Pro / Agency upgrade | Buttons live | Paddle webhook wired but **no test of full lifecycle** (cancel, dunning, refund). Welcome email path exists but unverified. |
| Team invites | Token created | **Email never sent.** User must copy-paste the URL. |
| Approvals | Review page works | **Approval-request email never sent.** Same problem. |
| Brand Kit | Single kit per user | DB supports multiple, UI only shows first. Agency users can't manage clients properly. |
| Repurpose history | Saves jobs | Doesn't save `brand_kit_id` or `workspace_id` → Agency Analytics rollups are broken. |
| Search | None | No full-text search across history, gallery, or templates. |
| Admin / observability | None | No way to see signups, MRR, AI cost, error rate. Flying blind. |

### C. UX inconsistencies across the 28 routes

- 9 routes use a custom heading style, 6 use `<h1 className="text-3xl">`, 3 use card wrappers — no shared `PageHeader` component.
- Some routes have empty states with CTAs (Repurpose, Calendar), most don't (History, Templates, Hook Lab show a blank panel).
- Loading states are inconsistent: some use `<Loader2>` spinner, some show skeletons, some show nothing (page just freezes).
- No global "AI is thinking" indicator — user clicks Generate, nothing happens for 30–90s, they bounce. The original spec asked for a navbar progress bar.
- Toast usage is inconsistent (some success, some silent; some errors swallowed).
- Mobile: most dashboard pages have horizontal overflow because cards use fixed widths instead of `min-w-0`.

### D. Performance & infra

- 1,163-line route files ship as one chunk — slow first paint on dashboard. Split + lazy-load heavy panels.
- No rate limiting on AI server fns → one bad actor can burn your Anthropic budget.
- No retry/backoff on Claude calls — transient 529s surface as user errors.
- `social_accounts` table has SELECT policy but **no INSERT/UPDATE policy** → even when OAuth ships, writes will fail.
- `post_metrics` is fully locked → analytics writer can't function.

### E. SEO / Growth surface

- Landing page is solid but `/gallery`, `/pricing`, `/privacy`, `/terms` don't have unique `head()` metadata in some cases.
- No public profile pages (`/u/$handle`) for gallery virality.
- No sitemap entries for gallery items.
- No referral payout — only credits, which Free users can't even spend.

---

## Part 2 — The Plan (3 sprints to v2)

### Sprint 0 — Bug fix pass (1 day, ship today)

```text
- Sidebar scroll fix (nav: overflow-y-auto + min-h-0; footer: shrink-0)
- Mobile sidebar X button
- Move brand switcher into mobile sidebar
- Add errorComponent to all dashboard.* routes (retry button)
- Global navbar progress bar during AI calls (Zustand store)
- Cache onboarding-complete in localStorage
- Gate PWA prompt behind first-repurpose-done flag
- Split dashboard.image-studio.tsx into 4 files
```

### Sprint 1 — Polish & consistency (2-3 days)

```text
- Build shared <PageHeader title subtitle action /> + adopt across 28 routes
- Build shared <EmptyState icon title body cta /> + add to History,
  Templates, Hook Lab, Calendar, Image Studio, Brand Voice
- Standardize loading: <PageLoader/> for routes, <InlineSpinner/> in buttons,
  <SkeletonCard/> for grids
- Standardize toasts: success on every mutation, error.toString() never shown
  raw — always a friendly message
- Mobile pass: every card gets min-w-0, every grid gets responsive cols
- Full-text search on History (Postgres tsvector) + Gallery + Templates
- Multiple Brand Kits UI for Agency tier (DB already supports it)
- Persist brand_kit_id + workspace_id on repurpose_jobs insert
- Rate-limit AI server fns (10/min/user free, 60/min Pro, 200/min Agency)
- Retry/backoff wrapper around Anthropic + Replicate + ElevenLabs calls
- Fix RLS: add INSERT/UPDATE policies on social_accounts and post_metrics
- Per-route head() metadata audit (every public route gets unique title/desc/og)
```

### Sprint 2 — Make it a real SaaS (1 week)

The 4 things that actually unlock revenue. In priority order:

**2A. Real social publishing** (the #1 broken promise)
- Twitter/X OAuth 2.0 + LinkedIn OAuth, store tokens in `social_accounts`
- "Connect account" UI under Settings
- pg_cron job → `/api/public/publish-due-posts` every minute
  → posts due `scheduled_posts` via platform API
  → writes back `platform_post_id`, `published_at`, `publish_error`
- Per-platform live preview (Twitter card, LinkedIn card)

**2B. Payments lifecycle** (close the leaks)
- End-to-end test of Paddle: subscribe → upgrade → cancel → resubscribe → refund
- Customer portal link in Settings
- Server-side hard-enforce limits on downgrade
- 14-day Pro trial on signup (no card) — biggest conversion lever
- Failed-payment dunning email (3 attempts then downgrade)

**2C. Real performance analytics** (close the loop)
- pg_cron pulls likes/shares/comments/impressions from Twitter + LinkedIn
  for posts published in the last 30 days → writes to `post_metrics`
- Analytics page: per-post engagement, best time-of-day, top-performing
  hooks, brand-kit comparison
- Weekly digest email: "Your top post this week earned 142 likes"

**2D. Email infrastructure** (unblocks invites + approvals + digests)
- Resend integration
- Templates: invite, approval request, approval decided, weekly digest,
  trial ending, payment failed, welcome (paid)
- Wire team invites + approvals to actually send

### Sprint 3 — Growth & moat (later, only after Sprint 2 ships)

- Chrome extension: highlight any text → "Repurpose with PostSpark"
- Notion + Google Docs import
- Public profile pages `/u/$handle` (SEO + gallery virality)
- Sitemap entries for gallery items
- Affiliate program (cash payout) on top of existing referrals
- Internal admin dashboard: MRR, signups, churn, AI spend per user, error rate
- AI agent mode: "Turn this blog into a 30-day calendar" → fills calendar end-to-end

---

## Recommended order

```text
Sprint 0  (today)        Bug pass — sidebar scroll + 7 other fixes
Sprint 1  (2-3 days)     Polish, consistency, search, rate-limit, RLS
Sprint 2A (2-3 days)     Real Twitter + LinkedIn publishing
Sprint 2B (1-2 days)     Payments lifecycle + 14-day trial
Sprint 2C (2 days)       Real analytics pull
Sprint 2D (1 day)        Resend email infra
Sprint 3  (later)        Growth surface
```

---

## What I need you to decide

1. **Start point**: Should I start with **Sprint 0 today** (fix the sidebar + 7 other bugs you'd see immediately in the preview) or jump straight into a bigger sprint?
2. **Sprint 2 order**: Once polish is done, what's more important to you — **publishing** (2A, the most-asked feature) or **payments lifecycle + trial** (2B, the biggest revenue lever)?
3. **Email provider**: **Resend** (modern, dev-friendly, $0 for 3k emails/mo) or stick with the existing Lovable Cloud email path?

Reply with your picks and I'll execute.
