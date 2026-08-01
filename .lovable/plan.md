
# PostSpark — Interior UI Premium Upgrade

Goal: make the logged-in app (dashboard home + all tool pages) feel like a million-dollar AI product — richer visual layers, real imagery, tasteful motion — **without changing a single color token, gradient value, or font**. Everything reuses the existing `ds-*` / `lv3-*` tokens in `src/styles.css`.

## Guardrails

- No edits to color variables, palettes, or font stacks. New CSS only composes existing tokens (`--ds-*`, `--cat`, existing violet/cyan gradients).
- Frontend/presentation only — no business logic, no server functions, no schema.
- All motion respects `prefers-reduced-motion` and stays GPU-cheap (transform/opacity only). No framer-motion (Worker SSR constraint) — pure CSS + tiny IntersectionObserver hook (`useReveal` already exists).

## 1. Shared visual primitive layer (new CSS block in `src/styles.css`)

A single "premium kit" section, used everywhere so the app feels designed, not patched:

- **Aurora canvas**: soft drifting radial glow behind page content (already used on landing `lv3-aurora`) ported to an interior variant with lower intensity, plus a fine grain overlay so flat surfaces stop looking flat.
- **Spotlight cards**: pointer-tracked highlight on cards/tiles (CSS custom props updated by one small `useSpotlight` hook), giving the Linear/Cursor "light follows cursor" feel.
- **Conic gradient borders**: 1px animated ring on hero/primary cards and on active sidebar item, using existing accent colors only.
- **Glass tiers**: `ds-glass-1/2/3` — consistent blur + border + inner-highlight recipes so nested surfaces read as layers.
- **Depth & elevation scale**: 4 shadow steps derived from existing shadow tokens, applied consistently (page header → cards → popovers).
- **Noise/mesh section dividers** and a reusable `ds-orb` decorative blob for empty corners.
- **Micro-interactions**: press-scale on buttons, magnetic hover on tiles, icon pop on hover, animated underline for links, count-up numbers for stats.
- **Skeleton shimmer refresh**: replace flat skeletons with gradient-sweep shimmer matching brand.

## 2. Dashboard home (`src/routes/dashboard.index.tsx`)

- **Hero band**: aurora + grain backdrop, greeting with time-of-day line, the AskBar promoted into a glowing "command console" (animated focus ring, typewriter placeholder cycling through real prompts, suggestion chips with staggered entrance).
- **Stat tiles**: count-up animation, tiny inline sparkline (SVG, generated from existing data), plan-usage ring gauge instead of plain text, trend arrow.
- **Bento "Studio" grid**: replace uniform tool grid with a mixed-size bento — 1 large featured tool card (with real generated illustration/thumbnail), 2 medium, rest compact. Category accent per tile already supported via `--cat`.
- **Live activity rail**: recent generations as a stacked "receipt" list with platform BrandIcons, hover preview popover.
- **Streak / momentum module**: 7-day dot strip with fill animation, subtle confetti-free pulse on today.
- **Empty states**: illustrated (real image + ghost rows) instead of text-only.

## 3. Tools pages — one shared premium shell

Introduce `ToolShell` (wraps `PageHeader` + hero art + content):

- Every tool page gets a **hero strip**: eyebrow chip, gradient title, subtitle, and a right-side decorative visual (per-tool image or animated graphic), plus an "how it works in 3 steps" micro-row.
- **Two-pane pattern** standardized: input panel left (glass tier 2), live output/preview right (glass tier 1 with device/platform frame). Applies to Repurpose, Hook Lab, Image Studio, Carousel, SEO Blog, Humanizer, Podcast, Shorts, LinkedIn, Publishing.
- **Generation experience**: replace plain spinners with a premium progress theatre — animated gradient bar, streaming skeleton lines, rotating status copy ("analysing voice…", "drafting hooks…"), and a soft glow pulse on the output pane. Result cards animate in staggered.
- **Result cards**: platform-accurate mock frames (LinkedIn/X/Threads/Instagram previews already partly exist) reused across tools so output always looks like the real feed.
- **Sticky action bar** at bottom of tool panes (Generate / Regenerate / Copy / Publish) with press physics.

## 4. Real imagery (generated assets, brand-consistent)

Generate a small, deliberate set (each optimized, lazy-loaded, alt text, uploaded as CDN assets):

1. Dashboard hero abstract — dark navy/violet flowing mesh (matches existing palette).
2. 8–10 tool hero illustrations (Repurpose, Hook Lab, Image Studio, Carousel, SEO Blog, Shorts, Podcast, Publishing, Brand Kit, Analytics) — same abstract-3D visual language, per-tool accent.
3. 3 empty-state illustrations (no content yet / no connections / no schedule).
4. Upgrade/pricing module backdrop.
5. Onboarding & referral card art.

All use existing brand colors only, single cohesive style so it reads as one art direction (not stock-mixed).

## 5. Animated things (no new heavy deps)

- Aurora drift + grain (CSS keyframes).
- Scroll-reveal stagger on every section via existing `useReveal`.
- Count-up stats, ring gauges, sparkline draw-in.
- Animated gradient text sweep on page titles (subtle, once on mount).
- Sidebar: active-item glow slide, icon micro-bounce, collapsible width spring.
- Toast/notification entrance polish; success state with animated check.
- Optional lightweight canvas particle field (~40 dots, paused off-screen) only on dashboard hero — behind reduced-motion + mobile off.

## 6. Sidebar, header, mobile

- Sidebar: grouped sections with tiny labels, gradient active pill, hover reveal descriptions, plan badge module at the bottom with usage ring.
- Header: glass blur on scroll, compact search with ⌘K hint, avatar ring.
- Mobile: full-height sheet nav with staggered items, tool cards single-column with larger art, tap feedback; no layout regressions on 360px width.

## Technical notes

- New files: `src/components/dashboard/ToolShell.tsx`, `HeroBand.tsx`, `SpotlightCard.tsx`, `StatRing.tsx`, `Sparkline.tsx`, `CountUp.tsx`, `GenerationProgress.tsx`, `IllustratedEmpty.tsx`, `hooks/useSpotlight.ts`.
- One additive CSS block in `src/styles.css` (`/* === PREMIUM VISUAL KIT === */`) composing existing variables; zero token edits.
- Images generated then externalized via `lovable-assets`, imported as `.asset.json` pointers.
- Rollout order: (1) CSS kit + primitives, (2) dashboard home, (3) ToolShell + top 5 tools, (4) remaining tools, (5) imagery pass, (6) sidebar/header/mobile polish, (7) light-mode verification + reduced-motion + Playwright screenshot QA at 360px and 1440px in both themes.
