
# Visual Suite v2 — Canva-class Carousel, Thumbnail & Image Studio

## Goal
Turn the three visual tools into a premium, "no manual touch-up needed" workflow:
- **Carousel Generator** → real templated slide library + per-slide AI imagery + drag editor
- **Thumbnail / Cover** → fully-finished thumbnails out of GPT Image 2 (no canvas patching required)
- **Image Studio** → polished 3-model studio with verified Flux / GPT Image 2 / Gemini paths

Plus a one-time health check of all three models (`flux`, `gpt`, `gemini`) and fixes for anything not active.

---

## Phase 0 — Model connectivity audit (do first)

Add `src/lib/imageModelHealth.functions.ts` exposing `pingImageModels()` (admin-only serverFn) that runs a tiny 256×256 prompt against each provider:

| Model | Path | Secret checked |
|---|---|---|
| flux | Replicate `black-forest-labs/flux-1.1-pro` | `REPLICATE_API_TOKEN` |
| gpt  | OpenAI `gpt-image-2` (fallback `gpt-image-1`) | `Openai_api` / `OPENAI_API_KEY` |
| gemini | Lovable AI Gateway `google/gemini-2.5-flash-image` | `LOVABLE_API_KEY` |

Surface results on a small `/dashboard/image-studio` "Model status" strip (green/red dot + last-tested timestamp) and toast the user if any model is down. Fix whatever is red:
- If `Openai_api` missing → request via secrets tool.
- If `REPLICATE_API_TOKEN` missing → request via secrets tool.
- Confirm `gpt-image-2` is the live model (currently `server/image.server.ts` tries `gpt-image-2` first, then falls back to `gpt-image-1` — keep that order).

---

## Phase 1 — Carousel Generator → Canva-class

Current state: Claude writes copy, slides render as a canvas template (no per-slide AI image). We will keep canvas templates but layer in real design power.

### 1a. Template library (`src/lib/carouselTemplates.ts`)
12 hand-designed slide templates × 4 themes (Brand / Minimal / Bold / Neon) = visual variety without AI rolls:
- Cover: Big Quote, Number Hook ("7 mistakes…"), Split-Photo
- Content: Stat Card, Step Card, Comparison (vs.), Checklist, Pull-Quote, Icon Grid
- CTA: Follow Card, Save-this Card, Resource Link

Each template = `(slide, theme, brandKit, ctx) => void` canvas painter. Selectable per-slide via a template picker dropdown on each slide thumbnail.

### 1b. Per-slide AI image option
Toggle "Add AI background" on any slide → calls `generateImage` with `model: "gpt"` (text legible) or `model: "flux"` (photo bg), aspect `square`, persisted into history. Image becomes the slide background with auto dark-overlay for legibility.

### 1c. Drag-reorder + inline edit
Replace current Move ←/→ buttons with `@dnd-kit/sortable` drag handles on the slide strip. Inline-edit title & body directly in the preview (already partially there — finish it).

### 1d. Brand kit auto-apply
When `brand_kit` exists, auto-set theme=brand, primary/accent colors, logo watermark, and handle. Already partially wired — extend to logo image rendered top-right of every slide.

### 1e. Export upgrades
- ZIP of PNGs (already done)
- Single PDF (already done) — add cover thumbnail page
- New: **MP4 reel** export (Phase 2 stretch — skip unless requested)
- New: copy "Instagram alt-text" auto-generated per slide

### 1f. Caption / hashtag UX
Already has 5/8/15/30 selector — add per-platform hashtag pools (Instagram = lifestyle-heavy, LinkedIn = professional, X = trending) by passing `platform` to Claude prompt.

---

## Phase 2 — Thumbnail & Cover → "no editing needed"

The user's pain: GPT Image 2 isn't reliably producing complete finished thumbnails. Fix:

### 2a. GPT-Image-2 prompt rewrite
Rewrite `dashboard.thumbnail.tsx` `generateBackground()` when `model === "gpt"` to use a structured "finished thumbnail" mega-prompt template that includes:
- Exact headline + subhead in quotes
- Layout instructions (text position, color, font weight, outline)
- Style anchor (MrBeast / Ali Abdaal / minimalist / cinematic — user-selectable)
- Negative prompts (no watermark, no logos, no extra text, no borders)
- "Render as final 16:9 YouTube thumbnail, ready to upload"

Add a **Style preset row** (MrBeast Bold / Cinematic / Editorial / Tech / Faceless / Podcast) — each is a curated mega-prompt.

### 2b. "Pure GPT mode" toggle
When ON: skip canvas text overlay entirely — GPT Image 2 output is the final asset. When OFF: keep current canvas-overlay path (Flux/Gemini backgrounds + crisp client-side text). Default ON when model=gpt.

