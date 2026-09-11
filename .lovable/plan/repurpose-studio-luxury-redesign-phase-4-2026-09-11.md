# Repurpose Studio — Luxury Redesign (Phase 4)

Goal: turn today's long vertical page into a calm three-pane studio that feels premium, without changing how generation, publishing, or credits work.

## What changes for you

**Three-pane studio (desktop)**
- Left rail: your source — paste/URL/file/Drive import, word count, recent packs, bulk and multi-language entry points.
- Centre: format cards, quantity/style, tone, language, custom instructions, recipes.
- Right: live preview of the selected piece, with real platform chrome.
- Sticky top bar always shows source word count, piece count, pack quality meter, credits left, and the Generate button.
- Mobile and tablet keep a single scrolling column with a sticky bottom action bar — nothing gets hidden.

**Per-platform accent**
Each format card and preview card picks up its platform colour as a soft glow, a hairline gradient edge and a selected-state ring. Existing platform glyphs stay exactly as they are.

**Real platform chrome**
Phone frame for TikTok, Instagram and Threads; inbox chrome for email; document chrome for scripts and blog; engagement rows and verified ticks. Works in both light and dark.

**Motion (CSS only)**
Staggered card reveal when a pack lands, shimmer "writing" skeletons while text streams, copy button that morphs into a tick, slow aurora drift behind the hero, spring press on format cards, animated quality meter, count-up on piece totals. All of it respects reduced-motion settings.

**Output views**
Feed/grid toggle, plus drag-to-reorder pieces before publishing (order carries into publishing and scheduling).

**Art and icons**
Reuse the existing premium art for hero and empty states. Generate three new pieces: empty output ("your pack lands here"), multi-language drop, bulk mode. New line icons only for the new actions: shorten, punch up, add image, translate. Platform icons unchanged.

**Accessibility pass**
Icon-based ticks instead of emoji, larger control labels, visible focus rings on every interactive element, modal close button in the correct corner, dialogs labelled and keyboard-closable.

## Technical notes

- `src/routes/dashboard.repurpose.tsx` (1,976 lines) is split while being touched, keeping all existing state and handlers in the route:
  - `components/repurpose/StudioShell.tsx` — three-pane grid + responsive collapse
  - `components/repurpose/StudioCommandBar.tsx` — sticky metrics/credits/Generate
  - `components/repurpose/SourcePane.tsx` — import + word count + packs rail slots
  - `components/repurpose/FormatGrid.tsx` — accent-aura format cards
  - `components/repurpose/OutputPane.tsx` — feed/grid toggle, drag reorder, streaming skeletons
  - `components/repurpose/PlatformChrome.tsx` — phone/inbox/document frames
  - `components/repurpose/QualityMeter.tsx`, `CountUp.tsx`
- New tokens/keyframes appended to `src/styles.css`: `--accent-*` per platform via existing `brandColors`, `rp-aura`, `rp-stagger`, `rp-write`, `rp-spring`, `rp-meter`, all behind `prefers-reduced-motion`.
- Reorder is local UI state applied to the existing pieces array before publish/schedule payloads — no schema change.
- No database migration, no server-function signature changes, no changes to quota, streaming, publishing or scheduling logic.
- Existing components reused as-is: `VisualPreview`, `PublishMenu`, `ImportInputPanel`, `BrandIcon`, `RecentPacksRail`, `BulkModeDialog`, `HookABTester`.
- Verification: typecheck, build, and a Playwright pass on `/dashboard/repurpose` at desktop and mobile widths in light and dark.

## Risks

- The route is large; the split is mechanical (move JSX, pass props) to avoid behaviour drift.
- Drag reorder must not desync the streaming map keyed by format — order is applied at render/publish time only.
