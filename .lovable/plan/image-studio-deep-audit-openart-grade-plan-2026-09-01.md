# Image Studio — Deep Audit + OpenArt-Grade Plan

Audit of `/dashboard/image-studio` as it stands today (route file is 2,113 lines, plus `StudioUI.tsx`, `StudioPro.tsx`, `image.server.ts`, `api/studio-stream.ts`). Below is what is actually broken, what is fake, and what to build next.

## Part 1 — Real bugs found (verified in code)

### Critical

1. **Outdated AI model IDs — silent failures.** `src/lib/image.server.ts` still requests `google/gemini-2.5-flash-image` and `google/gemini-3.1-flash-image-preview` for images, and `google/gemini-2.5-flash` / `gemini-2.5-flash-lite` for text. None of these exist in the current gateway catalog, so prompt enhancement, image captions, carousel copy and the Gemini image path fail (400) and fall through to generic "failed" toasts. This is the most likely cause of the "AI prompt viewing" problem.
2. **Model picker is a lie for single renders.** `api/studio-stream.ts` hardcodes `google/gemini-3-pro-image` and ignores `model`, `quality`, `negativePrompt`, `seed`, and reference image. Pick "Flux Pro" or "GPT Image 2" with batch = 1 and you still get Gemini. Batch ≥ 2 goes down a totally different code path (`generateImageVariations`), so quality/looks change between 1 and 4 images.
3. **Regenerate is dead on repeat.** `cacheRef` keys on prompt + settings and returns the *same* image with "Loaded from this session's cache". Pressing Generate twice never produces a new image — the single most confusing bug for users, since the whole point is iteration.
4. **Results are base64 data URLs.** The streamed final frame is kept in React state as a multi-MB data URL while the server separately persists a real storage URL. Consequences: heavy re-renders and jank, lightbox/download weirdness, and library entries that don't match what is on screen.
5. **Aspect crop bug in previews.** Tiles use `object-cover` plus `aspectClass` derived from the *current composer state*, not from the recipe that produced the image. Change aspect after generating and existing tiles get cropped/stretched.

### High

6. **Seed control is placebo.** "Seed lock" just appends the text `consistency seed 12345` to the prompt. No provider seed is passed, nothing is stored, so remix/reproduce cannot work.
7. **Watermark, logo lock and export pack can silently no-op.** All go through `canvas.toDataURL()` on cross-origin images; a tainted canvas is swallowed and returns the original image, so users think the feature "turned itself off" again.
8. **Duplicate generation paths.** `handleGenerate`, `handleVariations` and `handleBatch` coexist with overlapping logic and different error handling; three places to fix every bug.
9. **Error UX is a bare toast.** Quota, billing, moderation blocks and upstream timeouts all surface as "Generation failed" with no retry, no explanation, no upgrade path (except `LIMIT_REACHED`).
10. **No batch streaming.** Batch ≥ 2 shows generic skeletons with no per-tile progress; long waits look frozen.
11. **Reference/img2img ignores aspect** (routes through the edit endpoint) and reference images live in `localStorage`, which blows the quota on any real photo.
12. **Recipes aren't replayable.** `generated_images` stores no `model`, `seed`, `negative_prompt` or `reference_url`, so the library's "reuse recipe" is partial guesswork.

### Medium

13. Style picker is emoji labels, not visual thumbnails; aspect picker is text, not proportional shapes.
14. Library has no infinite scroll/pagination, favorites live only in `localStorage` (lost across devices), and there is no per-image metadata panel worth the name.
15. Inpaint uses a magenta-overlay prompt hack instead of a real mask on the edits endpoint.
16. Long prompts are clipped in the inspector with no expand; no token/length counter; no prompt history persistence beyond the session.

## Part 2 — Fix plan (ordered)

### Phase A — Stop the bleeding (correctness)

