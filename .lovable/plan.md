
# Shorts Studio: Premium Upgrade

One focused build. Three parts. Same brand colors (navy + electric purple) and Inter font — only the depth, motion, density and feature surface change.

---

## Part 1 — Fix "Generate" doing nothing

Symptom: clicking Generate appears to do nothing. Likely causes from the current code (`generateShorts` → `callClaudeWithTool`):

1. Claude occasionally returns no `tool_use` block on long inputs → server returns `{ script: null, error: "Generation failed" }` and the toast is too brief to notice.
2. Errors thrown inside `withAIProgress` swallow toasts.
3. `LIMIT_REACHED` for free users surfaces only as a transient toast.

Fixes:
- Use `invoke-server-function` + `server-function-logs` to confirm the exact path on the live preview.
- Harden `generateShortsScript`:
  - Truncate source to 8k chars (already done) and add a second retry with a stricter "you MUST call the tool" reminder.
  - Return human-readable error strings instead of "Generation failed".
- In `dashboard.shorts-studio.tsx`:
  - Wrap `run()` in try/catch and always toast the message.
  - Render `LIMIT_REACHED` as an inline upgrade card (not a toast).
  - Add a visible "Generating…" stepper (Reading source → Writing hooks → Building shots → Polishing) so the user sees progress.
  - Log a single console diagnostic on failure.

---

## Part 2 — Premium features inside Shorts Studio

### 2A. AI voiceover (Pro)
- New `narrateShort` server fn → Lovable AI Gateway TTS (`openai/gpt-4o-mini-tts`).
- 6 voice chips (Alloy / Verse / Sage / Coral / Echo / Ash). Free preview = Alloy only.
- Streams PCM → assembles a single `.wav` → uploads to `shorts-videos/<user>/<job>-vo.wav`.
- Stored on `repurpose_jobs.voiceover_path`.

### 2B. Hook virality score + B-roll search
- Extend tool schema: each hook gets `score` 0–100 + `score_reason`. Each shot gets `broll_search_query`.
- Score chip on each hook (green ≥80 / amber 60–79 / red <60) with the reason in a tooltip.
- "Find B-roll" button per shot → calls existing `findBroll` (Pexels). Without `PEXELS_API_KEY`, return curated stub clips so the UI is fully usable today; one-line "Connect Pexels for live results" hint with `add_secret` CTA.

### 2C. Series mode (Pro)
- Toggle "Series mode" → new `generateShortsSeries` server fn splits source into 5 episodic angles with cliffhangers and runs `return_shorts_script` per angle in parallel.
- Inserts 5 `repurpose_jobs` rows sharing a `series_id` in `outputs`.
- Tabbed UI Episode 1–5; each renders the existing script layout.

### 2D. Trending audio picker + AI cover thumbnail
- Curated `src/lib/trendingAudio.ts` (already exists) → chip group filtered by platform + niche, with copy-to-clipboard "Search '<sound>' in <platform>" string.
- "Generate cover" button → existing Replicate image path, prompt assembled from title + style (Bold / Editorial / Meme / Cinematic). Stores in `generated-images` bucket; path → `repurpose_jobs.cover_image_path`. Pro.

### 2E. Lite editor + multi-clip timeline
Pure browser, no ffmpeg, no native deps (Worker-safe):
- New `ShortsEditor` component on the script result page.
- Upload N clips (drag-reorder) → thumbnail strip timeline.
- Per clip: trim handles (in/out), crop-to-9:16 toggle, mute toggle.
- Global tracks: voiceover (from 2A), background music URL (paste a public mp3 or pick a Pexels-audio stub), burned-in captions from the generated SRT.
- Render pipeline: `Canvas` + `OffscreenCanvas` draw each frame (video + captions) and `MediaRecorder` records to `webm`. Export → upload to `shorts-videos` and add to History.
- Import: accept `.mp4` / `.mov` / `.webm`. Export: `.webm` (browser-native).
- Hard caps to stay within memory: ≤ 5 clips, ≤ 90s total, ≤ 1080×1920.
- All editor steps gracefully degrade on Safari (`MediaRecorder` mime detection + fallback message).

### Schema work
- Migration:
  ```
  ALTER TABLE public.repurpose_jobs
    ADD COLUMN IF NOT EXISTS voiceover_path TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_path TEXT,
    ADD COLUMN IF NOT EXISTS series_id UUID;
  ```
- No new tables, no new policies (existing user-scoped policies on `repurpose_jobs` already cover the new columns).
- `shorts-videos` bucket already exists with owner-scoped RLS.

