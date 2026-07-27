## Problem

In light mode, many dashboard/tool pages still render dark cards because components hardcode dark hex backgrounds (e.g. `bg-[#14142B]`, `bg-[#17152A]`, `bg-slate-900/800`, `from-slate-900`, `bg-[#0B0A14]`). The existing light-mode CSS block only remaps *light* utility classes (`bg-white`, `bg-slate-50`, etc.) and dashboard-shell tokens — hardcoded dark hex classes fall through unchanged. Result: black cards with dark text = invisible content across Brand Kit, Brand Voice, Shorts Studio/Series/Editor, LinkedIn, Facebook, Publishing, Hook Lab, SEO Blog, Referrals, Deals, Spark Copilot, Connected Accounts, and more.

Dark mode must remain 100% untouched.

## Approach

Purely additive CSS in `src/styles.css`, scoped to `html:not(.dark)`. No component edits — the fix must cover every current + future page that reaches for these dark hex utilities.

### 1. New light-mode card token palette

Add to the `html:not(.dark) .dashboard-shell` token block:

```
--ds-card-gradient: linear-gradient(135deg, #E3EEF9 0%, #FFFFFF 45%, #E6F2FF 100%);
--ds-card-gradient-hover: linear-gradient(135deg, #DCE9F6 0%, #FFFFFF 45%, #DFEEFC 100%);
--ds-upgrade-bg: #D3E3FD;
--ds-upgrade-fg: #041E42;
--ds-heading: #1F1F1F;
```

### 2. Remap hardcoded dark hex backgrounds → ice-blue card gradient

New selector group (light-mode only) that catches every dark hex background currently used across the app and replaces it with the ice-blue → white → ice-blue gradient the user specified:

```
html:not(.dark) .bg-\[\#14142B\],
html:not(.dark) .bg-\[\#17152A\],
html:not(.dark) .bg-\[\#0B0A14\],
html:not(.dark) .bg-\[\#0F172A\],
html:not(.dark) .bg-\[\#111827\],
html:not(.dark) .bg-\[\#1A1A2E\],
html:not(.dark) .bg-\[\#1E1B4B\],
html:not(.dark) .bg-slate-900,
html:not(.dark) .bg-slate-800,
html:not(.dark) .bg-gray-900,
html:not(.dark) .bg-gray-800,
html:not(.dark) .bg-neutral-900,
html:not(.dark) [class*="bg-[#14"],
html:not(.dark) [class*="bg-[#17"],
html:not(.dark) [class*="bg-[#0B"] {
  background: linear-gradient(135deg,#E3EEF9 0%,#FFFFFF 45%,#E6F2FF 100%) !important;
  color: #1F1F1F !important;
  border-color: rgba(4,30,66,0.08) !important;
  box-shadow: 0 1px 3px rgba(4,30,66,0.05), 0 8px 24px -12px rgba(107,78,255,0.08) !important;
}
```

Add matching rules for:
- `from-slate-900`, `from-[#0B0A14]`, `from-[#14142B]`, `to-slate-900`, `via-slate-900` gradient utilities → same ice-blue gradient stops.
- `text-white`, `text-slate-100/200/300`, `text-white/70`, `text-white/60` **when a descendant of a remapped card** → force `#1F1F1F` for body, `#4B5563` for muted. (Keep the existing `.ds-canvas`-scoped white-preservation rules for buttons intact so LinkedIn/Instagram/Navbar CTAs stay white — the new selectors intentionally do NOT touch `.ds-canvas .bg-[#...]` brand-color buttons like `bg-[#0A66C2]`, only neutral dark surfaces.)

### 3. Upgrade pill styling

Add utility class + remap so the "Upgrade" chip everywhere in light mode uses:
- background `#D3E3FD`
- text/icon `#041E42`

Selector targets existing upgrade CTAs (`.ds-cta-pill`, `[data-upgrade-pill]`, plus common inline `bg-gradient-to-r from-[#7C3AED]` when inside header/plan badges — only in light mode).

### 4. Headings

`html:not(.dark) h1, h2, h3 { color: #1F1F1F; }` inside `.ds-canvas` / dashboard-shell, so heading contrast is enforced regardless of any leftover `text-white` on the element.

### 5. Verification

- `bun run test:visual -- theme` (existing Playwright suite covers light+dark landing/auth/pricing; add one snapshot per: `/dashboard/brand-kit`, `/dashboard/brand-voice`, `/dashboard/shorts-studio`, `/dashboard/publishing`, `/dashboard/linkedin`).
- Manual browser sweep of the 16 screenshotted routes at 360×647 (current viewport) to confirm cards render as ice-blue → white gradient and text is legible.
- Toggle back to dark → visually diff against baseline; must be pixel-identical (all new rules are `html:not(.dark)`-scoped, so this is structural).

## Files touched

- `src/styles.css` — one appended block (~120 lines) at the end of the existing PREMIUM LIGHT MODE section. No component files modified.

## Out of scope (for follow-up if you want a "million-dollar" light polish pass)

Separate future phase, not part of this fix:
1. Replace hardcoded hex utilities in the ~30 offending components with semantic `ds-card` / `ds-card-hero` classes so we can retire the override layer.
2. Introduce a light-mode-specific hero mesh gradient (Gemini-style animated aurora) on marketing pages.
3. Add tinted category accents per tool card (Shorts=rose, Brand Kit=violet, LinkedIn=blue) as a 2px top border on the ice-blue base.
4. Micro-interactions: 200ms card lift + shadow bloom on hover, subtle noise texture on card surface.
5. Typography tune: switch light-mode headings to `-0.02em` tracking + `font-feature-settings: "ss01","cv11"` for a more editorial feel.

Confirm and I'll ship step 1–5 above; the polish phase can follow.