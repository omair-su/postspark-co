## Plan — Phase C polish & consolidation

Ten changes across Repurpose, Carousel, Thumbnail/Cover, Image Studio, Podcast, and History. Grouped by area below. Each item lists the user-visible outcome + technical touch points.

### 1. Carousel inside Repurpose
- Add **Carousel** as a selectable output type alongside Threads / LinkedIn / etc. on `dashboard.repurpose.tsx`.
- When chosen, the existing repurpose pipeline calls `generateCarousel()` server-side and stores `outputs.carousel`.
- One-click URL / YouTube hero auto-includes Carousel when selected.

### 2. Inline slide editing + per-slide AI rewrite (Carousel page)
- Make title/body editable in `dashboard.carousel.tsx` (contentEditable / textarea on click).
- New server fn `rewriteSlide` in `src/lib/carousel.functions.ts` → Claude call that rewrites a single slide given tone/instruction.
- "✨ Rewrite" button on each slide.

### 3. Carousel themes (Minimal / Bold / Neon, plus current Brand)
- Theme picker above generate button. Each theme = preset `{bg, accent, font, layout}` overriding brand kit when selected.
- Applied in both `SlideCanvas` preview and PDF/PNG export.

### 4. PNG / JPG export per slide
- Use `html2canvas` (already common) on the rendered `SlideCanvas` for each slide, download as PNG. Bulk "Download all PNGs" via JSZip.
- Add `bun add html2canvas jszip` if missing.

### 5. Copy caption / hashtags / "Copy All"
- Three explicit buttons in carousel results panel: Copy caption, Copy hashtags, Copy All (caption + hashtags + all slides text).

### 6. Save thumbnail/cover + image edits to History
- `dashboard.thumbnail.tsx`: after composing canvas, upload PNG to `generated-images` bucket and insert a `repurpose_jobs` row with `tool='thumbnail'`, outputs containing image URL + overlay settings.
- `dashboard.image-studio.tsx`: when bg-remove / upscale completes, persist to `repurpose_jobs` with `tool='image-edit'` (variant: removed-bg / upscaled).
- Update `dashboard.history.tsx` to render `thumbnail` and `image-edit` rows with image preview, download, and copy-URL.

### 7. Download buttons for generated images
- Thumbnail page: explicit "Download PNG" + "Download JPG" buttons after composition.
- Image Studio bg-remove result: "Download transparent PNG" button (already PNG from Replicate; just ensure download attribute + `.png` filename).
- Upscaled output: "Download" button.

### 8. Credit tracking + LIMIT_REACHED for image/audio tools
- Reuse the same `checkPlan` helper pattern from `carousel.functions.ts`.
- Wrap server fns: thumbnail generation, bg-remove, upscale, podcast transcribe→repurpose. Each inserts a `repurpose_jobs` row so the monthly counter ticks.
- Surface `LIMIT_REACHED` toast + upgrade hint in each UI.

### 9. Podcast transcript editor
- After transcription returns, show editable `<textarea>` of the transcript.
- Optional timestamp toggle: ask the transcriber for `with_timestamps`, display lines with `[mm:ss]` prefixes the user can keep or strip.
- "Repurpose this transcript" uses the edited text.

### 10. Save Podcast outputs to History
- Insert `repurpose_jobs` with `tool='podcast'`, `input_text=<transcript>`, `outputs={ transcript, repurpose: {...} }`.
- History row: badge "Podcast", click expands transcript + per-platform outputs, copy buttons.

### Files touched
- edit: `src/routes/dashboard.repurpose.tsx`, `src/routes/dashboard.carousel.tsx`, `src/routes/dashboard.thumbnail.tsx`, `src/routes/dashboard.image-studio.tsx`, `src/routes/dashboard.podcast.tsx`, `src/routes/dashboard.history.tsx`
- edit: `src/lib/carousel.functions.ts`, `src/lib/image.functions.ts`, `src/server/image.server.ts`, `src/server/carousel.server.ts`, `src/server/repurpose.server.ts` (add carousel slot), `src/lib/repurpose.functions.ts`
- new: `src/lib/podcast.functions.ts`, `src/server/podcast.server.ts` (extract from current podcast route logic)
- new deps: `html2canvas`, `jszip`
- DB: no schema changes — reuse `repurpose_jobs.tool` (already added in Phase B).

### Out of scope
- No new tables, no migrations, no payment changes.
- Hashtags export remains text-only (no image).

After approval I'll implement all ten in one pass, batching parallel file edits.