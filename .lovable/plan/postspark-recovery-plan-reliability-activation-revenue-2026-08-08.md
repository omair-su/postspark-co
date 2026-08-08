# PostSpark Recovery Plan — Reliability, Activation, Revenue

## Honest recommendation

Do not quit the product yet, but stop expanding it. PostSpark has enough working infrastructure to recover, and it can reach the visual quality of the references. The current problem is scope and execution order: roughly 50 dashboard routes and 46 server-function modules have grown faster than the core journeys were validated. The next release should be a focused product rescue, not another broad redesign or integration.

The success target is simple: a new user can enter, generate valuable content, see their brand applied, publish it, and understand why upgrading is worth paying for—without encountering a dead button, false success, or prerequisite revealed only after failure.

## Verified current state

- The sender domain is active, auth emails are enabled, and recent signup/reset requests reached the email provider. The latest recovery request was recorded as accepted by the provider, but that status does not prove inbox delivery.
- Seven older emails are dead-lettered and will not retry automatically. The observed historical error is a missing run/idempotency identifier.
- The live `/`, `/signup`, and `/login` routes render without browser errors.
- Signup currently blocks email/password users on confirmation when no session is returned. You chose temporary instant signup.
- Password reset has the required public reset page and recovery-session handling.
- Reels Search currently looks only for an Instagram Business account connected through a Facebook Page. It does not recognize the newer standalone Instagram connection, which explains why an already-connected user can still see “connect Instagram.”
- Repurpose shows a TikTok action even though it never supplies the video required by that action, and it exposes both external publishing links and separate native publishing buttons.
- Billing currently presents only Pro on the main billing page; Agency purchase and upgrade paths are inconsistent.
- Brand Kit persistence is substantial, and Repurpose uses brand name, tagline, preferred tone, and Brand Voice. It does not consistently select the active kit and does not apply the full visual kit across all generation tools.
- Canva create/import/export/version/publish infrastructure exists, but studio copy and placement currently position Canva as a replacement editor rather than a downstream finishing step for PostSpark-generated assets.
- The visual system is fragmented: 81 dashboard/component files contain hardcoded visual colors, while custom premium classes and base design-system components use different interaction and radius rules.

## Phase 0 — Freeze and measurement

- Freeze new tools, integrations, and decorative redesign work until the release gates below pass.
- Define five monitored journeys: signup, password reset, first repurpose, first export/publish, and checkout.
- Add a small admin reliability view for funnel events and actionable failures: request accepted, email dispatched, generation completed, publish completed, checkout opened/completed.
- Replace generic success messages with success only after the final operation has actually succeeded.

**Exit gate:** each journey has an observable start, success, and failure reason.

## Phase 1 — Restore access and email conversion

1. Enable temporary auto-confirm for new email/password signups, as approved. Successful signup must create a real session and enter onboarding immediately.
2. Keep password-reset email enabled; instant signup must not remove reset or account-security email flows.
3. Re-run the managed email infrastructure setup to refresh the queue processor, cron configuration, and backend credential used by the processor.
4. Correct all queued payloads so every email has a stable idempotency identifier before it can be accepted.
5. Add queue health reconciliation: stale pending emails become visible failures, dead-letter counts are surfaced, and provider acceptance is labeled “sent to provider,” not “delivered.”
6. Improve signup/reset UX with resend, change-email, delivery delay/spam guidance, and a support path. Do not display a confirmation-only screen while auto-confirm is enabled.
7. Remove optimistic Google OAuth success/navigation; wait for the public callback to confirm the session.
8. Verify signup, login, sign-out, Google login, reset request, recovery link, and password update against the published domain.

**Exit gate:** five fresh email/password accounts can enter immediately; five reset emails are accepted and their links complete password changes; Google auth completes without false success states.

## Phase 2 — Make one complete activation loop

Build one flagship workflow around Repurpose instead of trying to perfect every tool simultaneously:

```text
Source → Generate formats → Edit/preview → Apply active brand → Export/publish → Saved history
```

- Make the active Brand Kit query deterministic and use the same active profile across Repurpose, image, thumbnail, carousel, and publishing outputs.
- Apply the useful brand fields—not only tone/name/tagline—where the output supports them: logo, colors, fonts, watermark, voice rules, and platform defaults.
- Make per-format failures independent and retryable so one failed format does not strand the rest of a generation pack.
- Replace the current mixed publishing actions with one native PostSpark action surface. Hide TikTok unless a valid video exists; show LinkedIn only for relevant content; route Threads/X/Facebook/Instagram through their real integrations.
- Preserve generated content and edits before navigation or publishing.
- Add an activation checklist based on real completion events, not page visits.

**Exit gate:** ten end-to-end runs from source to saved/published output complete without dead controls or ambiguous status.

