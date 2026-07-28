## Goal
Apply the exact ice-blue card system across the whole interior app in light mode only, with pure white page backgrounds, #448EE4 light-mode buttons, a light ice-blue sidebar, richer dashboard cards, and no changes to dark mode.

## Current state confirmed
- `src/styles.css` already has light-only ice-card tokens: `--ice-card`, `--ice-card-hover`, `--ice-heading`, `--ice-body`.
- The dashboard shell still defines dark defaults in `.dashboard-shell` (`--ds-bg`, `--ds-card`, `--ds-text`) and many pages rely on hardcoded dark Tailwind classes.
- The sidebar uses `.lux-sidebar`, currently a deep dark violet gradient.
- Pages/components with confirmed hardcoded dark or low-contrast areas include `DashboardLayout`, `SparkCopilot`, `dashboard.history`, `dashboard.brand-kit`, `dashboard.publishing`, plus scanned hotspots in Shorts, Image Studio, Thumbnail, Carousel, Templates, Hook Lab, Repurpose, SEO Blog, Humanizer, Brand Voice components, Brand Kit components, and Stock/Publishing surfaces.

## Implementation plan

### 1. Create the final light-mode design system in `src/styles.css`
Add a single light-only block under `html:not(.dark)` that becomes the source of truth:
- Pure white app canvas: `--ds-bg: #FFFFFF`.
- Ice-blue cards: `linear-gradient(135deg, #E3EEF9 0%, #FFFFFF 45%, #E6F2FF 100%)`.
- Deep charcoal text/icons: `#1F1F1F`.
- Primary light-mode button color: `#448EE4`.
- Softer borders/shadows tuned to blue: pale blue border, shadow bloom, and hover lift.
- Keep `.dark` variables and dark mode CSS untouched.

### 2. Add semantic reusable classes and retire fragile overrides over time
Introduce/strengthen these classes so pages can use tokens instead of hardcoded dark utilities:
- `.ds-card`, `.ds-panel`, `.ds-card-hover`, `.ds-card-hero`, `.ds-page-hero`, `.ds-tool-tile`.
- `.ds-primary-button` / update `.ds-cta-pill` to become #448EE4 in light mode only.
- `.ds-subtle-button`, `.ds-input`, `.ds-chip`, `.ds-icon-btn` with light-safe foregrounds.
- Add a subtle noise texture on card surfaces using pseudo-elements.
- Add 200ms hover lift + shadow bloom on interactive cards.
- Add light heading typography polish: `letter-spacing: -0.02em`, `font-feature-settings: "ss01", "cv11"`.

### 3. Convert the dashboard shell and sidebar
- Make `.ds-canvas` pure white in light mode.
- Make `.lux-sidebar` light-mode-only ice-blue/white gradient instead of dark navy.
- Update sidebar nav, labels, user card, workspace popover, collapse button, mobile drawer, and top header text/icons so they read charcoal/blue in light mode.
- Preserve the current dark sidebar exactly when `.dark` is active.

### 4. Replace hardcoded dark cards in the high-impact route files
Update the key interior pages the user listed to use semantic classes instead of dark classes:
- History
- Publishing Center
- Publish to X / Facebook / Instagram / Threads
- LinkedIn Composer
- Shorts Studio / Shorts Series / Shorts Editor
- Image Studio
- Thumbnail / Cover
- Carousel
- Templates
- Settings and WhatsApp Alerts
- Calendar
- Analytics / Agency Analytics
- Team
- Gallery
- Stock Photos & Video
- Refer & Earn
- Billing
- Brand Kit / Brand Voice remaining nested panels

For each page:
- Replace `bg-slate-*`, `bg-[#14142B]`, `bg-[#17152A]`, `bg-[#0B0A14]`, dark borders, and `text-white/*` card text with `ds-card`, `ds-panel`, `text-foreground`, `text-muted-foreground`, and semantic buttons.
- Keep real platform brand tiles black/blue/red/gradient where appropriate so their white icons remain readable.

### 5. Add tinted category accents on cards
Apply 2px top-border accents on ice-blue base cards:
- Shorts: rose
- Brand Kit / Brand Voice: violet
- LinkedIn / X / publishing: blue
- Meta/Instagram/Threads: platform-inspired but softened
- Image/thumbnail/carousel: cyan or magenta-blue
- Analytics/team/billing/settings: blue/violet variants

This will be implemented through semantic classes or `data-accent` attributes, not random per-card hex utilities.

### 6. Upgrade dashboard card visuals
For dashboard home and tool cards still appearing dark in light mode:
- Convert to ice-blue card base.
- Add animated Gemini-style soft aurora/mesh on hero surfaces in light mode only.
- Add restrained visual animation: slow gradient drift, shimmer edge, and hover shadow bloom.
- Avoid decorative orbs; use mesh/vignette bands and card surface movement instead.

### 7. Marketing light hero mesh
Add a light-mode-specific Gemini-style animated aurora background utility for marketing/landing surfaces:
- Pure white base.
- Soft blue/violet mesh vignette.
- Motion disabled under `prefers-reduced-motion`.

### 8. Verification pass
After implementation:
- Run the existing build/typecheck workflow.
- Run the visual theme tests already present for light and dark dashboard routes.
- Add or expand targeted visual regression coverage for these routes: `/dashboard`, `/dashboard/history`, `/dashboard/shorts-studio`, `/dashboard/publishing`, `/dashboard/settings`, `/dashboard/brand-kit`, `/dashboard/brand-voice`, `/dashboard/billing`.
- Manually inspect light-mode screenshots to confirm: no dark cards, no invisible history text, sidebar is light ice-blue, buttons use #448EE4, and dark mode remains unchanged.

## Technical approach
- CSS changes are scoped under `html:not(.dark)` where possible.
- Dark mode selectors and `.dark` token values will not be modified.
- Component edits will replace confirmed hardcoded dark utilities with semantic classes, prioritizing shared components and route-level wrappers so one change fixes many pages.
- Existing brand/platform colored tiles will be protected with `data-brand-tile` or equivalent semantic classes so their white icons do not get remapped.