# Image Studio — World-Class Rebuild (OpenArt / Midjourney / Ideogram grade)

Goal: turn `/dashboard/image-studio` from a functional form into a premium creative canvas that looks like the new landing/pricing pages and behaves like a top-tier AI image product.

## What top competitors have that we don't

Researched pattern set from OpenArt, Midjourney web, Ideogram, Leonardo, Playground:

| Capability | Us today | Competitors |
|---|---|---|
| Live streaming previews while rendering | No (spinner only) | Yes, progressive blur-to-sharp |
| Prompt editor with weights, negative chips, tokens | Plain textarea | Structured prompt builder |
| Style library with visual thumbnails | Text labels only | Visual style cards |
| Reference image / img2img strength | Edit only | Reference + strength slider |
| Batch grid (2/4/8) with per-tile actions | Variations only | Full batch board |
| Inpainting / brush mask | No | Yes |
| Upscale + face fix + expand canvas | Upscale only | Full post-pipeline |
| Character / brand consistency | Brand Kit colors | Seed lock + character refs |
| Seed control, remix, "reuse prompt" | No | Yes |
| Community/personal feed with metadata | Flat library | Rich gallery with recipes |

## Phase 1 — Premium visual rebuild (landing-grade)

- Rebuild the page shell on the same design language as the landing/pricing pages: light `#F7F6FF` mesh canvas in light mode, obsidian luxe in dark, Geist display headings, Inter body, gradient text accents, uppercase micro-labels.
- New three-pane studio layout: left **Composer** rail, center **Canvas board**, right **Inspector** (recipe, seed, history). Collapses to stacked tabs on mobile.
- Replace all weak cards: glass cards with 1px gradient borders, soft violet glow on hover/active, rounded 20px, colorful per-model accent auras (Flux teal, GPT emerald, Gemini violet).
- Motion: staggered fade-in-up tiles, shimmer `lux-flow` skeletons per tile, gradient progress rail while generating, tile pop-in scale, reduced-motion respected.
- Empty state becomes an animated inspiration wall of prompt cards instead of a grey box.
- Visual style picker: image-thumbnail style cards (not emoji/text), scroll-snap row with selected ring + label.
- Aspect picker becomes real proportional shape buttons with live px labels.

## Phase 2 — Advanced generation features

1. **Streaming previews** — stream image frames so users watch the render appear (blurred partials → sharp final), with per-tile progress.
2. **Prompt Lab** — structured composer: subject, style, lighting, camera, mood chips; negative-prompt chips; token counter; "Enhance with AI" (exists) plus "Surprise me" and prompt history recall.
3. **Batch board** — choose 1/2/4 images; each tile gets hover actions: upscale, variations, remix, edit, download, save, copy recipe, delete.
4. **Seed & recipe control** — show seed, allow lock/reuse; every image stores its full recipe (prompt, model, style, aspect, seed) and can be one-click re-run or remixed.
5. **Reference image + strength** — upload/pick a reference, choose influence strength for img2img and style transfer.
6. **Inpaint brush** — mask a region on canvas and regenerate only that area.
7. **Post-pipeline** — upscale 2x/4x, background remove (exists), expand/outpaint canvas to another aspect, brand watermark toggle (exists, surfaced better).
8. **Presets & templates** — thumbnail, blog cover, quote card, carousel slide, ad creative, profile banner — each with a live visual preview card.
9. **Library upgrade** — filter by model/style/date, search, favorites, multi-select, bulk ZIP export (exists), "use as reference", per-image recipe drawer.
10. **Quality guardrails** — model health badge (exists) surfaced inline, automatic fallback messaging, clear quota meter with upgrade nudge instead of raw errors.

## Phase 3 — Differentiators worth adding

- **Brand-locked generation**: Brand Kit palette + logo auto-composited, with on/off and placement control.
- **Platform export pack**: one generation → auto-resized set for X, LinkedIn, IG square/story, YouTube thumbnail.
- **Caption pairing**: generated image + AI caption/hashtags, straight into Publishing Center or Calendar.
- **Character consistency**: save a reference "character/product" and reuse it across generations.
- **Prompt marketplace tie-in**: featured community recipes users can fork.

## Rollout order

1. Visual rebuild + layout + style/aspect/model cards (immediate perceived jump).
2. Batch board, tile actions, seed/recipe, library upgrade.
3. Streaming previews.
4. Reference image + strength, inpaint brush, outpaint.
5. Platform export pack, brand lock, caption pairing.

## Technical notes

- New components under `src/components/image/studio/`: `Composer.tsx`, `CanvasBoard.tsx`, `ImageTile.tsx`, `Inspector.tsx`, `StylePicker.tsx`, `AspectPicker.tsx`, `ModelPicker.tsx`, `PromptLab.tsx`, `RecipeDrawer.tsx`, `InpaintCanvas.tsx`. `dashboard.image-studio.tsx` becomes a thin composition (currently 1503 lines).
- Styling only through semantic tokens plus additive `lux-*` / `lp4-*` utilities in `src/styles.css`. No hardcoded color utilities.
- Streaming needs a server route (`src/routes/api/generate-image.ts`) since `createServerFn` cannot stream; existing `generateImage` server fn stays for non-streaming paths and persistence.
- Extend `generated_images` with `seed`, `model`, `negative_prompt`, `reference_url` (nullable, additive migration) so recipes are replayable; keep RLS + grants as-is pattern.
- Inpaint/outpaint route through the existing image edit path in `src/lib/image.server.ts`; add mask support in the server helper.
- Style thumbnails generated as project assets in `src/assets/styles/`.
- Quotas and Pro gating keep using `src/lib/repurposeLimits.server.ts` / existing plan checks — no entitlement changes.
