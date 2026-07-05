# Million-Dollar Redesign — Full App Sweep

This is a large multi-phase redesign. I'll ship it in ordered waves so you can review as we go rather than one giant unreviewable dump.

---

## Wave 1 — Foundation (design system + logo + fonts)

**Goal:** every interior page instantly inherits the new look.

1. **New Logo** — Replace the thin glassy spark with a solid, confident mark in the style of Claude / Perplexity / Gemini / Apple: a filled rounded-square (or soft-squircle) with a single bold spark glyph, no glow, no orbiting dots. Generate as a premium PNG + inline SVG. Update:
   - `src/components/PostSparkLogo.tsx` (rewrite mark, keep API)
   - `src/components/landing/v3/PostSparkMark.tsx` (point to new asset)
   - `public/favicon.svg`, `src/assets/postspark-icon.png`
2. **Typography** — Load **Geist** (headings) + **Inter** (body) via `<link>` in `src/routes/__root.tsx`; register `--font-display: Geist` and `--font-sans: Inter` in `src/styles.css` `@theme`. Remove old font-face declarations.
3. **Color tokens** — Refine the interior surface palette to the soft off-white + subtle tint used by modern AI apps (`#FAFAF9` base, `#F5F5F4` panels, `#0F172A` ink, brand `#7C3AED` accent used sparingly). Keep landing v3 palette intact; update `--background`, `--card`, `--muted`, `--border` tokens.
4. **Sidebar + Dashboard chrome** — Apply new tokens to `DashboardLayout.tsx`, sidebar, top bar, page headers. Tighter type scale, Geist headings.

## Wave 2 — Auth pages (Ayrshare-style)

Rebuild `/auth` (sign-in) and sign-up in the centered card layout from your screenshot:
- Centered white card on brand gradient background (our purple, not theirs)
- New logo above card, "Sign in to your account" heading in Geist
- Email + Password inputs, "Continue" primary button
- OR divider, Google + (optional) Apple/GitHub buttons
- Terms/Privacy/Docs footer links
- Same for `/auth/signup`, `/auth/reset-password`

## Wave 3 — Unified pricing on every tool page

- Extract `PricingSection` from landing v3 into a shared `<PremiumPricing />`
- Replace old pricing blocks in `SegmentPage.tsx` and every `src/routes/tools.*.tsx` landing
- Keep Free / Pro $19 / Agency $49 / Founding $97 in sync

## Wave 4 — Premium per-tool landing pages

For each tool, rebuild the marketing page in v3 style modeled on the top competitor:
| Tool                | Modeled after           |
|---------------------|-------------------------|
| AI Image Studio     | OpenArt / Midjourney    |
| Thumbnail Generator | Canva / Thumbnail.ai    |
| Carousel Maker      | Taplio / AuthoredUp     |
| Shorts Studio       | Opus Clip / Submagic    |
| LinkedIn Composer   | Taplio                  |
| Repurpose Studio    | Repurpose.io            |
| AI Humanizer        | Undetectable.ai         |
| Reply Generator     | MagicReply              |
| Blog → Newsletter   | Beehiiv                 |

Each gets: hero with product screenshot mock, feature bento, how-it-works, testimonials, FAQ, unified pricing, final CTA. Copy is premium, benefit-first, positions the model tier we use.

## Wave 5 — Blog + Gallery + remaining surfaces

- Blog list + post page: Geist headings, editorial layout, new author card
- Gallery: card grid on soft surface, new filters styled with tokens
- Settings, billing, onboarding: same token pass

---

## Technical notes

- Zero business-logic changes — only visual/token/copy/layout
- New logo art generated via `imagegen` (premium tier, transparent PNG)
- Tailwind v4: all font/color changes go in `src/styles.css` `@theme`
- Font loading via `<link rel="preconnect">` + stylesheet in root head (never `@import` a URL in styles.css)
- Old fonts and old logo assets deleted only after all references migrated

---

## What I need from you before starting

**Scope confirmation** — this is 5+ waves and ~40–60 files. Do you want me to:

**A.** Ship all 5 waves back-to-back in one long run (fastest, biggest single diff)
**B.** Ship Wave 1 + Wave 2 first (new logo + fonts + tokens + auth), you review, then continue
**C.** Different order — tell me which wave matters most and I start there

Reply "A", "B", or "C + your priority" and I'll begin immediately.
