## Goal

Turn Shorts Editor into a real multi-track timeline tool. Fix the `/dashboard/shorts-editor` login bounce, ship WebM + MP4 export, save Series drafts you can switch between, and surface a clean Pro gate + monthly usage meter.

## Part 1 — Fix the login bounce + button contrast (this turn, fast)

- Move `dashboard.shorts-editor.tsx` and `dashboard.shorts-series.tsx` under the protected layout. Symptom is the SSR-no-session bounce: top-level route → no localStorage on server → kicked to `/auth` → back to `/dashboard`. New paths: `src/routes/_authenticated/dashboard.shorts-editor.tsx` and `…shorts-series.tsx`. Same component code; just relocate so the integration-managed `_authenticated/route.tsx` gates them.
- Audit `LiteEditor.tsx`, Series page, and Studio for `text-white on light bg` / `text-[#1A1A2E] on navy bg` cases; route every CTA through the existing `Button` variants so contrast is consistent.

## Part 2 — Pro Timeline Editor

New component `src/components/shorts/TimelineEditor.tsx` replaces `LiteEditor`. Pure browser, Worker-safe, zero ffmpeg in the browser path.

**Tracks (top → bottom):**
1. Video clips (up to 8, drag-reorder, trim handles on each)
2. Captions (auto-imported from generated script SRT, click to edit text/timing)
3. Music (1 track, volume slider, fade-in/out toggle)
4. Voiceover (1 track from AI narration, volume slider)

**Interactions:**
- Pixel-mapped timeline ruler (1px = configurable px/s, default 40px/s, zoom 20-120)
- Per-clip left/right trim handles (drag with snap-to-grid 100ms)
- Drag-reorder video clips (HTML5 DnD with insertion indicator)
- Playhead scrubber (click ruler or drag handle); spacebar play/pause
- Live 9:16 preview canvas (1080×1920 scaled to fit) renders current playhead frame in real time
- Per-clip context menu: mute audio, split at playhead, delete, duplicate
- Caption inline editor: click a caption block → popover with text + start/end ms

**State:** single `EditorProject` object — `{ clips: Clip[], captions: Caption[], music?: Track, vo?: Track, durationMs: number }`. Autosave every 3s into `localStorage` keyed by user+project id, plus "Save draft" button → `shorts_editor_projects` table.

**WebM export:** existing canvas + captureStream + MediaRecorder pipeline, but driven by the timeline timeline state (one continuous render loop walks the full timeline at 30fps).

**MP4 cloud render:** new server route `src/routes/api/public/shorts/render.ts` (authed via signed token, not anon — verifies the caller's Supabase JWT in-handler). Uses a Replicate FFmpeg model to composite the user's already-uploaded clips + music + VO + burned captions into 1080×1920 MP4. Webhook `…/render.callback.ts` updates the row and notifies the user. UI shows "Rendering…" with progress polling.

## Part 3 — Series Drafts

New table `shorts_series` `{ id, user_id, title, source_input, platform, duration, status, created_at, updated_at }`. Existing `repurpose_jobs.series_id` already links episodes.

UI changes on `dashboard.shorts-series.tsx`:
- Left rail: list of saved series with create/rename/delete
- Main: episodes tabs (existing 5-tab view) for the active series
- "New Series" button opens existing generation modal; on save creates a `shorts_series` row then attaches the 5 generated jobs via `series_id`

## Part 4 — Pro gating + usage meter

- Reuse existing `useSubscription`; on Editor and Series pages, free users see a top banner: "Editor + Series are Pro features" with inline upgrade CTA → opens existing `UpgradeNudgeModal`.
- Studio header gains a compact usage chip: `3 / 3 free shorts this month · Upgrade`. Pro/Agency users see `Unlimited`.
- Free users can still preview the editor with sample data, but Save/Export are disabled with tooltip "Upgrade to export".

## Part 5 — Verify end-to-end

- Playwright: log in (managed session), open `/dashboard/shorts-studio`, generate a 30s TikTok script, click "Open in Editor", trim 2 clips, scrub, export WebM, confirm downloaded blob > 50KB. Screenshot each step.
- Generate a Series, save it, refresh, switch series, confirm episodes persist.
- Free user (second test account) sees gate banner + disabled export.

## Files

**Migration:** `shorts_series` table + grants/RLS + `shorts_editor_projects` table (`id, user_id, name, project_json, created_at, updated_at`).

**New:**
- `src/components/shorts/TimelineEditor.tsx` (main editor)
- `src/components/shorts/TimelineRuler.tsx`, `ClipBlock.tsx`, `CaptionBlock.tsx`, `TrackRow.tsx`, `PreviewCanvas.tsx`
- `src/lib/editorProjects.functions.ts` (save/list/load drafts)
- `src/lib/shortsSeries.functions.ts` (CRUD for series drafts)
- `src/lib/cloudRender.functions.ts` (kick off Replicate MP4 render, poll status)
- `src/routes/api/public/shorts/render.callback.ts` (webhook)
- `src/routes/_authenticated/dashboard.shorts-editor.tsx`, `…shorts-series.tsx` (replacements)

**Modified:**
- `src/routes/dashboard.shorts-studio.tsx` — usage chip, "Open in Editor" hand-off with prefilled SRT + VO
- `src/components/DashboardLayout.tsx` — nav still works after route move

**Deleted:** old `src/routes/dashboard.shorts-editor.tsx`, `src/routes/dashboard.shorts-series.tsx`, `src/components/shorts/LiteEditor.tsx`.

## Out of scope (next round)

- Real per-platform direct publish (still blocked on TikTok review)
- Auto B-roll Pexels download into clips (today: links only)
- Color/typography redesign of unrelated pages
