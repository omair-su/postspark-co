# PostSpark — Full Product Audit & Next-Level Plan

A page-by-page review followed by a prioritized roadmap. Goal: make PostSpark feel obviously better than the alternatives so creators try it organically and convert.

---

## Part 1 — What you have today (page-by-page audit)

### A. Marketing site (public)

| Page | Status | What works | What's hurting conversion |
|---|---|---|---|
| `/` (landing) | Mostly good | Strong hero, premium features grid, JSON-LD, FAQ schema | Hero has only **one CTA** and **no demo/social proof above the fold**. Navbar uses `scrollTo` (broken when on other pages — hash anchors don't navigate). "Trusted by 1,000+" with no logos = looks fake. Only 3 generic testimonials with no photo/handle/source. No live demo or interactive sample. |
| `/pricing` | OK | Clean, JSON-LD Product, 14-day trial copy | No comparison table (Free vs Pro vs Agency feature grid). No "what you save vs Jasper/Buffer" math. No annual toggle / savings. No money-back guarantee badge. |
| `/login`, `/signup` | Functional | Google OAuth, referral capture | No social proof on signup ("Join 1,000+ creators"). No preview of what they'll get. No trust badges. |
| `/features/*` (3 pages) | Solid templated SEO pages | SeoLandingPage has FAQ, JSON-LD, internal links | All 3 use the **same template** → look identical → low time-on-page. No actual screenshots/demos of the feature. |
| `/for/creators`, `/for/agencies` | Same template as features | Good for SEO | Same templating issue. Agency page should have a calculator ("hours saved per client × clients = $"). |
| `/gallery`, `/gallery/$slug` | Live but empty-feeling | Public showcase exists, OG images per item | Likely has near-zero items (no seed). No category filters, no "remix this" CTA, no creator attribution that drives signups. |
| `/blog`, `/blog/$slug`, RSS | Infrastructure ready | Routes + categories + authors exist | Need seeded cornerstone posts to actually rank. |
| `/privacy`, `/terms`, `/refunds` | Standard | Required, present | Fine. |
| `/onboarding` | 2-step (role + platforms) | Captures intent | **Doesn't lead to a "wow" moment**. After onboarding user lands on empty dashboard instead of a pre-filled first repurpose. |

### B. Dashboard (authed app)

The sidebar lists **17 nav items**. That's a LOT. Audit:

| Item | State | Verdict |
|---|---|---|
| Dashboard | Stats + recent jobs | Fine but bland — no "next best action" |
| Repurpose | Core flow, 558 LoC | Powerful but **dense**: 10 format chips, tone selector, custom instructions, brand override toggle, language, YouTube tab — overwhelming on first use |
| Import Studio | YouTube/PDF/URL import | Good differentiator, but separate from Repurpose causes friction (user has to import → switch page → paste → repurpose) |
| SEO Blog | Long-form generator | Good Pro hook |
| Hook Lab | Hook variants | Good Pro hook |
| Image Studio | AI images | Good but expensive — needs usage caps shown |
| Calendar | Drag-drop scheduling | High-value but **only useful if there's a publishing integration** — currently planning-only |
| Brand Voice | Sample upload | Great Pro feature, often hidden |
| Brand Kit | Logo/colors/fonts | Great, often hidden |
| History | Past jobs | Functional |
| Analytics | Usage stats | Vague — what does the user do with it? |
| Templates | Saved configs | Useful, under-discovered |
| Refer & Earn | Referrals | Good growth loop, buried at #13 in nav |
| Gallery | Public showcase | Belongs in marketing nav too |
| Team | Multi-seat | Agency only |
| Agency Analytics | Rollup | Agency only |
| Settings | Account, plan, etc. | Fine |

### C. Cross-cutting issues

1. **Navbar's `scrollTo`** uses `document.getElementById` — works on `/` but on any other page (pricing, gallery, blog) clicking "Features" silently fails.
2. **Hero has no live preview** — every winning AI tool ships a demo (Jasper, Copy.ai, Notion AI). PostSpark just shows static text.
3. **No "before/after" with real content** — the BeforeAfter section shows abstract icons, not actual generated tweets.
4. **Onboarding doesn't deliver the aha moment** — user lands on empty dashboard. Should auto-run a sample repurpose with their stated platforms.
5. **No usage feedback loop** — when a free user hits 3/3, the upgrade prompt is the only path. There's no "share to earn more" or "invite a friend for +1 repurpose" inline.
6. **No public proof** — testimonials are generic stock names. No real Twitter/LinkedIn screenshots, no Product Hunt badge, no user count, no logos.
7. **Free tier is too thin** — 3/month is barely enough to evaluate quality. Competitors give 10–50 free generations.
8. **Mobile sidebar nav has 17 items** — overwhelming on the 506px viewport the user is testing.
9. **No "What changed" / changelog** — premium features are labeled "New" forever; should link to a real changelog page.
10. **Email lifecycle is reactive only** — transactional emails work, but no Day-1 onboarding email, no Day-3 "here's what to try", no Day-7 upgrade nudge.

---

## Part 2 — Prioritized roadmap (4 phases)

### Phase 1 — Conversion fundamentals (1–2 sessions, biggest ROI)

Goal: 2× landing → signup, 2× signup → first repurpose.

1. **Real hero demo** — replace the static hero subtitle with an interactive paste box: user types/pastes a sentence, clicks "See it work", and sees 3 sample outputs (tweet, LinkedIn, hook) generate in front of them. Falls back to a pre-rendered animated example for SSR/no-JS. This is the single highest-leverage change.
2. **Fix Navbar cross-page nav** — replace `scrollTo` with `<Link to="/#features">` patterns + a `useEffect` on `/` that scrolls to `location.hash` on mount. Otherwise nav is broken everywhere except `/`.
3. **Real social proof bar** — replace "Trusted by Creators / Agencies / Marketers" with actual logos (even 4–6 small startups) OR Twitter/LinkedIn screenshot carousel. Include real handle, photo, and link.
4. **Pricing comparison table** — add a feature-by-feature grid (Free / Pro / Agency) below the cards. Add "Replaces $X/mo of tools" math. Add money-back guarantee badge. Add annual toggle (e.g. 2 months free).
5. **Bump Free tier to 5–10 repurposes/month** — 3 is below the threshold where users can fairly evaluate quality. The cost is small; the conversion gain is large.
6. **Onboarding → instant aha** — at the end of onboarding, auto-run a curated sample repurpose tailored to the chosen platforms, so the user lands on a *populated* result page, not an empty dashboard. Show "This is what PostSpark made for you in 4 seconds. Now try with your own content →".

### Phase 2 — Activation & retention (1–2 sessions)

Goal: more first-week repurposes per signup, more day-7 returns.

1. **Merge Import + Repurpose** — make Import a tab inside the Repurpose page (Text / YouTube / Upload / URL). Removes one nav item, removes a context switch.
2. **First-run guided tour** — 3-step tooltip walkthrough on first dashboard visit (Repurpose → Brand Voice → Calendar). Skippable. Stored on profile.
3. **"Suggest content" widget** — on the dashboard home, show 3 trending topics for the user's stated platforms, each as a one-click "Generate now" prompt. Solves the blank-page problem.
4. **Inline upgrade nudges with reward path** — when free user hits 3/3, show two paths: "Upgrade to Pro" AND "Invite 1 friend → +2 free repurposes this month". Already have referrals — just surface it at the limit moment.
5. **Email lifecycle (4 emails)** — Day 0 welcome with 3 sample inputs to try, Day 2 "your brand voice is empty — train it in 60s", Day 5 social proof + upgrade, Day 12 "your trial ends in 2 days — here's what you've created".
6. **Sidebar trim** — collapse 17 items into 4 sections with sub-nav: **Create** (Repurpose, SEO Blog, Hook Lab, Image Studio, Import), **Plan** (Calendar, Templates, History), **Brand** (Brand Voice, Brand Kit), **Account** (Analytics, Referrals, Team, Settings). Gallery moves to a top-bar link.

### Phase 3 — Differentiation & virality (2–3 sessions)

Goal: organic word-of-mouth, defensible moat.

1. **Brand Voice quality bar** — current upload-and-pray needs visible feedback: "Your voice is 87% trained. Add 2 more samples for best results." Show before/after sample on every save.
2. **Public gallery seeding + remix** — seed gallery with 30–50 hand-picked examples across niches. Add "Remix this" button on every gallery item that pre-fills the repurpose page with the source. Add creator attribution that links back to their profile (drives signups via virality).
3. **Publisher integration (at least one)** — Calendar without publishing is half-built. Ship a Buffer/Typefully/Make.com webhook integration so users can actually push to Twitter/LinkedIn. This unlocks Calendar's value and is a major moat vs Jasper/Copy.ai.
4. **Live changelog page** (`/changelog`) — replaces the perpetual "New" badges, gives SEO surface, builds trust that the product ships.
5. **Public roadmap + voting** — Trello-style board (can be a single route reading from a `roadmap_items` table). Creators love feeling heard; this is also a content-marketing surface.
6. **Embeddable "Generated with PostSpark" badge** — opt-in attribution badge on shared content + on review/approval pages → free top-of-funnel.

### Phase 4 — SEO & content engine (ongoing, but kick off in 1 session)

Goal: organic traffic that compounds.

1. **Differentiate the 5 SEO landing pages** — currently all use the same `SeoLandingPage` template. Add unique hero screenshots, unique testimonial, unique sample output for each. Templates are SEO-penalized as duplicate intent.
2. **Seed 3 cornerstone blog posts** using the existing SEO Blog generator (e.g. "Repurpose a YouTube video to LinkedIn", "Best AI tools for content repurposing 2026", "How agencies scale content with AI"). Linked from footer + relevant feature pages.
3. **Comparison pages** (`/compare/postspark-vs-jasper`, `/vs-buffer`, `/vs-typefully`) — these rank fast for high-intent buyer queries.
4. **Gallery as SEO surface** — every `/gallery/$slug` already has per-item meta — make sure they're in the dynamic sitemap and the index page links to top items, not just a feed.
5. **Submit to** Product Hunt, There's An AI For That, AlternativeTo, Futurepedia, G2.

---

## Part 3 — Suggested execution order

```text
Sprint 1 — "Make the landing page actually convert"
  ├─ Interactive hero demo (live or pre-rendered fallback)
  ├─ Fix Navbar cross-page nav (Link + hash scroll)
  ├─ Real social proof (logos OR tweet screenshots)
  ├─ Pricing comparison table + annual toggle
  └─ Bump free tier to 5–10/month

Sprint 2 — "Make new users succeed in their first session"
  ├─ Onboarding → auto-run sample repurpose
  ├─ Merge Import into Repurpose tabs
  ├─ Dashboard "Suggest content" widget
  └─ Sidebar IA refactor (4 grouped sections)

Sprint 3 — "Build the moat"
  ├─ Buffer/Typefully publishing integration
  ├─ Gallery seeding + Remix button + creator attribution
  ├─ Brand Voice quality scoring
  └─ Changelog + Public Roadmap pages

Sprint 4 — "Compound organic growth"
  ├─ Differentiate SEO landing templates
  ├─ Seed 3 cornerstone blog posts
  ├─ Comparison pages (vs Jasper / vs Buffer / vs Typefully)
  └─ Email lifecycle (4-step drip)
```

---

## Part 4 — Things I deliberately won't change

- Brand colors / typography / logo (already strong, on-brand)
- Paddle billing flow (working, regulated, don't touch)
- Auth flow (email + Google works well)
- Core Anthropic Claude integration for generation
- Existing dashboard route names (would break user bookmarks/emails)

---

## What I need from you to start

Pick the sprint you want me to ship first (recommend **Sprint 1** — biggest conversion lift, no schema changes). I'll implement it end-to-end in the next message. We can tackle one sprint per follow-up so each ship is reviewable.

If you want, I can also call out which 1–2 items in each sprint give 80% of the value if you'd rather do a "best-of" sprint instead of phase-by-phase.
