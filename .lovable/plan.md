# Repurpose Studio — Audit + Premium Upgrade Plan

## Where it is today

The page works end to end: source import (text, URL, YouTube with manual transcript fallback, PDF, Drive), 11 formats with per-format quantity/style pickers, starter recipes, tone + 10 style modifiers + 30 languages, Brand Kit / Brand Voice auto-applied, one Claude call per format (so quality isn't squeezed), a piece model that gives one card per post, platform-real previews, whole-pack publish handoff, PDF export, Google Docs export, schedule modal, templates, swipe file, draft restore.

So the foundation is good. What's missing is depth, speed, per-post control, and the luxury layer.

## Bugs and gaps found (all confirmed in code)

1. **Scheduling ignores the piece model.** The schedule modal loops over whole formats, so "5 tweets" is saved to the calendar as ONE calendar post containing all five, and carousel/SEO/podcast are silently dropped (no platform mapping).
2. **Rate limit trips mid-pack.** All formats fire at once against one shared per-minute limiter, so a 5–6 format pack can fail its later formats with "Rate limit: please wait a minute".
3. **Old low-quality generator still live.** The legacy blob generator (hardcoded "exactly 10 tweets", "exactly 5 LinkedIn posts", no piece separators) still powers the Brand Voice test bench, so that surface produces worse, unsegmented output than the studio.
4. **No per-post actions.** Regenerate, edit, copy-with-changes, publish and schedule all work at *format* level. There's no "regenerate just this tweet", "make this shorter/punchier", or per-post publish — the single most requested control in this kind of tool.
5. **Editing is hidden.** You can only edit in the Raw tab; the beautiful preview cards are read-only.
6. **Carousel dead ends.** Generated slides are excluded from the PDF export and are not passed to the Carousel Designer (only the raw source topic is), so the slide copy has to be regenerated there.
7. **Progress is theatre.** Nothing streams; a 6-format pack shows a bar that only moves when a whole format lands. Long waits feel broken.
8. **Draft restore is partial.** Timings, tone, language and modifiers are not restored, and a large pack can silently exceed local storage with no warning.
9. **No history on the page.** Past packs live in the database but are unreachable from the studio — no "recent packs" rail, no reopen, no compare.
10. **Redundant pack claim.** Every format re-runs the pack claim/lookup after the pack was already created, adding needless latency to each format.
11. **Modal close button is mispositioned** (absolute inside a non-positioned card).
12. **Small polish debt:** emoji tick instead of an icon, 11px select labels, no keyboard focus ring on format cards, Instagram preview shows a placeholder tile with no way to generate the actual image.

## What to add (high demand, in order)

**Phase 1 — Correctness and control**
- Per-piece scheduling and per-piece publishing (one calendar entry per post, correct platform, auto-spacing).
- Sequential-with-concurrency-cap generation queue so packs never self-rate-limit; failed formats retry individually.
- Per-piece action bar on every preview card: copy, edit inline, regenerate this one, shorter / punchier / more specific, add image, publish, schedule.
- Inline editing directly on preview cards, saved into the draft.
- Retire the legacy generator: the test bench uses the same per-format engine.
- Carousel slides flow into both the PDF export and the Carousel Designer.

**Phase 2 — Speed and trust**
- Streamed generation: text appears token by token per format with a real per-format progress ring, cancel per format.
- Per-piece quality signals: platform character ring, brand-voice match score, hook strength, readability, "too similar to piece 3" warning.
- Auto-fix over-limit posts (native X thread split, tighten to Threads' 500 chars).

**Phase 3 — Capability that sells**
- Recent packs rail with reopen, duplicate and compare; pack titles auto-named from the source.
- Multi-language drop: one source, the same pack in up to 5 languages.
- Bulk mode (Pro): 5–10 URLs or an RSS feed in, packs out.
- Evergreen recycling: pick a past winner, get fresh angles.
- Image per post via Image Studio, and per-post visual attachment carried through to publishing.
- Approval flow for teams; best-time scheduling suggestions.

## How it becomes beautiful and luxurious

- **Three-pane studio shell** (desktop): source rail left, format/composer centre, live preview right — replaces today's long vertical scroll. Sticky command bar with source word count, piece count, quality meter, credits and the Generate button.
- **Per-platform accent aura**: each format card and preview card carries its brand accent as a soft glow, hairline gradient and selected-state ring; the existing brand glyphs stay the visual anchor.
- **Real platform chrome, dark and light parity**: device-framed previews (phone frame for TikTok/Instagram/Threads, inbox chrome for email, document chrome for scripts), engagement rows, verified ticks.
- **Motion (CSS only, no framer-motion)**: staggered card reveal on generate, shimmer "writing" skeletons while streaming, copy button that morphs to a tick, aurora gradient drift behind the hero, spring press on format cards, animated quality meter, count-up on piece totals.
- **Feed vs grid view toggle** for the output, drag-to-reorder pieces before publishing.
- **Art and icons**: reuse the existing premium art set for the hero and empty states, add generated art for the empty output state ("your pack lands here"), the multi-language drop and bulk mode; format cards keep the exact platform icons already in the icon set; new icons only for the new actions (shorten, punch up, add image, translate).
- Accessibility and polish pass: icon tick, larger control labels, visible focus rings, correct modal close position.

## Technical notes

- `src/routes/dashboard.repurpose.tsx` gets split: source panel, format picker, command bar, output board, modals — the route is 1,452 lines today and the three-pane shell will not fit in it.
- Scheduling moves onto `parsePack` pieces, mapping each piece to its own `createScheduledPost` call with per-piece platform and spacing.
- Generation queue with a concurrency cap (2–3) in the page, plus a per-format `AbortController`; the shared per-minute limiter stays untouched server-side.
- Per-piece regeneration needs a new server function that regenerates a single piece with its neighbours as "avoid repeating" context, writing back into the pack's stored outputs.
- Streaming needs a server route that proxies Claude's stream per format; the piece delimiter already lets the client segment partial text.
- The legacy `generateRepurposedContent` blob path is removed once the test bench moves to `repurposeOneFormat`.
- No schema change is required for Phases 1–2. Phase 3 (per-piece edits, favourites and recent-pack metadata) may want an additive `outputs.pieces` field on the existing pack row — additive only, explained before it runs.
