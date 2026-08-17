# Carousel Studio — complete rebuild

Goal: turn the Carousel Generator into the most advanced tool in PostSpark — AI writes deep, premium slide copy, AI/stock art builds real backgrounds, the render is a true 1080×1350 / 1080×1080 design system, and Canva becomes an optional "polish it further" step at the bottom, not the headline. Then publish straight to LinkedIn, Instagram, Threads and X.

## What's actually wrong today (verified in code)

- `src/routes/dashboard.carousel.tsx` renders each slide as a 420px square with the text block absolutely centered (`top-1/2 -translate-y-1/2`). Long bodies overflow that fixed box, so titles collide with the brand header, the page counter and the CTA strip — exactly the overlap and clipped text in the screenshots and screen recordings.
- Only 4 themes, all flat solid fills (`brand` uses the brand-kit primary, which is why every export looks like one flat orange card). No gradients, textures, imagery, or typography choices.
- PDF export doesn't use the preview at all — it redraws slides by hand in jsPDF with Helvetica, so the PDF looks different from (and worse than) the preview, with mispositioned counters and missing text.
- PNG export is `html2canvas` at scale 3 on a 420px node → ~1260px square. Not real 1080×1350, and never LinkedIn's document aspect.
- Copy depth is capped in `src/lib/carousel.server.ts` (title ≤60 chars, body ≤220 chars, no depth rules) → thin, generic slides.
- `CanvaDesignLauncher` sits directly under the hero, so Canva reads as the tool's primary function, and it only creates a *blank* Canva design — none of the generated slides go over.
- The floating Spark orb overlaps the preview card on mobile.
- No stock/AI imagery, no publish handoff, no saved projects.

## The rebuild

### 1. A real design engine (the biggest quality jump)

New `src/lib/carouselDesign.ts` — a token-driven design system instead of 4 flat colors:

- **Canvas presets**: LinkedIn 1080×1350 (4:5), Instagram 1080×1080, IG Story 1080×1920, X 1600×900. The preview renders at a scaled-down size but exports at exact pixel dimensions (fixed-size render node + CSS transform), so a PNG is genuinely 1080×1350.
- **10 premium templates**, each a full recipe (background, overlay, type scale, accent shapes, alignment): Editorial, Noir Luxe, Aurora Gradient, Glass Card, Bold Brutalist, Soft Serif, Split Frame, Photo Overlay, Data Card, Neon Grid.
- **Backgrounds**: brand gradient / mesh gradient / duotone photo / AI-generated art / solid — with automatic dark scrim + WCAG contrast check so text is never unreadable (reuse `src/lib/contrast.ts`).
- **Typography pairs** from `src/lib/googleFonts.ts` (e.g. Instrument Serif + Inter, Sora + Manrope, Archivo Black + Hind), each with its own type scale.
- **Auto-fit text**: measure and step down font size / line-height per slide until the title+body fit their zone. This alone kills the overlap and clipping bugs.
- Layout uses a real grid (safe margins, header band, content zone, footer band) — no more absolute centering over the chrome.

### 2. Deeper AI copy (Claude Sonnet)

Rewrite `src/lib/carousel.server.ts`:

- Depth rules modeled on the repurpose rebuild: titles up to 80 chars, bodies 180–420 chars with a concrete detail, number, or example per slide; explicit anti-compression instruction and scaled `maxTokens`.
- New structure fields per slide: `kind` (cover / hook / insight / example / list / quote / stat / cta), `label` (eyebrow), `bullets[]`, and `imagePrompt` for the art layer.
- **Frameworks** the user picks: Listicle, Myth vs Truth, Before/After, Step-by-Step, Case Study, Contrarian Take, Data Story.
- Brand Voice + active Brand Kit are already resolved server-side — feed both into the prompt so slides sound like the user.
- Per-slide **Rewrite / Shorten / Punch up the hook / Make it concrete** actions, plus regenerate-single-slide.

### 3. Art layer with the models already wired

- **AI backgrounds** per slide or per deck via `src/lib/image.server.ts` (GPT Image 2, Flux Pro, Gemini) using each slide's `imagePrompt`, kept abstract/textural so text stays legible.
- **Stock backgrounds** through the existing `searchStockPhotos` (Pexels + Unsplash) with the existing attribution component.
- **Cutout subject** support on cover slides via the existing background-removal function.
- Quota-tracked through `src/lib/imageQuota.server.ts` like Image Studio; each image generation counts once.

### 4. Export that matches the preview

- PNG/JPG per slide and ZIP of all slides at exact preset pixels.
- **PDF built from the rendered slide images** (jsPDF `addImage`), so the LinkedIn document post looks identical to the preview — replaces the hand-drawn jsPDF path.
- Watermark applied consistently across PNG, ZIP and PDF.

### 5. Canva demoted to an optional finishing step

- Move the Canva panel to the **bottom** of the page, collapsed, titled "Polish in Canva (optional)".
- Make the handoff real: upload each rendered slide PNG as a Canva asset (`uploadAsset` already exists), create the design at the chosen preset with those assets, then open the edit URL — so the user resizes, restyles type, swaps templates and adds icons on top of *their PostSpark carousel* instead of a blank page.
- Keep export-back-to-PostSpark (PNG/PDF) as-is.

### 6. Publish + persistence

- **Publish all** hands the deck to the Publishing Center via the existing `PUBLISH_PACK_KEY` pack format: LinkedIn document/image post, Instagram carousel, Threads, X (image thread), with the caption + chosen hashtag count attached.
- Save/load **carousel projects** (slides + design settings + assets) so a deck can be reopened and re-exported; recent decks listed on the page.

### 7. UI shell

- Premium bento layout matching the Thumbnail Studio rebuild: left column = Content (topic, audience, framework, tone, slide count) and Design (preset, template, background, fonts, colors); right column = large sticky preview with filmstrip, per-slide toolbar, and export/publish bar.
- Fix the Spark orb overlap (raise the preview stacking context / offset the orb on mobile).
- Mobile: stacked, full-width preview, thumb-reachable slide navigation.

## Technical notes

- Files touched: `src/routes/dashboard.carousel.tsx` (rebuild), `src/lib/carousel.server.ts` + `src/lib/carousel.functions.ts` (deeper generation, per-slide ops, project save/load), new `src/lib/carouselDesign.ts` (presets/templates/tokens), new `src/components/carousel/` components (`SlideCanvas`, `SlideFilmstrip`, `DesignPanel`, `ArtPanel`, `ExportBar`), reuse of `image.server.ts`, `stockMedia.functions.ts`, `imageQuota.server.ts`, `canva.functions.ts`, `pieces.ts`.
- One new table for saved carousel projects (JSONB slides + design config) with RLS scoped to `auth.uid()` and the required GRANTs; reuses the existing storage bucket for rendered slide images.
- Gating: free tier keeps text carousels within the existing monthly limit; AI backgrounds, premium templates, brand fonts and Canva handoff are Pro/Agency, surfaced through the existing `LimitReachedModal` / `PaywallPrompt`.
- Generation limits stay in `repurposeLimits.server.ts` and only count successful decks.

## Suggested build order

1. Design engine + rebuilt preview/export (fixes the visible bugs and the "cheap" look).
2. Deeper Claude generation + per-slide AI actions.
3. Art layer (AI + stock backgrounds, cutouts, quota).
4. Canva move/handoff, publish pack, saved projects.
