
# PostSpark Deep Audit & Stabilization Plan

Goal: stop adding features. Make everything currently in the app actually work, feel premium, and convert visitors into paying users. This plan is structured as an audit (what I'll check), a findings framework (recurring problems I already know exist), and a prioritized fix roadmap grouped into 4 phases you can approve one at a time.

---

## Phase 0 — Full audit sweep (I do this first, ~1 session)

I'll go through every surface systematically and produce a written report with severity ratings (P0 blocker → P3 polish). No code changes in this phase — just findings.

### Areas covered

1. **Auth & onboarding**
   - Sign up / login (email + Google), password reset, email confirmation
   - First-run onboarding wizard completion rate blockers
   - Session persistence, "invisible" logged-out states

2. **Core repurpose flow** (your #1 revenue driver)
   - Text → LinkedIn / X / Instagram / Thread outputs
   - Import from URL / YouTube / podcast
   - Brand Voice application
   - Usage limit enforcement (free 3/month)
   - Error surfaces when Claude fails

3. **Shorts suite** (Studio, Series, Editor)
   - Script generation reliability
   - B-roll fetch
   - Editor: timeline, VO (ElevenLabs), captions (Deepgram), MP4 export
   - Known issues: heavy CSS overrides, mobile usability

4. **Image Studio**
   - Generation, enhance prompt, background removal fallback chain
   - Stock photo/video picker + in-app download
   - Usage meter accuracy

5. **Publishing & integrations**
   - LinkedIn post (recently patched to API 202506)
   - TikTok Login Kit + Content Posting
   - Approvals / client workflow
   - Agency workspace members

6. **Billing & subscription**
   - Paddle checkout (test + live)
   - Plan sync trigger to `profiles.plan`
   - Founding Lifetime cap logic
   - Cancel → keep-access-until-period-end
   - Upgrade nudges, paywall placement

7. **Landing & SEO**
   - Landing v3, tool landing pages, blog, gallery
   - Meta tags, og:image per route
   - Core Web Vitals (LCP, CLS)
   - Robots, sitemap, canonical

8. **Design system consistency**
   - Dark theme coverage across every route (still gaps)
   - Contrast (WCAG AA minimum)
   - Mobile 375px, tablet 768px, desktop 1440px pass

9. **Emails**
   - Auth emails, drip (day 0/2/5/7), usage warnings, receipts
   - Deliverability + branding

10. **Error handling & observability**
    - Every server function: does it return `{ error }` cleanly or throw a raw Response?
    - Console errors on load per route
    - Server-function logs review

### Audit deliverable
A written findings doc saved to `.lovable/audit.md` with:
- one row per issue: route/component, severity, symptom, root cause, fix effort
- top 10 conversion killers (things blocking someone from paying)
- top 10 trust killers (things that make the app feel broken)

---

## Phase 1 — P0 blockers (fix immediately after audit, 1 session)

Based on what I already know from recent tickets, this phase will include:

1. **Stabilize server functions returning `Response` objects**
   - Wrap remaining `.functions.ts` files in try/catch → return typed `{ data, error }` DTOs. We've hit this repeatedly (`getShortsUsage`, `getConnectedSocials`). Sweep the rest before users hit them.

2. **Fix any generation flow that can silently fail**
   - Claude: surface real Anthropic error, retry-once already exists in Shorts — extend to Repurpose, Hooks, Copilot, Carousel, SEO Blog.
   - Replicate: model-fallback chain already in image.server.ts — audit other Replicate callers.

3. **Kill remaining "invisible text" and light-mode leaks**
   - One comprehensive pass across every route in dashboard (not spot fixes). Grep for hardcoded `text-[#...]`, `bg-white`, `from-[#F5F3FF]` and replace with tokens.

4. **Paddle checkout end-to-end verification**
   - Test-mode purchase → webhook → `subscriptions` row → `profiles.plan` = pro → paywalled feature unlocks. If any link breaks, that's a revenue P0.

5. **Mobile blockers**
   - 375px layout: sidebar, dashboard tiles, editor. No horizontal scroll, no overlapping controls.

---

## Phase 2 — Conversion & trust (1–2 sessions)

Things that turn visitors into paying users.

1. **Landing page honesty pass**
   - Every claim on landing → verify feature actually works. Remove or defer any that don't.
   - Add real product screenshots (not stock/generated) in hero + feature sections.
   - Testimonials: only real ones. Empty state beats fake.

2. **Pricing page clarity**
   - Single source of truth for prices (constants file). No more `$19` vs `$24` mismatches.
   - Feature matrix: what's in Free / Pro / Agency / Founding, unambiguously.

3. **First-run experience**
   - New user lands in dashboard → what happens in first 60s? Right now: cluttered. Fix: single "Try your first repurpose" CTA, then unlock the rest.
   - Sample content preloaded so free tier feels valuable in 30 seconds.

4. **Upgrade prompts**
   - Trigger paywall at moment of value (right after 3rd free repurpose, not on page load).
   - `UpgradeNudgeModal` copy pass — benefits, not features.

5. **Empty states**
   - Every list view (jobs, gallery, calendar, approvals) needs a real empty state with a next-action button, not a bare "No data".

---

## Phase 3 — Polish & perceived quality (1 session)

1. **Loading states everywhere**
   - No blank screens. Skeletons on every data-driven route.

2. **Toast + error copy sweep**
   - Standard tone, actionable next step, never raw provider error strings.

3. **Micro-interactions**
   - Hover, focus, active states audited. Keyboard nav works.

4. **SEO fundamentals**
   - Per-route title/description, og:image, JSON-LD where applicable.
   - Blog seed indexed and linked from landing.

5. **Performance**
   - Lazy-load FFmpeg/ElevenLabs/Deepgram code (already partly done — verify).
   - Route-level code splitting audit.

---

## Phase 4 — Growth foundations (optional, after 1–3 are done)

Only meaningful once the product is solid.

1. Referral flow end-to-end test + share kit polish
2. Public Gallery: real examples, share to socials
3. LTD landing page conversion
4. Analytics: which pages convert, where users drop off (PostHog / Plausible via connector)
5. Email drip copy pass

---

## What I need from you

1. **Approve this plan** so I can start Phase 0 (the audit).
2. **Confirm no new features** until Phases 1–3 are done. If you agree, I'll refuse feature requests and redirect them to the audit backlog.
3. **Pick a target launch date** (2–3 weeks realistic for Phases 0–3). Everything gets prioritized against it.

Once approved, I start Phase 0 immediately and deliver `.lovable/audit.md` in the next turn. No code changes until you see the findings and pick what to fix first.
