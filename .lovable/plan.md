# Premium Dashboard Redesign — "$100K AI System" Feel

Goal: Make the logged-in dashboard feel like a top-tier high-ticket AI product (think Linear × Vercel × Anthropic Console × Arc). Calm, dense, intelligent, cinematic — not flashy. New free users should feel "this is the real deal" in 3 seconds.

## Visual direction (locked tokens)

- Surface: deep navy `#0b0b18` → `#12122a` with subtle violet glow gradients, soft grain, glassmorphic cards.
- Accent: electric purple `#7c3aed` + violet `#a78bfa` halo for primary actions and active states.
- Text: near-white `#f5f5fa` headings, muted `#a1a1b3` body.
- Typography: keep Inter, tighten with letter-spacing -0.02em on big numbers, use tabular-nums for stats.
- Borders: 1px hairline `rgba(255,255,255,0.06)` + inner highlight `rgba(255,255,255,0.04)` for premium glass edges.
- Radius: 14–16px on cards, 10px on inputs.
- Motion: respect `prefers-reduced-motion`; CSS-only (no framer-motion per project rule). Subtle fade-up on mount, soft pulse on AI status dot.

## Scope (UI/presentation only — no business logic changes)

### 1. `src/components/DashboardLayout.tsx` — Shell upgrade
- Replace cream `cream-page` main with a premium dark canvas: layered radial violet gradient + faint dot/grid pattern + noise overlay.
- Sidebar: keep `lux-sidebar` but add inset highlight, refined group label treatment, animated active indicator (vertical violet bar + soft glow), thinner dividers, frosted brand-switcher pill on top.
- Header: convert to glass top bar (backdrop-blur, hairline border) with command-K search styled as a real prominent pill (not hidden on small), live "AI online" status dot, plan badge chip (Free/Pro/Agency) next to avatar.
- Add a slim left edge gradient seam between sidebar and content for depth.
- Avatar menu: upgrade to glassy popover style (visual only, keep current handler).

### 2. `src/routes/dashboard.index.tsx` — Home redesign
Restructure into a cinematic command-center feel while keeping every existing component (StreakBadge, ReferralBanner, DailySpark, ActivationChecklist, GuidedIntakeModal):

- **Hero header**: large display heading "Welcome back, {name}" with a violet gradient text shimmer, subtitle, and an inline live status row ("AI online · {plan} plan · {used}/{limit} this month"). Replace the small ⌘K hint with a styled prompt.
- **Primary CTA strip**: Big premium "New Repurpose" hero card (gradient border, glow on hover, animated sparkle icon) + secondary quick-actions (Hook Lab, Image Studio, SEO Blog) as compact icon tiles.
- **Stats**: redesign 3 cards as glass tiles with large tabular numerals, micro sparkline (CSS bars, no new lib) using `recentJobs` dates, and trend chips. Usage progress becomes a thin gradient bar inside the "This month" tile.
- **Guided Content Tools**: keep 4 widgets but as premium glass cards with hover glow, icon disc, and a subtle bottom shimmer line.
- **Recent Activity**: convert to a refined list with monospace timestamps, hover row highlight, and an empty state illustration block.
- Reorder: hero → CTA strip → stats → activation/streak/referral row (collapsed into one compact row) → guided tools → recent activity → daily spark moved into a side accent if room (single column kept for simplicity).

### 3. `src/styles.css` — Add premium tokens & utilities
- New CSS vars under a `.dashboard-shell` scope (don't change landing page tokens):
  - `--ds-bg`, `--ds-bg-elev`, `--ds-card`, `--ds-card-hover`, `--ds-border`, `--ds-border-strong`, `--ds-text`, `--ds-muted`, `--ds-accent` `#7c3aed`, `--ds-accent-soft` `#a78bfa`, `--ds-glow`.
- Utility classes: `.ds-card` (glass + hairline + inner highlight), `.ds-card-hover`, `.ds-stat-num` (tabular-nums, tracking-tight), `.ds-gradient-text`, `.ds-glow-ring`, `.ds-grid-bg` (dot grid), `.ds-noise`, `.ds-status-dot` (pulsing).
- Keyframes: `ds-pulse-dot`, `ds-shimmer`, `ds-fade-up`.

### 4. Scope guardrails
- Do NOT change route structure, server functions, data fetching, navGroups items, or any business logic.
- Do NOT touch landing page, marketing routes, or `LuxuryHero` / `SparkConstellation`.
- Other dashboard sub-routes (Analytics, History, Settings, etc.) will inherit the new shell automatically; their internal layouts stay as-is in this pass (can be polished in a follow-up if you want).
- Keep dark/light toggle behavior intact — the new dashboard look is dark-first; light mode keeps current tokens.

## Technical details

- Files changed:
  - `src/components/DashboardLayout.tsx` (presentation only)
  - `src/routes/dashboard.index.tsx` (presentation only)
  - `src/styles.css` (additive tokens + utilities under `.dashboard-shell`)
- No new dependencies. CSS animations only (project rule: no framer-motion).
- Sparklines built with pure CSS flex bars from `recentJobs` grouped by day — zero new libs.
- Accessibility: maintain focus rings (violet), aria-labels on icon buttons, `prefers-reduced-motion` disables shimmer/pulse.
- Performance: GPU-friendly transforms, no large background images, gradients via CSS only.

## Out of scope (ask if you want them next)

- Polishing each sub-route (Analytics, History, Brand Kit, etc.) to match.
- New onboarding tour for the redesigned shell.
- Light-mode equivalent of the premium dark dashboard.
