## Goal

Push Shorts Studio to a "wow" tier: a real in-browser editor, Series mode that turns 1 source into 5 episodic scripts, and roll the new premium landing template across 4 more high-traffic pages.

## Part 1 — Series Mode (1 source → 5 episodic scripts)

**Server:** add `generateShortsSeries` in `src/server/shorts.server.ts` + wrapper in `src/lib/shorts.functions.ts`. Pro-gated. Single Claude call returns 5 angled scripts with a shared `series_id`, each persisted as its own `repurpose_jobs` row so all 5 show in History.

**UI:** in `dashboard.shorts-studio.tsx`, add "Single / Series (5×)" toggle above Generate. Series result renders as a tabbed view (Ep 1…Ep 5), each tab uses the existing single-script renderer. Free users see "Pro" lock pill.

**DB:** migration adds `series_id uuid` + `series_index int` to `repurpose_jobs`. Grants already in place.

## Part 2 — Lite Multi-Clip Editor (Beta)

New route `src/routes/dashboard.shorts-editor.tsx` + component `src/components/shorts/LiteEditor.tsx`. Pure browser, Worker-safe, zero ffmpeg.

**Capabilities:**
- Drag-drop up to 5 video clips (mp4/webm/mov, ≤50MB each)
- Reorder via up/down buttons
- Per-clip: trim start/end (range slider on a thumbnail strip), mute toggle
- Global: 9:16 crop (auto-letterbox or center-crop), burned-in caption track (typed or pasted SRT), background music (uploaded mp3, volume slider), AI voiceover (reuses `/api/narrate-short`)
- Hard caps: ≤90s total, output 1080×1920

**Render pipeline (all client-side):**
1. Parse clips with `<video>` elements (`crossOrigin` not needed — same-origin blobs)
2. OffscreenCanvas 1080×1920; for each frame at 30fps, `drawImage` current clip cropped to 9:16
3. Burn captions via canvas `fillText` using active caption window
4. Mix audio via WebAudio: clip audio (if !muted) + music + voiceover → MediaStreamDestination
5. Combine canvas `captureStream(30)` + audio destination → `MediaRecorder` → `webm` blob
6. Show progress, download, "Save to History" (upload to `shorts-videos` + `attachShortVideo`)

**Safari/iOS:** detect `MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')`; if false, show "Use Chrome/Edge for export" banner and keep preview-only.

Add "Open Editor →" CTA inside Shorts Studio once a script is generated, prefilling voiceover + SRT.

## Part 3 — 4 more premium landing redesigns

Reuse `PremiumShortsLanding` component with page-specific copy. Each gets unique problems/steps/features/competitors/samples/FAQ + 1 generated 3D hero image.

- `tools.hook-generator.tsx` — "Viral Hook Generator" vs Tweet Hunter / Taplio
- `tools.youtube-to-twitter-thread.tsx` — vs Tweet Hunter / Hypefury
- `use-cases.podcast-to-social.tsx` — vs Castmagic / Capsho
- `use-cases.youtube-to-linkedin.tsx` — vs Repurpose.io / Taplio

Reuse existing `shorts-hero-mockup.jpg` + `yt-to-ig-hero.jpg` where contextually fine; generate 2 new images only where needed (hook-generator, podcast-to-social).

## Sequence

1. DB migration (series_id, series_index)
2. Series server fn + wire UI toggle + tabbed renderer
3. LiteEditor component + new route + entry CTA
4. 4 landing redesigns + 2 new hero images
5. Playwright smoke: generate a series, open editor, render a 6-second 2-clip export, screenshot each new landing on mobile

## Out of scope

- Server-side video transcoding, ffmpeg, native codecs (Worker-incompatible)
- Real TikTok / Instagram publish (still pending app review — UI ready)
- Color/typography changes to existing pages
- Redesigning the remaining 10+ tool/use-case pages (follow-up)