### API stubs (per your "build with stubs now" answer)
- **Pexels** (B-roll): without `PEXELS_API_KEY`, return 6 curated portrait clips so the button works end-to-end. When you add the secret later, it auto-switches to live.
- **TikTok / Instagram / Threads / LinkedIn publish**: render "Publish to <platform>" buttons that open the intent-upload page (TikTok studio already wired) + copy caption/hashtags. A small "Connect <platform>" pill links to the connectors flow that will activate when the keys arrive — UI is final, no rework needed.

---

## Part 3 — Premium landing pages

Two pages get the full luxury treatment. **Brand colors and Inter font stay the same.** Only craft, depth, density and motion change. No framer-motion (Worker SSR) — CSS only.

### 3A. `/tools/shorts-script-generator` (currently uses generic `SegmentPage`)
Custom page replacing the SegmentPage usage. Section order:

1. **Hero**
   - Eyebrow chip: "Free · Shorts Studio".
   - Headline + sub.
   - Live demo widget (cinematic 3-panel auto-cycle): paste blog → AI processing → 3 platform outputs (TikTok / Reels / Shorts) with native chrome.
   - Floating glass pill: "Powered by Claude · 12,000+ creators".
   - Aurora gradient + border-beam stroke around the demo (CSS only).
2. **Logos / "as seen in" marquee** (existing `SocialProofBar`).
3. **3D-feel pain cards** (4 cards) — `LuxIconCard` already exists; reuse with tilt-on-hover.
4. **"How it works"** — animated pipeline (SVG path with traveling dot via CSS `offset-path`), 3 glass stops.
5. **Feature mosaic** (bento) — Hooks with virality score, Voiceover, B-roll, Series mode, Burned-in captions, Cover thumbnail. Each tile uses a 3D-rendered mockup screenshot (generated via `imagegen` premium).
6. **Competitor comparison** — PostSpark vs Opus Clip vs Submagic vs Vizard. 8-row matrix with gold ✓ on PostSpark column, gradient border, "Most picked by creators".
7. **Sample outputs gallery** — 3 real generated scripts (TikTok / Reels / Shorts) in platform-native cards.
8. **Pricing teaser** — Free / Pro / Founding Lifetime (gold border, "47 of 50 claimed" scarcity).
9. **FAQ** — 8 specific questions (length, languages, can I record from script, ownership, etc.).
10. **Final CTA** — "Start free, no card" + secondary "See Pro features".

### 3B. `/use-cases/youtube-to-instagram` (currently basic)
Mirrors the same luxury template, scoped to YT → Reels:
- Hero with split-screen mockup (YouTube long-form left → 3 Reels right).
- "The repurposing problem" pain row (3 cards).
- "How PostSpark does it" — 4-step animated flow (Drop URL → AI highlights → 9:16 crop → Caption + hashtag).
- Before/after visual: long-form transcript shrinking into a 45s Reel script.
- Comparison vs Opus Clip + Repurpose.io for this specific workflow.
- 3 sample Reels scripts.
- FAQ + CTA.

### Shared design upgrades
- All icons → `LuxIconCard` 3D tile (gradient + inner shadow + duotone lucide icon + glow-follows-cursor via CSS vars).
- Imagery: 6 premium 3D mockup images generated with `imagegen` (premium tier) — phone in hand showing PostSpark output, holographic UI, editorial product shots. Saved under `src/assets/`.
- Spacing: rhythm increased to 96–128px between sections (your "crowded" feedback).
- One marquee testimonial row instead of full testimonial cards.
- No duplicate CTAs back-to-back.
- Same `tokens.css.ts` palette (`#7C3AED`, `#0F172A`, etc.) — no new colors introduced.
- Same Inter font.

---

## Sequence

1. Fix bug (Part 1) + diagnostics — verify on live preview.
2. DB migration for new columns.
3. Voiceover server fn + UI.
4. Hook scores + B-roll (stubbed) + Series mode + Cover.
5. Lite editor + timeline (largest module — built behind a "Beta" pill).
6. Redesign `/tools/shorts-script-generator` (new components under `src/components/landing/shorts/`).
7. Redesign `/use-cases/youtube-to-instagram` using the same component set.
8. Generate the 6 premium mockup images.
9. Playwright pass on mobile (360×640) + desktop to verify both pages look premium and Generate works.

---

## Out of scope (this round)
- Native ffmpeg, Whisper transcription, or any binary that won't run on Cloudflare Workers.
- Redesigning the other 13 tools / 4 use-case pages — I'll apply the same template to those in a follow-up build once you confirm this one looks right.
- Real TikTok / Instagram / Threads / LinkedIn publish (UI ready, swaps to live when keys arrive).
- Color / typography changes.

---

## What I'll need from you mid-build
- Confirmation to call `add_secret` for `PEXELS_API_KEY` **only after** you have the key (until then, stubbed UI works).
- No secrets needed for voiceover (uses Lovable AI Gateway).

Approve and I'll start with Part 1 (the bug), then move through Parts 2 and 3.
