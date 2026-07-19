# PostSpark Deep Audit — Findings

Generated Phase 0 of the stabilization plan. Severity: **P0** blocker, **P1** major, **P2** noticeable, **P3** polish.

---

## Top 10 Conversion Killers (fix these to make money)

| # | Issue | Severity | Where |
|---|---|---|---|
| 1 | **Pricing inconsistency** — landing/pricing/use-case pages show `$19/mo`, dashboard/checkout shows `$24/mo`. Users lose trust the second they click "Upgrade". | P0 | `src/routes/pricing.tsx`, `use-cases.*.tsx`, `tools.*.tsx`, `alternatives.*.tsx` |
| 2 | **25 server functions have no try/catch** — any failure returns raw `Response` and crashes the UI with `[object Response]` (same class of bug we've been patching one-at-a-time for weeks). | P0 | `src/lib/*.functions.ts` — see list below |
| 3 | **Paddle end-to-end never verified in one session** — checkout → webhook → `profiles.plan` sync → paywalled feature unlocks. If any link is broken, no one can pay. | P0 | Payments flow |
| 4 | **First-run dashboard is cluttered** — new user has no obvious "first action". Kills activation. | P1 | `src/routes/dashboard.index.tsx` |
| 5 | **Paywall triggers on page load, not at moment of value** — user gets blocked before feeling the product's magic. | P1 | Various tool routes |
| 6 | **Landing v3 promises features that may be broken** — need to verify every claim maps to a working feature. | P1 | `src/components/landing/v3/*` |
| 7 | **No real product screenshots on landing** — currently generated/stock imagery. Reduces credibility. | P1 | Landing hero + feature sections |
| 8 | **Empty states are bare** — Gallery, History, Calendar, Approvals show "No data" instead of a next-action CTA. | P2 | Multiple dashboard routes |
| 9 | **UpgradeNudgeModal copy is feature-list, not benefit** — low conversion. | P2 | `src/components/UpgradeNudgeModal.tsx` |
| 10 | **Free tier value not obvious in first 30 seconds** — no preloaded sample content. | P2 | `src/routes/dashboard.index.tsx` |

---

## Top 10 Trust Killers (things that make the app feel broken)

| # | Issue | Severity | Where |
|---|---|---|---|
| 1 | **`[object Response]` errors on any server-fn failure** (same as conversion #2). Users see the app "crash". | P0 | 25 files |
| 2 | **Light-mode leaks in 29 files** — hardcoded `bg-white`, `text-[#1A1A2E]`, `from-[#F5F3FF]` overriding dark theme. Feels inconsistent. | P0 | See full list below |
| 3 | **Claude generation errors are generic** — "Generation failed" instead of "AI is overloaded, retry in 30s". Users blame the app. | P1 | Repurpose, Hooks, Copilot, Carousel, SEO Blog server files |
| 4 | **Replicate model failures on Background Removal / Image gen** — needs fallback chain audited across every Replicate caller (currently only `image.server.ts` has it). | P1 | `src/server/*.server.ts` |
| 5 | **Mobile (375px) untested** — sidebar, dashboard tiles, editor likely broken. | P1 | Every dashboard route |
| 6 | **Shorts Editor: heavy CSS overrides create fragile UI** — every change risks regressing another view. | P1 | `src/styles.css` normalization layer |
| 7 | **Bottom mobile nav removed but no replacement on mobile** — mobile navigation gap. | P2 | `src/components/DashboardLayout.tsx` |
| 8 | **Loading states missing** — blank screens on data routes cause "app is frozen" perception. | P2 | Dashboard tool routes |
| 9 | **Toast copy is inconsistent** — some routes use technical strings, some friendly. | P2 | Toast usages across `src/` |
| 10 | **Error boundaries not wired everywhere** — one broken route can white-screen. | P2 | Route configs |

---

## Server functions with no error handling (P0 fix list)

These 25 files can leak raw `Response` objects to the UI on any DB/network failure:

```
src/lib/abHooks.functions.ts
src/lib/agencyAnalytics.functions.ts
src/lib/approvals.functions.ts
src/lib/blog.functions.ts
src/lib/blogAdmin.functions.ts
src/lib/brandVoice.functions.ts
src/lib/buildInPublic.functions.ts
src/lib/calendar.functions.ts
src/lib/campaigns.functions.ts
src/lib/carousel.functions.ts
src/lib/cloudRender.functions.ts
src/lib/editorProjects.functions.ts
src/lib/funnel.functions.ts
src/lib/import.functions.ts
src/lib/linkedinDownloader.functions.ts
src/lib/onboarding.functions.ts
src/lib/podcast.functions.ts
src/lib/referrals.functions.ts
src/lib/shortsSeries.functions.ts
src/lib/socialProof.functions.ts
src/lib/stockMedia.functions.ts
src/lib/streak.functions.ts
src/lib/templates.functions.ts
src/lib/testimonialsAdmin.functions.ts
src/lib/workspace.functions.ts
```

**Fix pattern:** every `.handler()` body wrapped in try/catch, returning `{ data: null, error: string }` on failure. UI already expects this shape from the fixed files.

---

## Files with hardcoded light colors (29)

```
src/components/deals/LtdValueCalculator.tsx
src/components/deals/LtdFaq.tsx
src/components/dashboard/AskBar.tsx
src/components/DashboardLayout.tsx
src/components/auth/AuthShell.tsx
src/components/VisualPreview.tsx
src/components/SparkCopilot.tsx
src/components/ReferralBanner.tsx
src/components/stock/StockPhotoCard.tsx
src/components/stock/StockMediaPicker.tsx
src/components/landing/TestimonialsSection.tsx
src/components/shorts/TimelineEditor.tsx
src/components/shorts/LiteEditor.tsx
src/routes/dashboard.brand-kit.tsx
src/routes/dashboard.billing.tsx
src/routes/dashboard.distribution-kit.tsx
src/routes/deals.lifetime.tsx
src/routes/dashboard.build-in-public.tsx
src/routes/gallery.index.tsx
src/routes/dashboard.podcast.tsx
src/routes/dashboard.index.tsx
src/routes/dashboard.humanizer.tsx
src/routes/dashboard.hook-lab.tsx
src/routes/dashboard.history.tsx
src/routes/dashboard.shorts-studio.tsx
src/routes/dashboard.shorts-series.tsx
src/routes/dashboard.reply-generator.tsx
src/routes/dashboard.seo-blog.tsx
src/routes/dashboard.settings.tsx
```

**Fix pattern:** replace hardcoded hex with design-token classes (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`). Kill the CSS `!important` override layer once these are clean.

---

## Pricing mismatch map (P0)

| Location | Says | Should say |
|---|---|---|
| `pricing.tsx` head | `$19/mo` | `$24/mo` monthly, `$19/mo` annual |
| `use-cases.youtube-to-linkedin.tsx:59` | `$19/mo` | `$24/mo` |
| `use-cases.tiktok-to-youtube-shorts.tsx:58` | `$19/mo` | `$24/mo` |
| `use-cases.podcast-to-social.tsx:59` | `$19/mo` | `$24/mo` |
| `tools.youtube-to-blog.tsx:25` | `$19/mo` | `$24/mo` |
| `tools.youtube-thumbnail-maker.tsx:24` | `$19/mo` | `$24/mo` |
| `alternatives.buffer-vs-postspark.tsx:25` | `$19/mo` | `$24/mo` |

**Fix pattern:** create `src/lib/pricing.ts` as single source of truth (`PRICE_PRO_MONTHLY`, `PRICE_PRO_ANNUAL`, `PRICE_AGENCY_MONTHLY`, `PRICE_LIFETIME`), import everywhere.

---

## Per-area findings

### Auth & onboarding
- ✅ Google + email/password wired
- ⚠️ Password reset route exists — needs end-to-end test
- ⚠️ Onboarding wizard drop-off unknown (no analytics)

### Repurpose (core revenue driver)
- ✅ Claude Sonnet 4.5 backend, "Claude 5" UI label
- ⚠️ Generic error messages on failure (needs Anthropic error surfacing, same as Shorts)
- ⚠️ Usage limit check happens server-side but UI shows count after refresh

### Shorts suite
- ✅ Studio generation retry logic
- ✅ MP4 export reset (fixed last turn)
- ⚠️ CSS override layer is fragile
- ⚠️ Not tested on mobile

### Image Studio
- ✅ Background-removal fallback chain
- ⚠️ Other Replicate callers (thumbnail, image gen) lack the fallback
- ⚠️ Stock picker in-app download works, but video hover-play regressed once — needs regression test

### Publishing
- ✅ LinkedIn API 202506
- ⚠️ TikTok Content Posting untested end-to-end
- ⚠️ Approvals flow — email delivery unverified

### Billing
- 🔴 Not verified end-to-end this cycle
- ⚠️ `dashboard.billing.tsx` shows both `$19` (annual) and `$24` (monthly) — check that matches Paddle catalog

### Landing & SEO
- ⚠️ Landing v3 exists but no analytics on which section converts
- ⚠️ Meta tags need per-route audit
- ⚠️ Blog seed exists but backlink strategy unknown

### Emails
- ✅ Drip templates day 0/2/5/7 exist
- ⚠️ Deliverability not verified (no test send in this cycle)

### Observability
- 🔴 No user analytics (PostHog/Plausible not connected)
- 🔴 No error tracking in production beyond console.error

---

## Recommended fix order (revised Phase 1)

Ranked by revenue impact × effort:

1. **Single pricing source of truth + fix all `$19` → `$24`** (1 hr, unblocks trust)
2. **Sweep 25 server fns with try/catch wrapper** (2 hr, kills whole class of `[object Response]` bugs)
3. **Paddle end-to-end verification** (1 hr, confirms money can flow)
4. **Extend Claude error surfacing to Repurpose + Copilot + Carousel + SEO Blog** (1 hr)
5. **Extend Replicate fallback chain to all image callers** (1 hr)
6. **Kill hardcoded light colors in 29 files, then remove CSS override layer** (3 hr)
7. **Mobile 375px pass on top 5 revenue routes** (2 hr): landing, pricing, dashboard, repurpose, shorts-studio
8. **First-run dashboard redesign — single CTA + sample content** (2 hr)
9. **Empty states across dashboard** (1 hr)
10. **Loading skeletons on data routes** (1 hr)

**Total Phase 1: ~15 hours of build. Realistic in 3–4 sessions.**

---

## What Phase 1 will NOT include (deferred)

- New features
- New tool pages
- New AI models
- New integrations
- Design overhauls beyond killing light-mode leaks
- Analytics setup (Phase 4)

---

## Next step

Tell me **"start Phase 1"** and I'll execute in this order:
1. Pricing source of truth + sweep
2. Server-fn try/catch sweep
3. Paddle E2E verification
4. Then pause and show you progress before continuing.
