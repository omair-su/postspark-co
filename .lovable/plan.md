# Dashboard Premium Polish — Pass 3

Goal: take the dashboard from "dark + glassy" to a true high‑ticket AI console — Linear × Vercel × Arc × Anthropic feel — and propagate that quality through every inner page so nothing breaks the illusion.

## What's working now
- Dark canvas, floating orbs, glass cards on Home + History
- Premium pill CTA, sparkline + latency stat, recent outputs strip
- Sidebar with luxe nav, glass header with ⌘K pill + AI online chip

## What still feels short of "$100k"
1. **Inner tool pages are inconsistent** — Repurpose, Hook Lab, Image Studio, Carousel, Thumbnail, SEO Blog, Brand Kit, Brand Voice, Calendar, Analytics, Settings still use the old cream/shadcn cards on the new dark canvas. The shell is premium, the rooms inside aren't.
2. **Sidebar is functional but not iconic** — no active-route halo, group labels are quiet, the brand switcher / user card don't feel collectible.
3. **Header is static** — no live workspace context (current plan usage, today's generations, sync status, notifications), no global "New" action.
4. **Home hero lacks signal** — welcome line is generic; missing a real "command bar" (ask-anything input that routes to the right tool) and a live AI status strip (model, region, latency).
5. **Stat tiles are flat** — numbers without context (vs last week, % of plan, ETA to limit), no micro deltas, no hover detail.
6. **No "Today" rail** — premium consoles always show today's queue/agenda/streak in one glance.
7. **Motion is too quiet** — no entrance choreography, no skeleton shimmer matching the dark theme, no subtle parallax on orbs, no number count-ups.
8. **Empty states are plain** — first-time users see blank lists instead of cinematic onboarding tiles.
9. **Typography rhythm** — single weight/scale across cards; no editorial display moments, no tabular-nums on metrics consistently.
10. **Iconography** — generic lucide strokes; premium apps pair icons with subtle gradient discs / duotone treatment.
11. **Light mode of the dashboard** is unstyled — if a user toggles, it falls back to bare shadcn.
12. **Loading & error states** are default skeletons / red text — should be themed.

## Plan (UI/presentation only, no business logic)

### A. Propagate the luxe shell into every tool page
For each route under `src/routes/dashboard.*`:
- Wrap top-level containers in `.ds-card` / `.ds-card-hero` instead of plain `Card`.
- Replace page H1 blocks with a standardized **PageHeader** component: eyebrow chip + gradient display title + subtitle + right-aligned action slot.
- Convert primary action buttons to `.ds-cta-pill`; secondary to a new `.ds-cta-ghost` (hairline border, subtle hover glow).
- Tabs/segmented controls re-skinned with glass background + violet active indicator.
- Form inputs get a `.ds-input` treatment (dark glass, violet focus ring) — only inside `.dashboard-shell` so light tool surfaces still work where intentional.

Routes to touch (presentation only): repurpose, hook-lab, image-studio, carousel, thumbnail, seo-blog, podcast, humanizer, reply-generator, templates, calendar, brand-kit, brand-voice, analytics, agency-analytics, team, referrals, settings.

### B. Sidebar upgrades (`DashboardLayout.tsx`)
- Active item gets a left violet bar + soft outer glow + slight icon gradient.
- Group labels: smaller, brighter, with a thin gradient underline.
- Brand switcher promoted to a top "workspace pill" with avatar disc + chevron, opening a styled popover.
- User card at bottom: avatar with violet ring, plan chip (Free/Pro/Agency) inline, "Manage" → settings.
- Collapsed/mini state for desktop (icon-only) toggled by a header button — saves screen space and signals power-user energy.

### C. Header → Command bar
- Replace the ⌘K pill with a real centered search/command input (still opens the existing palette).
- Right side adds: today's usage progress chip (e.g. "12 / 100 this month"), notifications bell with dot, "New" gradient button with dropdown of top 4 actions.
- "AI online" chip becomes a live status with model name (Claude Sonnet 4.5) and a tiny latency number.

### D. Home redesign — "Command Center v2" (`dashboard.index.tsx`)
- **Hero**: greeting + a real **AskBar** ("What do you want to repurpose today?") with smart suggestions chips below that route to the matching tool (Repurpose, Hook Lab, Image, SEO, Carousel).
- **Today rail** (new): 3 compact tiles — Today's generations, Streak day, Next scheduled post (from calendar) — left-aligned with monospace times.
- **Stat tiles v2**: each tile shows big number (tabular-nums, count-up on mount) + delta vs last 7 days + a tiny CSS sparkline. Usage tile shows ring progress around the number.
- **Tool grid**: 6–8 premium tiles (icon disc + gradient hover + shortcut hint) for all major tools instead of just 4.
- **Recent Outputs**: keep, but add per-row hover actions (copy, open, favorite) and platform badges with brand-tinted glow.
- **Activity + Streak + Referral**: collapse into a single 3-column "Momentum" row with consistent card chrome.
- **Empty states**: cinematic illustration tile + 1 primary CTA when a section has no data yet.

### E. Motion & micro-interactions
- CSS-only entrance: stagger fade/translate on hero → today rail → stats → tools → recent.
- Number count-ups via small CSS-counter trick or a tiny pure-React hook (no framer-motion, per project rule).
- Orb parallax: very subtle mouse-follow via CSS variables updated in a passive listener.
- Skeleton shimmer themed to dark canvas (`linear-gradient` over `.ds-card`).
- Respect `prefers-reduced-motion` everywhere.

### F. Typography & icon system
- Add `.ds-display` (tight tracking, gradient text) for hero numbers/titles.
- All metric numbers: `tabular-nums`, weight 600, tracking -0.02em.
- Wrap lucide icons in `.ds-icon-disc` (10px radius, 1px hairline, inner highlight, optional gradient fill for primary actions).

### G. Theming hygiene
- Audit any leftover `text-white`, `bg-black/…` literals in dashboard routes → replace with `.ds-*` utilities or semantic tokens.
- Add a light-mode variant of `.dashboard-shell` tokens so the theme toggle still produces a polished surface (cream-cream-glass instead of bare shadcn).
- Themed toast + dialog skins inside the dashboard scope only.

### H. Quality bars
- Visual QA at desktop 1440, tablet 820, mobile 390 for: Home, Repurpose, Image Studio, History, Analytics, Settings.
- Lighthouse a11y ≥ 95 on the dashboard home (focus rings, contrast on glass surfaces).

## Out of scope (ask if you want them next)
- New onboarding tour for the redesigned shell
- Real-time websocket "live activity" feed
- Dashboard widgets the user can rearrange (drag-to-reorder)
- New illustrations / custom 3D assets for empty states beyond CSS-only treatments

## Files this plan will touch (presentation only)
- `src/styles.css` — new tokens (`.ds-input`, `.ds-cta-ghost`, `.ds-icon-disc`, `.ds-display`, dashboard light tokens, skeleton shimmer, entrance keyframes)
- `src/components/DashboardLayout.tsx` — sidebar + header upgrades, mini-collapse
- `src/components/dashboard/PageHeader.tsx` (new) — standardized page header
- `src/components/dashboard/AskBar.tsx` (new) — hero command input on Home
- `src/components/dashboard/StatTile.tsx` (new) — reusable premium metric tile
- `src/components/dashboard/EmptyState.tsx` (new)
- `src/routes/dashboard.index.tsx` — Command Center v2
- All `src/routes/dashboard.*.tsx` tool pages — swap to PageHeader + `.ds-card` chrome
- No server functions, no schema, no business logic changes
