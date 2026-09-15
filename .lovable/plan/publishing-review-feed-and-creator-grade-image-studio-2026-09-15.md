# Publishing, review feed, and creator-grade Image Studio

## Goal

Turn the connected PostSpark workflow into one reliable creator pipeline:

```text
Create or converse → generate images → build a content pack → team review
→ send to Publishing Center → publish now or schedule → verify delivery
```

The supplied Magnific, OpenArt and Grok screenshots are visual references only. PostSpark keeps its own logo, navy/electric-purple identity, typography, navigation and creator-specific workflows.

## What the audit confirmed

- Publishing Center can publish queued packs immediately to X, LinkedIn and Instagram, but pack scheduling currently saves only `media_url`, even though `scheduled_posts.media_urls` already exists.
- Only LinkedIn currently has a scheduled-post worker. The existing X, LinkedIn and Instagram server helpers can be reused by one unified worker.
- Recent Packs already supports list, reopen, duplicate and compare. The existing approvals system can support team review without inventing a second approval system.
- Image Studio currently routes only Flux Pro 1.1, GPT Image 2 and Gemini. Flux can silently fall back to Gemini after a provider failure, so strict model identity must be added before claiming new labels.
- Weighted image reservations are already supported through the existing `units` argument; model weights can use that ledger without replacing quota infrastructure.

## 1. Reliable Publishing Center

- Preserve every visual when a pack enters the queue and when it is scheduled by saving `media_urls` alongside the first `media_url`.
- Add one authenticated background publishing worker for X, LinkedIn, Instagram and email:
  - X: up to four images on the first post, plus native reply chains for long posts.
  - LinkedIn: single image or multi-image post through the existing publishing helper.
  - Instagram: image/carousel publishing; fail clearly when media or connection is missing.
  - Email: deliver the scheduled email content through PostSpark’s existing email queue to the account email.
- Claim due rows atomically so two worker runs cannot double-publish a post.
- Record published/failed state, provider post ID or URL, attempt count and a readable error. Retry only transient failures with a small cap.
- Replace the LinkedIn-only schedule with the unified worker while retaining the old route as a compatibility alias.
- Surface per-row scheduled/published/failed status and attached visual thumbnails in Publishing Center and Calendar.

## 2. Image Studio: Magnific/OpenArt structure + Grok flow

### Experience

- Keep the existing three-pane studio, but refine it using the references:
  - compact creator rail and project context;
  - focused prompt/composer column with visual references, aspect ratio, image count and advanced controls;
  - searchable model drawer/inspector with provider, capability, speed and credit filters;
  - spacious creations canvas with a masonry/grid feed, clear selected image, and persistent actions.
- Add a Grok-style prompt-first entry: large conversational composer, attachments, mode controls and fast submit.
- Add conversational image editing: each selected image has a lightweight edit conversation with version history, prompts such as “make the type larger,” and explicit preservation of unchanged details.
- Use the existing PostSpark mark as the AI identity, never a generic sparkle icon.
- Build the conversation surface from AI Elements primitives and keep assistant responses unboxed; generated images and tool progress appear inline.
- Conversation shape: one conversation attached to each selected image/generation session, stored with that image’s recipe/version history rather than a separate global chat inbox.

### Model truth and credits

Add these visible models to the central registry and route each strictly to its named engine:

- Ideogram — 1 credit; strong typography and social graphics.
- Flux Ultra — 2 credits; premium photorealism and detail.
- Imagen — 2 credits; polished general-purpose imagery.
- Existing Gemini — 1 credit.
- Existing Flux Pro / GPT Image — 1 credit.

For explicit model selections, never fall back to a different engine. A failure stays on that model and shows the provider error. Save the actual model ID, seed, negative prompt, quality, references and credit weight with every generated image so Library reruns use the same recipe.

Add model-specific progress language/aura, model filters in Library, visual references, character/style reference slots, searchable visual templates, and hover actions inspired by the supplied examples while preserving PostSpark styling.

## 3. Repurpose Studio team review feed

- Upgrade Recent Packs into a proper review feed with cover visual, source title, formats, piece count, creator, timestamp and status: Draft, Awaiting approval, Changes requested, Approved, Scheduled or Published.
- Selecting a pack opens the existing platform-accurate live preview in the right pane, including each piece’s own attached visual.
- Add approve and request-changes actions by reusing the current approval request and audit trail.
- Keep reopen, duplicate, compare and evergreen actions.
- “Send to Publishing Center” carries the exact approved pieces and stable media keys. For approval-required workspaces, publishing is disabled until approval; solo users can continue directly.

## 4. End-to-end proof

Run one real authenticated workflow:

1. Generate a full repurpose pack.
2. Generate/attach visuals for its publishable pieces.
3. Review and approve the pack.
4. Send it to Publishing Center.
5. Confirm every queue row shows its own image(s).
6. Publish or schedule X, LinkedIn, Instagram and email.
7. Verify each result independently, including returned post IDs/links and attached visuals.

External posting will only be marked confirmed for currently connected accounts. Missing connections or provider denials will be reported per platform, not hidden behind a generic success.

## Technical approach

- Extend `createScheduledPost` and `PackQueue` to preserve all images and recipe metadata.
- Add a unified `/api/public/hooks/publish-scheduled` route guarded like the existing LinkedIn worker and reuse the existing platform/email server helpers.
- Use an additive migration only for truly missing scheduling/retry fields after checking the live schema; include grants/RLS for any new public table. No production rows are rewritten.
- Make `src/lib/imageModels.ts` the shared UI/server registry for labels, strict provider IDs, capabilities and weights; extend the existing generation input union and durable job path.
- Add the per-image conversation/version records additively, scoped to the authenticated owner/workspace. Keep model calls and prompts server-side.
- Compose the visual changes from focused reusable components instead of expanding the current Image Studio page further.

## Verification

- Typecheck, lint, relevant tests and production build.
- Model smoke tests: Ideogram, Flux Ultra and Imagen must each return metadata naming their own engine; cross-model fallback is a test failure.
- Responsive browser checks on Image Studio, Repurpose Studio, Publishing Center and Calendar.
- Cancellation/refund tests for every weighted model.
- Duplicate-worker test proving a scheduled row publishes once.
- End-to-end pack/media test proving each post keeps its matching visual through review, handoff, scheduling and delivery.

## Risks and boundaries

- New provider models depend on the existing Replicate connection supporting their current model endpoints; unavailable models will be shown as unavailable rather than impersonated by another engine.
- Actual delivery requires connected X, LinkedIn and Instagram accounts. Email uses the signed-in account address unless a future recipient campaign feature is requested.
- The screenshots guide layout and interaction, not copied branding or embedded assets.
