# PostSpark Full Re-Audit and Flawless-Product Plan

Goal: one pass across all 130 pages, every tool and publishing flow, fixing what is
actually broken and raising the whole app to a consistent premium, branded feel.

## What the audit already confirmed (verified today)

- The app builds cleanly right now; no runtime or console errors were captured in the
  latest preview session.
- 9 server-side feature modules still have no failure handling, so a network or
  database hiccup shows the user a crash instead of a message: blog, brand kit,
  brand voice, Canva, Humanizer, Instagram, media, swipe file, WhatsApp.
- 35 files still hardcode light colours (white cards, fixed navy text), which is why
  some dashboard pages look off-brand in dark mode. A global override layer in the
  stylesheet is patching over it.
- Pricing is now driven by one shared source; remaining "$19" mentions are correct
  annual-billing context. No action needed beyond spot checks.
- Live publishing to X, LinkedIn and Instagram and live image-engine identity remain
  unverified because they need connected accounts and the image provider was
  rate-limiting.

## Phase 1 — Stop the crashes (highest value)

1. Add consistent failure handling to the 9 remaining feature modules so every
   failure returns a readable message instead of breaking the screen.
2. Add a shared error boundary fallback on the dashboard shell so one bad page can
   never white-screen the app.
3. Replay each affected page after the change and confirm a clean build.

## Phase 2 — Real audit sweep, page by page

Walk every group in the browser at desktop and mobile width, recording concrete
defects (not guesses) per page:

- Opening/landing, pricing, gallery, blog, use-case, tool and comparison pages.
- Auth: sign up, log in, Google, password reset, onboarding.
- Dashboard home, history, analytics, calendar, billing, settings, team.
- Tools: Repurpose, Image Studio, Humanizer, Carousel, Hook Lab, SEO Blog, Shorts
  Studio/Editor/Series, Thumbnail, Podcast, Reply Generator, Stock Gallery, Import.
- Publishing: Publishing Center, X, LinkedIn, Instagram, Facebook, Threads,
  WhatsApp, scheduled queue, approvals.

Output: a ranked defect list in the audit notes, then fix in severity order —
broken actions first, then confusing flows, then visual polish.

## Phase 3 — Brand and premium consistency

1. Convert the 35 light-leaking files to the shared design tokens, one area per
   pass (dashboard shell, tools, marketing), then remove the stylesheet override
   layer once nothing depends on it.
2. Unify page shells: same header rhythm, same card style, same empty states with a
   clear next action, same loading placeholders.
3. Motion and focus polish: consistent CSS-only transitions, keyboard focus rings
   everywhere, reduced-motion respected.
4. Mobile pass at 375px on the money pages: landing, pricing, dashboard home,
   Repurpose, Image Studio, Publishing Center.

## Phase 4 — Trust and conversion

1. First-run experience: one obvious first action on the dashboard, sample content
   so a new user sees value in under a minute.
2. Upgrade moments only at real value moments; benefit-led copy.
3. Verify money end to end once: checkout, plan sync, paid feature unlock.
4. Verify one real scheduled post per platform with its image, once accounts are
   connected.

## Phase 5 — Differentiation (what makes it feel a class above)

1. Multi-engine orchestration surfaced honestly: show which engine produced what,
   with a one-click re-run on another engine.
2. Conversational editing on generated posts and images (refine by chatting instead
   of re-prompting).
3. Brand memory applied everywhere: brand kit and brand voice automatically shaping
   every tool, visibly indicated in the UI.

## Technical notes

- Failure handling pattern: wrap each `.handler()` body and return
  `{ data: null, error: message }`; the UI already expects that shape elsewhere.
- Colour cleanup replaces hardcoded values with `bg-card`, `text-foreground`,
  `text-muted-foreground`, `border-border`; the `.ds-canvas` override block in
  `src/styles.css` is deleted only after the dependent routes are clean.
- Auditing uses the local preview with scripted browsing plus screenshots; findings
  are written to `.lovable/audit.md` and worked in severity order.
- Each phase ends with typecheck and build; no schema changes are planned, and any
  that become necessary are explained before they are applied.

## Sequencing

Phase 1 and the Phase 2 sweep of the publishing and core tool pages come first,
since those carry the revenue. Phases 3 to 5 follow in order, each in its own pass
so nothing regresses.