## Phase 3 — Repair the highest-value supporting workflows

### Instagram and Reels

- Resolve account capability from both supported connection models: standalone Instagram and Facebook-Page-linked Instagram.
- Show connection/capability status before search, not after a failed query.
- If hashtag discovery genuinely requires the Facebook-linked Business API, say so explicitly and do not treat a standalone connection as disconnected; provide the correct action for the missing capability.
- Share token health and reconnect state across Instagram publishing and Reels Search.

### Brand Kit and Brand Voice

- Add a “Test my brand” acceptance flow that generates one text sample and one visual sample from the active profile.
- Validate saved values by reloading them and showing where each is used.
- Ensure changing the active profile changes subsequent output without silently modifying another profile.
- Treat Brand Kit as complete only when the same active profile affects core generation and exported assets.

### Thumbnail, Carousel, and Canva

- Restore PostSpark as the generator: source/video upload or URL → AI concepts → generated thumbnail/carousel draft.
- Position Canva as “Edit this PostSpark design in Canva,” passing the generated asset/content into the handoff rather than offering Canva as the primary creation replacement.
- Import edits back, show per-page previews, retain version history, and mark a final exported version as published.
- Remove or clearly label the legacy editor if it cannot reliably produce/export assets; do not present two competing creation paths.

### Shorts and video editing

- Narrow Shorts to one dependable workflow: script → scenes/B-roll → captions/voice → preview → export.
- Verify actual trim/cut behavior with real uploaded video and exported duration, not only UI manipulation.
- Keep Instagram discovery optional; it must never block creating or editing a Short.

**Exit gate:** each retained workflow passes a written happy-path test and at least three critical failure cases.

## Phase 4 — Monetization correction

- Make the billing page the single source of truth for Free, Pro, Agency, monthly/annual pricing, trials, and entitlements.
- Add Agency to billing and preserve billing cadence during upgrades unless the user explicitly chooses another cadence.
- Handle checkout exceptions with visible errors; no silent button failures.
- Verify server-side limits and UI entitlements agree for every paid feature.
- Instrument trial start, checkout open, checkout completion, cancellation, and upgrade failure.
- Delay aggressive upsells until the user has produced a useful result; use contextual upgrade prompts tied to a blocked paid capability.

**Exit gate:** sandbox purchase, upgrade, cancellation, renewal state, and entitlement sync all pass for Pro and Agency.

## Phase 5 — Premium visual rebuild, after reliability gates

Use the user’s references as the target: bright, cohesive, image-led, spacious, and product-focused—not another dark gradient/glass pass.

- Unify dashboard navigation, form controls, cards, spacing, elevation, radius, icon treatment, and interaction states under one token/component system.
- Remove hardcoded component colors and duplicated premium/base primitives.
- Use a cohesive light workspace shell with subtle separation rather than the current split dark-sidebar/light-content visual weight.
- Redesign only the validated core surfaces first: onboarding, dashboard, Repurpose, output preview, Brand Kit, publishing, and billing.
- Use real product states and real generated media in heroes and empty states; no decorative mockups that promise unsupported functionality.
- Keep dark mode supported, but do not let it dictate the premium light-mode composition.
- Validate text contrast, overflow, touch targets, loading, empty, error, and success states at 360px, tablet, and desktop widths.

**Exit gate:** screenshot review plus keyboard/mobile accessibility checks pass for every core surface, and no UI claims a capability the workflow cannot complete.

## Phase 6 — Controlled launch and customer learning

- Recruit 10–15 target creators/marketers into a concierge beta instead of broadly marketing all 50 tools.
- Personally observe the first-source-to-publish session and record where users hesitate or leave.
- Market one sharp promise: turn one source into a branded, publish-ready content pack. Do not position PostSpark as a simultaneous replacement for Buffer, CapCut, Canva, Repurpose.io, and every native network.
- Offer founder-assisted onboarding and collect payment intent after the activation loop succeeds.
- Use weekly release decisions based on activation, successful exports/publishes, retention, and paid conversion—not route count.

## Technical implementation order

1. Auth configuration and signup/reset UI.
2. Email infrastructure refresh, payload consistency, and health visibility.
3. Reels account resolver and preflight UI.
4. Repurpose active-kit selection, failure isolation, and unified publishing actions.
5. Billing/Agency corrections and checkout error handling.
6. Canva repositioning and core Thumbnail/Carousel handoff.
7. Shorts workflow verification and repair.
8. Token/component consolidation and core-surface redesign.
9. Published-domain browser tests, database assertions, and a small regression suite for each release gate.

## Scope discipline

- No new social network, AI studio, or editor until Phases 1–4 pass.
- Do not declare a feature complete because a page or button exists.
- Do not redesign an unverified workflow; simplify or remove it first.
- Ship in small milestones, verify on the published domain, then continue.
