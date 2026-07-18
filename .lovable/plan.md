# Shorts Suite Overhaul — Phased Plan

**Security note first:** You pasted your Deepgram API key in the chat. Treat it as compromised — rotate it now at deepgram.com → API Keys. I'll wire the new key through the secure `add_secret` flow, never hardcoded.

The full scope (FFmpeg.wasm renderer, Deepgram captions, ElevenLabs VO, multi-input ingestion incl. YouTube/podcast, 30/60/90-day calendar, new editor UX, dark redesign) is roughly 3–5 build sessions. I'll ship it in phases so each one is usable.

---

## Phase 1 — Fix what's broken + premium dark UI (this session)

**Goal:** Studio generates scripts reliably, Editor audio works, all three pages match the dark premium spec.

1. **Fix Shorts Studio "No script returned"**
   - Add raw-response logging in `anthropic.server.ts` for tool-call failures
   - Tolerant parser: retry once with stricter reminder, then surface the actual Anthropic error string (401/404/429/overloaded) instead of the generic message
   - Verify `CLAUDE_MODEL_ID` resolves to a real Anthropic id
2. **Fix Editor audio not playing**
   - Root cause: music `<audio>` element isn't started/synced with the master video clock
   - Rewrite playback loop with a single `requestAnimationFrame` master clock driving both video and audio elements; add volume slider (default 30%)
3. **Premium dark UI pass on all 3 pages**
   - Background `#0A0A14`, cards `#14142B` with `backdrop-blur-md` + subtle border, gradient accent `#6366F1 → #A855F7`
   - Lucide icons, glow hover states, sharper headline weight
   - Pro paywall polish on Shorts Series
4. **Auto Fetch B-roll wiring** — button on each shot row that calls existing Pexels function with the Claude-generated `broll_search_query` and shows thumbs inline

## Phase 2 — Editor engine (FFmpeg.wasm + ElevenLabs + Deepgram)

1. Add `@ffmpeg/ffmpeg` + `@ffmpeg/util`, load core from CDN, gate behind `<ClientOnly>` and dynamic import (Worker SSR compat)
2. Multi-track timeline data model: `video[]`, `audio[]`, `caption[]` (already partly exists — extend)
3. **ElevenLabs VO** — server route `/api/narrate-short` already exists; add "Generate Voice" button that drops the returned mp3 onto the Audio track
4. **Deepgram Auto-Caption** — new server route `/api/public/deepgram-transcribe` (signature-verified), returns word-level timestamps → render as CSS-positioned overlays + burn on export
5. **Export** — FFmpeg concat + audio mix + drawtext filter → WebM download

## Phase 3 — New input types for Studio

- YouTube URL → yt-dlp-style transcript fetch (via existing import pipeline or new server fn calling a transcript API)
- Podcast URL (RSS/mp3) → Deepgram transcribe → feed as source text
- Uploaded video/audio → Deepgram transcribe → source text
- Text idea (already works)

## Phase 4 — Shorts Series → 30/60/90-day Content Calendar

- Rename route, replace 5-episode generator
- New Claude prompt returns `days[]` with hook/script/CTA/thumbnail idea/caption/hashtags
- Store as `content_calendars` table (new migration, RLS + grants)
- Export: CSV (browser), Notion (user pastes their integration token via `add_secret`), Google Sheets (OAuth — deferred to a later phase)

---

## Technical notes

- Deepgram key: stored as `DEEPGRAM_API_KEY` via `add_secret` after you rotate
- FFmpeg.wasm is ~30MB — lazy-loaded only when user hits Export
- New `content_calendars` table needs `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` + RLS scoped to `auth.uid()`
- YouTube transcript fetching from Worker runtime is unreliable — will likely need a third-party transcript API (RapidAPI, Supadata) with its own key

---

## Confirm before I start

1. **Rotate the Deepgram key now** and paste the new one when I open the secure form in Phase 2 (not before)
2. **Start with Phase 1?** (fix Studio generation, fix Editor audio, premium dark UI, B-roll auto-fetch) — this is the biggest immediate quality win and unblocks everything else
3. **Any phase you'd rather I skip or reorder?** (e.g., you may want YouTube ingestion before the calendar)
