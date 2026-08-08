# Obsidian Luxe — Premium Workspace Re-skin

Re-skin the whole PostSpark workspace interior into a cinematic, glass-depth dark surface (Linear / Midjourney / Apple register), then apply it surface by surface.

Two notes up front:
- **Motion:** this app cannot ship Framer Motion (it breaks the server runtime, a rule we set earlier). Every effect below — sliding liquid tab capsule, spring hover, shimmer, layout fades, glowing progress — is built with CSS transitions/keyframes and spring-like cubic-bezier curves. Visually equivalent, no library.
- **Light mode:** the recent light workspace stays intact. Obsidian Luxe becomes the dark theme (and dark is already the default), so the app opens in the new look.

## 1. Depth engine (foundation)

In `src/styles.css`, extend the dark `--pw-*` token block:
- Canvas `#09090B`, panel fill `rgba(15,15,20,0.72)`, hairline `rgba(255,255,255,0.06)`, raised hairline `rgba(255,255,255,0.12)`.
- Ambient elevation scale: `--lux-e1/e2/e3` = layered wide soft shadows + a 1px inset top highlight so panels read as physical glass.
- New utility classes: `.lux-glass`, `.lux-raised`, `.lux-hairline`, `.lux-shimmer`, `.lux-glow` (radial brand aura via `--brand` custom property), `.lux-spring` (hover lift/scale on a spring-ish curve), `.lux-skeleton` (continuous glowing gradient sweep).
- `.pw-surface`, `.pw-band`, `.pw-hero`, `.pw-chip`, `.pw-cta` in dark mode re-map onto the glass tokens, so every existing card inherits the new material without touching each file.
- All motion wrapped in `prefers-reduced-motion`.

## 2. Repurpose Studio

- Hero band becomes an immersive floating header: abstract 3D metallic-glass artwork bleeding off the right edge with a mask, aurora bloom behind the title, glass eyebrow pill and step chips. Generate one new dark-set art image for this.
- Source tabs (Paste Text / URL / YouTube / PDF / Voice) become one integrated physical switcher: a rounded glass track with a sliding capsule that fluidly translates and stretches to the active tab (CSS transform driven by measured tab offset/width).

## 3. Format cards with brand DNA

- Remove flat blue checks and plain borders.
- Each platform card carries a `--brand` color (X, LinkedIn, Instagram, Facebook, TikTok, Threads, YouTube, email, SEO, carousel...). Hover/selected projects a soft ambient radial aura in that brand color behind the card.
- Selected state: `scale(1.02)`, brightened inner hairline, a one-pass metallic shimmer sweep across the surface, and a refined glass check badge instead of the blue tick.
- Same treatment reused for Studio/Tool tiles on the dashboard home.

## 4. Motion + polish pass

- Card/button/sidebar hover: spring-curve lift, weightless and consistent.
- Route/tab/dropdown content fades and rises instead of cutting.
- Generation progress and all skeletons switch to the glowing gradient pulse.
- Sidebar and topbar become glass with a hairline divider; active nav item gets the gradient pill on glass.

## 5. Surfaces in order

Dashboard home → Repurpose → Publishing Center → Image Studio → Brand Kit → Billing/Settings → remaining tool pages inherit via shared primitives (`ToolHero`, `PageHeader`, `premium.tsx`).

## 6. Validation

Playwright screenshots at 360 / 768 / 1440 in dark and light, contrast check on every new token pair, tap targets ≥44px, visible focus rings, and a pass over empty/loading/error states. Build and typecheck green.

## Technical notes

- Token and utility work is centralized in `src/styles.css`; per-route edits are limited to structure (hero art, tab switcher, card markup with `--brand`).
- Shared primitives in `src/components/dashboard/premium.tsx` gain the glass/aura/shimmer variants so unvisited pages upgrade for free.
- No new runtime dependency is added.
