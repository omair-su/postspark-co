# PostSpark Conversion Rebuild — Execution Plan

This is a large multi-page rebuild. I'll execute it in 3 shippable phases so you can review progress and we don't ship a half-finished site. Confirm the phasing (or tell me to do it all in one shot) before I start.

## Design System (applied globally)

Add tokens to `src/styles.css`:
- Colors: white bg, `#0F172A` ink, `#7C3AED` primary, `#A78BFA` light, `#F5F3FF` ultra-light, `#C9A87C` gold, `#64748B` muted, `#E2E8F0` border, `#F8FAFC` section, `#10B981` success.
- Fonts: Syne (800/600) for headings, Inter (400/700) for body. Loaded via Google Fonts `<link>` in `__root.tsx`.
- Component classes: `.ps-btn-primary`, `.ps-btn-secondary`, `.ps-card`, `.ps-label`, `.ps-dot-grid`, `.ps-fade-in` (IntersectionObserver-based, single tiny hook `useReveal`).
- Strip Three.js / framer-motion-heavy hero remnants. No animations except CSS hover + fade-in-on-scroll.

## Phase 1 — Homepage rebuild + working hero demo (ship first)

Replace `src/components/landing/HeroAICM.tsx` and rebuild the section composition in `src/routes/index.tsx`.

New components under `src/components/landing/v2/`:
1. `Hero.tsx` — two-column (55/45), pain-validated headline, trust row, dot-grid bg.
2. `HeroDemoWidget.tsx` — **the live demo**. Textarea + 3 toggle chips (Tweet/LinkedIn/Newsletter) + Generate button. Calls the existing `/api/public/demo` endpoint (already wired to Claude). Renders tabs with copy buttons + "Create free account" upsell. Reuses existing rate-limit/IP-hash logic — no backend changes needed.
3. `SocialProofBar.tsx` — honest version (no fake numbers).
4. `PainSection.tsx` — red vs green cards.
5. `WhoFor.tsx` — 2x2 buyer cards linking to segment pages.
6. `HowItWorks.tsx` — 3 steps + 12-feature grid.
7. `PricingV2.tsx` — monthly/annual toggle, 3 tiers, "PostSpark replaces" stack.
8. `FoundingMember.tsx` — replaces all fake testimonials.
9. `FAQv2.tsx` — 5 accordion Qs.
10. `FinalCTA.tsx` — deep purple band.
11. `FooterV2.tsx` — 4-column footer.

Delete from homepage render: `TestimonialsSection`, `TrustedBySection` fake-number version, `BeforeAfterSection`, `PremiumFeaturesSection`, `LandingDemoSection` (folded into hero), `FeaturedOnBar`, `IntegrationsLogoBar`. Keep old files on disk for now to avoid breaking other routes; only swap what `index.tsx` imports.

Update homepage `head()` JSON-LD (Organization + SoftwareApplication + FAQPage with the 5 new Qs).

## Phase 2 — Segment pages (8 routes)

Shared template: `src/components/segment/SegmentPage.tsx` that takes `{ hero, pains[3], solutions[3], workflow[], faqs[] }` and renders Hero (with `HeroDemoWidget`) → Pains → Solutions → Workflow → PricingV2 → FinalCTA → FooterV2.

New route files (each ~80 lines of config calling `<SegmentPage>`):
- `src/routes/for.agencies.tsx` (replace existing)
- `src/routes/for.creators.tsx` (replace existing)
- `src/routes/use-cases.linkedin-ghostwriters.tsx`
- `src/routes/use-cases.podcast-to-social.tsx`
- `src/routes/use-cases.youtube-to-linkedin.tsx`
- `src/routes/use-cases.content-repurposing-agencies.tsx`
- `src/routes/alternatives.chatgpt-for-content-repurposing.tsx`
- `src/routes/alternatives.jasper-vs-postspark.tsx`

Each: unique `<title>` ≤60, meta description ≤160, single H1, canonical, OG tags, SoftwareApplication+FAQPage JSON-LD.

Update `src/routes/sitemap[.]xml.tsx` to include all 8 new URLs + remove dead ones.

## Phase 3 — Navbar, polish, cleanup

- Rewrite `src/components/Navbar.tsx`: white sticky, Features/How It Works/Pricing/Blog center, "Log In" + "Start Free →" right, mobile hamburger.
- Verify mobile (360px) — CTAs above fold, no overflow.
- Run SEO scan, fix any new findings.
- Delete unused: `PremiumHeroScene`, `LuxuryHero`, `SparkConstellation`, `MagneticCursor`, `HeroSection`, `HeroCompareSlider`, old `TestimonialsSection`, `BeforeAfterSection`.

## Out of scope (confirm if you want these too)

- Building the `/blog` content — only linking to existing blog routes.
- New imagery / OG image generation (none of the spec required images; safe to leave OG without image per project SEO rules).
- Backend changes — the existing `/api/public/demo` endpoint already does exactly what the hero widget needs (Claude-powered, 3/day per IP). I'll reuse it.
- Paddle/pricing logic — only the visual pricing cards change; checkout buttons keep the existing `usePaddleCheckout` flow.

## Technical Details

- All new components are presentation-only; no DB migrations, no new server fns.
- IntersectionObserver hook in `src/hooks/useReveal.ts` (12 lines, no library).
- Syne font loaded once in `__root.tsx` head links alongside existing Instrument Serif preconnect.
- Dot grid via inline CSS gradient, not image.
- Annual toggle is pure client state; Paddle priceId switch uses existing env vars.
- Mobile breakpoints: stack at <768px; demo widget moves below hero text on mobile.

## What I need from you

**Approve the 3-phase shipping order**, or say "do it all at once" and I'll ship everything in one large batch (slower to first preview but one review cycle).