- Refresh every model ID to the current catalog: images → `google/gemini-3-pro-image` (default), `google/gemini-3.1-flash-image` (fast); text/enhance/caption → the current default chat model. Centralize them in one module so this can never drift again.
- Make `api/studio-stream.ts` honour `model`, `quality`, `negativePrompt`, `aspect`, `seed` and reference input; route OpenAI/Flux selections to their own providers instead of forcing Gemini.
- Replace the "same settings = cached image" behaviour: cache becomes explicit history ("you already rendered this — view or re-roll"), and Generate always renders fresh.
- Persist streamed results server-side and return the **storage URL** to the client; state never holds data URLs.
- Store the recipe with the image (`model`, `seed`, `negative_prompt`, `reference_url` added to `generated_images` as nullable columns, additive migration, existing RLS/grants pattern preserved).
- Fix aspect handling: each tile carries its own aspect and renders `object-contain` inside a matched frame; no cropping of a user's render.
- Collapse `handleGenerate` / `handleVariations` / `handleBatch` into one render pipeline.

### Phase B — Reliability + honest UX

- Real seed support: pass seed to providers that accept it, show it on every tile, allow lock / copy / re-roll / remix.
- Fix canvas-based features (watermark, brand logo, export pack) by compositing from same-origin bytes fetched through the app instead of a tainted canvas; surface a real error when it can't run.
- Structured error states in the canvas area (quota, billing, moderation, timeout) with retry, "try another model", and upgrade CTA — never a bare toast.
- Per-tile streaming for batches: each tile streams its own blur-to-sharp preview with progress and its own cancel.
- Move favorites and reference images to the database (per-user), not `localStorage`.

### Phase C — OpenArt-level features

- **Visual style library**: thumbnail cards per style (generated project assets), scroll-snap row, hover preview.
- **Prompt Lab**: subject / lighting / camera / mood chips, negative chips, live token counter, "Surprise me", persistent prompt history, and a prompt inspector that shows the exact final string sent to the model (fixes the "can't see the AI prompt" complaint).
- **Real inpaint + outpaint**: brush mask sent as a proper mask to the edits endpoint; outpaint to any aspect.
- **Character/product consistency**: save a reference subject and reuse it across renders with strength control.
- **Batch board upgrades**: 1/2/4/8 with per-tile upscale, variations, remix, edit, inpaint, download, save, copy recipe.
- **Platform export pack + brand lock**, surfaced as one-click "export for X / LinkedIn / IG / Story / YouTube".
- **Library 2.0**: search, filter by model/style/date, favorites, multi-select, bulk ZIP, recipe drawer with one-click re-run, "use as reference".
- **Caption pairing** straight into Publishing Center / Calendar.

### Phase D — Premium visual layer

- Three-pane studio shell (Composer / Canvas / Inspector) matching the landing-grade design language, stacking to tabs on mobile.
- Per-model accent auras, gradient progress rail, staggered tile pop-in, shimmer skeletons, reduced-motion respected.
- Animated inspiration wall as the empty state; proportional aspect buttons with live pixel labels.
- All styling through existing semantic tokens and additive `lux-*` / `is-*` utilities — no hardcoded colors, no redesign of unrelated pages.

## Technical notes

- Files touched: `src/lib/image.server.ts`, `src/routes/api/studio-stream.ts`, `src/lib/image.functions.ts`, `src/lib/imageQuota.server.ts`, `src/routes/dashboard.image-studio.tsx` (thinned to composition), `src/components/image/studio/*` (plus new `PromptLab`, `StylePicker` thumbnails, `RecipeDrawer`, `InpaintCanvas`), `src/lib/studioCanvas.ts`, `src/lib/streamImage.ts`.
- One additive migration on `generated_images` (nullable columns) + a small `studio_references` / favorites table; GRANTs and RLS follow the existing per-user pattern. No destructive schema change, no data migration.
- Quota logic stays in `imageQuota.server.ts`; only completed renders count, cancels stay free.
- Risks: provider behaviour differences per model (mitigated by a health/fallback badge already present), and the data-URL → storage-URL switch touching save/export paths (covered by keeping the existing save path as fallback during the change).

## Suggested execution order

1. Phase A only — this alone fixes the model failures, the "same image again" bug, cropping, and the fake model picker.
2. Phase B.
3. Phase C features, largest-value first (style thumbnails, Prompt Lab, real inpaint, library 2.0).
4. Phase D visual layer.