### 2c. Face / subject upload (Pro)
Optional uploader: user uploads selfie → server passes as image input to GPT Image 2 edit endpoint with prompt "use this person as the subject of the thumbnail." Requires switching that single call to OpenAI images-edits API. Behind Pro gate.

### 2d. Variations
"Generate 4 variations" button — calls `generateImageVariations` with model=gpt and slightly varied style anchors, shows 2×2 grid, user picks one.

### 2e. A/B headline tester
Toggle: generate two thumbnails with slightly different headlines side-by-side for testing.

### 2f. Templates / starter library
Curated grid of 24 example prompts ("How I made $10k", "I tried X for 30 days", podcast cover patterns…) — click to autofill headline + style + prompt.

### 2g. Smart defaults per preset
YouTube → MrBeast style + bold yellow accent. LinkedIn banner → editorial gradient. Podcast → centered headshot composition. Already partial — flesh out.

---

## Phase 3 — Image Studio refinements

Current studio already has tabs + 3 models. Adds:

### 3a. Model health badge (from Phase 0)
Green/red dot beside each model card in the picker.

### 3b. Reference image input
On Generate tab: optional "use this image as reference" uploader. When set + model=gpt or gemini, send as multimodal input (edit-style). Flux ignores (gracefully shows "use Edit tab for Flux").

### 3c. Style consistency mode
"Use same seed/style across this session" toggle — pass a stable style descriptor (saved in state) to every generation so a batch looks cohesive.

### 3d. Template-driven flow
The Templates tab already exists — wire each template's `aspect` & `promptStarter` to also auto-pick the right model (Quote/Thumbnail/Carousel → gpt; Product Mockup/Blog Cover → flux; default → flux).

### 3e. Per-image enhance/regenerate
On generated image: "Regenerate" (same prompt), "Enhance prompt & retry" (use enhancer), "Edit this" (jumps to Edit tab with image loaded).

### 3f. Quality of life
- Show currently-selected model name above output
- Show prompt + enhanced prompt as collapsible chip under result
- Copy-prompt button
- Save to brand kit (set as logo / background asset)

---

## Phase 4 — Shared infra

### 4a. New file: `src/lib/imageModelHealth.functions.ts`
`pingImageModels()` serverFn → `{ flux, gpt, gemini } : { ok, latencyMs, error? }`.

### 4b. New file: `src/lib/carouselTemplates.ts`
Canvas painters keyed by template id + theme.

### 4c. Update `src/server/image.server.ts`
- New `generateFinishedThumbnail(headline, subhead, style, aspect)` helper using the mega-prompt template (Phase 2a).
- Add `seed` plumbing to `generateFromPrompt` (Phase 3c).
- Extend `generateCarouselSet` to accept `templateId` for canvas-only renders that skip AI image gen.

### 4d. Update `src/lib/image.functions.ts`
- New serverFn `generateThumbnail(...)` wrapping the mega-prompt helper, persisted under `tool: "thumbnail"` (already correct).
- New serverFn `pingImageModels()`.

### 4e. UI components (new)
- `src/components/image/ModelHealthBadge.tsx`
- `src/components/image/ThumbnailStylePresets.tsx`
- `src/components/carousel/TemplatePicker.tsx`
- `src/components/carousel/SortableSlideStrip.tsx` (uses `@dnd-kit/sortable`)
- `src/components/carousel/SlideTemplateRenderer.tsx`

### 4f. Dependency
Add `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, SSR-safe).

---

## Phase 5 — QA pass

1. Smoke-test all 3 models from `/dashboard/image-studio` model-status strip.
2. Generate carousel with each theme + 4 different templates; verify drag reorder + brand-kit auto-apply.
3. Generate YouTube thumbnail with MrBeast preset + gpt-image-2 in Pure GPT Mode; confirm headline renders cleanly in image (no canvas overlay).
4. Verify limit enforcement still fires for free users.
5. Verify watermark toggle persists across all three tools (already shared via `getWatermarkState`).
6. Verify history page logs each generation with model + prompt + thumbnail.

---

## Out of scope (intentionally deferred)
- MP4 reel export
- Animated/Lottie carousels
- Real-time collaborative editing
- Stock photo library (Unsplash integration)

Tell me if you want any of these pulled into Phase 2.

---

## Confirmations needed before build
1. **OK to add `@dnd-kit/core` + `@dnd-kit/sortable`?** (≈15kb gzipped, SSR-safe)
2. **OK to make face-upload thumbnail (Phase 2c) Pro-only?**
3. **Is `Openai_api` secret already populated?** If not, I'll request it before Phase 0.
