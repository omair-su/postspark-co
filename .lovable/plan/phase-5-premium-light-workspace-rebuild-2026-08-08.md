# Phase 5 — Premium Light Workspace Rebuild

Goal: the app interior should feel like Claude, Gemini, Perplexity, Canva and the new PostSpark landing page — bright white canvas, soft colour washes, image-led heroes, dense-but-spacious cards, real motion, one consistent token system. Dark mode stays supported but no longer drives the composition.

## Verified current state

- `src/styles.css` is 3,906 lines and layers three competing systems: a dark `--ps-*` palette, a light-mode remap block (`--ps-light-*`), and an "ice"/`--ds-*` set, held together by hundreds of `!important` overrides. That is why light mode looks patched rather than designed.
- Dashboard shell (`src/components/DashboardLayout.tsx`) renders a dark sidebar against a light content area, and the sidebar lists ~40 links in 6 groups with no visual hierarchy — the main source of the "empty and heavy" feel.
- Hero art is decorative AI gradients (`src/components/dashboard/premiumArt.ts`, `HeroArt.tsx`) — nine abstract meshes, no real product or human imagery.
- The landing page already has the target aesthetic (`src/components/landing/v4/*` + real screenshots in `screens.ts`), but none of its tokens or motion are shared with the app interior.
- Spark Copilot (`src/components/SparkCopilot.tsx`, `AssistantOrb.tsx`) is a plain circular icon button with no animated assistant identity.

## Imagery — what is actually possible

Magnific and Dribbble shots cannot be used: they are other people's copyrighted work and have no download API. Instead:

1. **Real photography** — curated Unsplash/Pexels images (free commercial licence) for people-at-work, workspace and editorial shots, pulled into Lovable Assets so they are CDN-served and stable.
2. **Real product imagery** — fresh screenshots captured from the live app (the landing page already does this) for hero/feature cards, so nothing promises a capability the product lacks.
3. **Brand-generated art** — replaces the current abstract meshes with a single coherent bright set: soft violet/blue/mint light washes, floating platform glyphs, 3D-ish soft shapes in the style the references use.

Every hero image will be one of those three; no scraped design-shot mockups.

## Work plan

### 5.1 One token system (foundation)

- Collapse `--ps-*`, `--ps-light-*`, `--ds-*` and `ice-*` into a single semantic token set defined once, with light as the authored baseline and dark as an override block.
- Light palette: canvas `#FFFFFF`, subtle sections `#F8FAFF`, card surface white with `1px` hairline `#EDF0F7`, ink `#0F172A`, muted `#5B6478`, primary violet `#7C3AED` → blue `#3B82F6` gradient, accent mint `#10B981`.
- Fixed scales: radius (10/14/20/28), elevation (hairline → soft → lifted → hero), spacing rhythm, motion durations/easing.
- Delete the `!important` override layer as tokens replace it; keep a small compatibility shim only where a legacy class is still referenced.

### 5.2 Shared primitives, one set

- Promote the landing v4 look into reusable app primitives: `Surface`, `PanelCard`, `StatCard`, `SectionBand`, `GradientCTA`, `Pill`, `FloatingIconCluster`.
- Retire duplicated premium/base variants (`SpotlightCard`, `ToolTile`, `ToolHero`, `HeroArt`, ad-hoc glass classes) by re-implementing them on top of the new primitives so call sites keep working.
- Sweep hardcoded colours out of the redesigned surfaces (`text-white`, `bg-[#…]`, inline hex) and replace with tokens.

### 5.3 Light workspace shell

- Sidebar becomes light (`#FAFBFF` → white) with a hairline divider, gradient-pill active state, and grouped/collapsible sections so the 40 links stop reading as a wall.
- Sticky slim topbar: breadcrumb, command-palette search, plan chip, theme toggle, avatar.
- Content max-width with generous but *filled* rhythm; no full-bleed dead space.

### 5.4 Core surfaces redesigned (in this order)

1. **Dashboard home** — image-led hero band (real screenshot + soft wash + floating platform glyphs), animated count-up stat cards, bento of "continue where you left off" / activation checklist / recent outputs, colourful light section bands between blocks.
2. **Repurpose** — two-pane source→output with sticky format rail, per-format status chips, skeleton shimmer while generating.
3. **Output preview** — platform-accurate preview cards with real avatar/media, copy/edit/publish actions inline.
4. **Onboarding** — full-bleed bright steps with real imagery, progress rail.
5. **Brand Kit** — swatch/logo/type panels on white, live sample preview.
6. **Publishing Center** and **Billing** — restyled on the new primitives (billing keeps the Phase 4 logic untouched).

### 5.5 Motion

- Scroll-reveal (reuse landing `useFadeIn` pattern), hover lift + gradient sheen on cards, count-up numbers, staggered list entrance, shimmer skeletons, spring-y tab/pill transitions.
- CSS-only (project rule: no framer-motion). Everything respects `prefers-reduced-motion`.

### 5.6 Spark Copilot identity

- Replace the circular icon with an animated assistant mark: layered gradient orb with slow breathing/aurora drift, listening pulse while streaming, settled state when idle — plus a matching small mark for the launcher and empty state.

### 5.7 Validation (exit gate)

- Playwright screenshots of each core surface at 360px / 768px / 1440px, light and dark.
- Check contrast on every new token pair, tap targets ≥44px, keyboard focus rings, and empty/loading/error/success states for each redesigned surface.

## Scope guardrails

- No new features, no backend or business-logic changes — presentation only.
- Phase 1–4 work (auth, brand-kit resolver, repurpose pack logic, billing/entitlements) stays functionally identical.
- Surfaces outside the seven core ones inherit the new tokens automatically but are not individually redesigned in this phase.

## Delivery order

Foundation (5.1–5.2) lands first and is verified, then the shell, then the core surfaces one at a time with a screenshot check after each, then Copilot identity, then the full accessibility/responsive pass.
