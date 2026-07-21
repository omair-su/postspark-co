
# PostSpark — Deep Audit & Stabilization Plan

Goal: make every existing feature reliable enough that a stranger can sign up, hit "Repurpose", and pay — without hitting a broken thing. No new features.

---

## What I found (audit summary)

I walked the app across 4 surfaces: **landing/SEO → auth → dashboard tools → billing**. Findings grouped by severity.

### 🔴 P0 — Blocks money or trust from message 1

1. **Payments end-to-end not verified this cycle.** Paddle checkout → webhook → `profiles.plan` update → paywalled feature unlock. If any link is broken today, nobody can actually pay. Highest-risk unknown.
2. **`[object Response]` errors still possible in ~25 server functions.** We patched a bunch, but files like `agencyAnalytics`, `campaigns`, `funnel`, `templates`, `workspace`, `shortsSeries`, `stockMedia`, `blogAdmin`, `testimonialsAdmin`, `onboarding`, `referrals` still throw raw `Response` on any failure → UI crashes.
3. **Claude / Replicate generic errors.** When an AI provider is overloaded or a model 404s, user sees "Generation failed" and blames PostSpark. Only `image.server.ts` has proper fallback + error surfacing today.
4. **Publishing flows unverified.** LinkedIn (API 202506) — need one real post. TikTok Content Posting — never tested end-to-end. Approvals email — deliverability unverified.
5. **No production observability.** No PostHog / Plausible, no error tracker. We are flying blind on where users drop off and what breaks in the wild.

### 🟠 P1 — Feels broken / kills activation

6. **Mobile (360–414px) untested.** User is literally on 360×647 right now. Dashboard tiles, sidebar sheet, Shorts Editor timeline, Image Studio grid, pricing table — all likely awkward or broken. Bottom nav was removed and never replaced.
7. **First-run dashboard has no obvious first action.** New user lands on `/dashboard`, sees 20+ tools, no guided path → bounces. Activation is the #1 revenue lever we haven't pulled.
8. **Light-mode leaks in ~29 components.** Hardcoded `bg-white`, `text-[#1A1A2E]`, `from-[#F5F3FF]` inside a dark-forced app → invisible text pockets. Currently masked by a fragile `!important` CSS override layer that keeps regressing icon colors and hover states.
9. **Empty states are bare.** Gallery, History, Analytics, Calendar, Approvals show "No data" instead of "Do X to get started" CTA. Feels dead.
10. **Loading states missing on data-heavy routes.** Blank screens for 500–1500ms reads as "app is frozen" on slow networks.

### 🟡 P2 — Polish gap

11. Toasts use inconsistent copy (some technical, some friendly).
12. Error boundaries not on every route — one broken route can white-screen.
13. Upgrade nudge copy is feature-list, not benefit → low conversion.
14. Free-tier value not obvious in first 30s — no preloaded sample.
15. Landing v3 claims features that need each verified.

---

## Root-cause patterns (why bugs keep coming back)

- **No error-shape contract.** Server fns sometimes throw, sometimes return, sometimes leak Response. UI can't handle it uniformly.
- **CSS override layer instead of fixing components.** Every fix regresses something else.
- **No end-to-end tests for revenue paths** (signup → generate → paywall → checkout → unlock). We only catch breakage when a user complains.
- **No observability.** We patch the loudest bug, not the most-hit one.

---

## Plan — 5 phases, ordered by revenue impact

### Phase A — Money can flow (must ship first)
```text
Day 1
├─ A1  Paddle E2E test: sandbox card → webhook → plan flips → Pro
│      feature unlocks. Log every step. Fix whatever breaks.
├─ A2  Add DB check: profiles.plan trigger + subscriptions.environment
│      filter present on every read path (already patched, re-verify).
└─ A3  Billing page audit: cancel, resume, portal link all work.
```

### Phase B — Kill the "broken app" perception
```text
Day 2
├─ B1  Wrap remaining ~11 server fns in the standard
│      try/catch → { data, error } contract.
├─ B2  Anthropic error surfacer: map 429/529/5xx to friendly
│      "AI is busy, retry in Xs" across Repurpose, Copilot, Carousel,
│      SEO Blog, Hook Lab (Shorts already done).
├─ B3  Replicate fallback chain: extend the pattern from image.server.ts
│      to thumbnail + image-gen callers.
└─ B4  Add root error boundary + per-route errorComponent audit.
```

### Phase C — Kill the CSS override layer
```text
Day 3
├─ C1  Sweep 29 files: swap hardcoded colors → design tokens
│      (bg-card, text-foreground, text-muted-foreground, border-border).
├─ C2  Remove the !important override block in src/styles.css.
└─ C3  Visual regression check on top 10 routes.
```

### Phase D — Mobile + activation
```text
Day 4
├─ D1  360px pass on: landing, pricing, dashboard, repurpose,
│      shorts-studio, image-studio, billing.
├─ D2  First-run dashboard: single "Try your first repurpose" CTA
│      with a preloaded sample source. Everything else collapses.
├─ D3  Empty states with next-action CTA on Gallery, History,
│      Analytics, Calendar, Approvals.
└─ D4  Loading skeletons wherever a fetch gates render.
```

### Phase E — See what's happening
```text
Day 5
├─ E1  Wire PostHog (or Plausible) — free tier, one script tag.
│      Track: signup, first-generation, upgrade-click, checkout-open,
│      checkout-success, cancel.
├─ E2  Client error tracker: window.onerror + unhandledrejection →
│      log to a public API route (already have /api/public/).
├─ E3  Simple funnel dashboard in admin view.
└─ E4  Verify LinkedIn + TikTok publishing with one real post each.
```

---

## What we are explicitly NOT doing

- No new tools, no new landing pages, no new blog posts.
- No design overhaul beyond token cleanup.
- No new integrations.
- No new AI models.

Any of those can start after Phase E is green.

---

## Success criteria

| Metric | Today | After Phase E |
|---|---|---|
| Payment E2E verified | ❌ | ✅ |
| Server fns with error contract | 60% | 100% |
| Hardcoded light colors | 29 files | 0 |
| Mobile-tested revenue routes | 0 | 7 |
| Observability | none | funnel + error tracker |
| Time-to-first-value (new user → 1 output) | unknown | <60s tracked |

---

## Technical notes (for me, on execution)

- Error contract: every `.handler()` returns `{ data: T | null, error: string | null }`. UI handles both without a Suspense error boundary.
- CSS cleanup rule: no new `!important`. If a component needs a color, it uses a token — no exceptions.
- Mobile pass done at 360×640 (min supported) and 390×844.
- PostHog/Plausible: script only, no server SDK (Worker-safe).
- Paddle E2E: use the existing sandbox banner + `PaymentTestModeBanner` component to confirm environment on each step.

---

Approve and I'll start with **Phase A** (Paddle end-to-end verification) since that's the only thing standing between the current app and real revenue.
