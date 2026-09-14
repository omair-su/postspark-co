# Publishing delivery, new image models, pack review feed

Four connected pieces of work. Nothing existing is removed; all database work is additive.

## 1. Scheduled packs actually go live (X, LinkedIn, Instagram, email)

Today only LinkedIn has a background worker, and scheduling a pack drops every image except
the first. Result: scheduled X/Instagram/email posts sit in the calendar forever.

- Scheduling now saves **all** attached visuals with each post, not just one.
- One background worker handles every platform: X (with images, auto-threading long text),
  LinkedIn (existing path kept), Instagram (image required, carousel when several images),
  and email (sent through the existing email system to the account's address).
- Each post records: published / failed, the live post link, and a readable failure reason
  shown in the Publishing Center and Calendar.
- Posts that fail retry a couple of times, then stop and show why (e.g. "Instagram not connected").
- The worker runs every 5 minutes; existing LinkedIn schedule is replaced by the unified one.

## 2. Ideogram, Flux Ultra and Imagen in Image Studio

- Three new model choices appear next to Flux Pro, GPT Image and Gemini, each with its own
  description, best-for line, price and accent colour.
- Each one really calls its own provider model - no silent fallback to a different engine.
  If a model is unavailable the tile says so instead of quietly returning another model's image.
- Credit weight per render: Gemini 1, Flux Pro / GPT / Ideogram 1, Imagen 2, Flux Ultra 2.
  The weight is charged when the render starts and refunded if it fails or is cancelled.
- The saved recipe stores the real model that produced the image, so re-running a library
  item reproduces it on the same engine.
- Library model filter gains the three new entries.

## 3. Repurpose Studio review feed

- A feed of recent packs with cover visual, source title, format badges, piece count and
  status (draft / awaiting approval / approved / published).
- Selecting a pack shows the live preview in the right pane exactly as the studio renders it,
  read-only, so a teammate can scroll every post with its image.
- Approve / request changes per pack, reusing the existing approval-link system; approving
  unlocks the "Send to Publishing Center" action.
- No new generation logic; it reads existing packs.

## 4. End-to-end proof

Generate a real pack with images, hand it to Publishing Center, schedule it, run the worker,
and confirm each post lands on its platform with its own visual attached. Results reported
per post.

## Technical notes

- `scheduled_posts`: additive columns only where missing (`media_urls`, `publish_error`,
  `attempts`, `platform_post_id`, `platform_post_url`). No column is dropped or retyped.
- New route `src/routes/api/public/hooks/publish-scheduled.ts` (service-role gated),
  reusing `xPublish.server.ts`, `linkedinPublish.server.ts`, `instagram.server.ts`
  and `email/render-and-enqueue.server.ts`; the LinkedIn-only hook stays as a thin alias.
- `createScheduledPost` gains `media_urls`; `PackQueue.scheduleAll` sends the full list.
- `src/lib/imageModels.ts` becomes the model registry (id, label, provider path, credit
  weight, accent); `image.server.ts` routes `ideogram` / `flux-ultra` / `imagen` through
  the existing Replicate runner with no cross-model fallback; `imageQuota.server.ts`
  reserves `units` from the registry weight.
- New `src/components/repurpose/PackReviewFeed.tsx` plus a read-only preview mode on the
  existing preview components; approvals via `approvals.functions.ts`.
- Verification: `bunx tsgo --noEmit`, build log, then a Playwright pass on Image Studio,
  Repurpose Studio and Publishing Center.

## Risks

- Instagram and email require a connected account / verified address; posts without one
  will report a clear "not connected" failure rather than publishing.
- Flux Ultra and Imagen cost more per render, hence the 2-credit weight.
- The unified worker replaces the LinkedIn cron entry; if it were mis-deployed, scheduled
  LinkedIn posts would pause until fixed, so the old hook is kept working.
