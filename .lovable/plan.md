# Landing Page: Million-Dollar Redesign

**Goal:** Cut bounce rate from 75% by transforming the landing page into a premium, conversion-focused experience that rivals top AI SaaS brands (Linear, Vercel, Runway, ElevenLabs, Cursor).

## What's wrong today
- Generic palette and flat icons → feels like a template
- Cluttered copy, weak hero hook → visitors don't grasp value in 3 seconds
- No real social proof or premium visual storytelling
- Mobile-first polish missing (you're viewing at 360px right now)

## Redesign scope (frontend/presentation only)

### 1. New visual system
- **Palette:** Deep obsidian (#0A0A0F) base, electric violet→cyan gradient accents (#7C3AED → #06B6D4), warm ivory text (#FAFAF9). Subtle aurora glow backgrounds.
- **Typography:** Switch headings to **Instrument Serif** (editorial luxury) + body **Geist Sans** (modern AI-tech). Tight tracking, large display sizes (clamp 48→96px).
- **Surfaces:** Glassmorphic cards with 1px gradient borders, layered noise texture, soft inner glow.

### 2. Hero section (above-the-fold)
- One-line punch headline: *"Turn one video into a month of content."*
- Subhead with concrete outcome (e.g., "AI repurposes your podcast, YouTube, or Zoom into 30+ posts in 60 seconds.")
- Dual CTA: "Start free — 3 repurposes" + "Watch 90s demo"
- **Animated 3D hero mockup:** floating glass dashboard preview with parallax depth + aurora glow behind
- Trust strip: "Trusted by 2,400+ creators" + brand logos row

### 3. Premium 3D icon system
- Replace flat lucide icons with custom **isometric 3D glass icons** (generated via imagegen, transparent PNG) for the 6 core features. Each icon: floating, soft shadow, gradient inner light.
- Hover: subtle tilt + glow intensification (CSS only, Worker-safe).

### 4. Sections (rebuilt, in order)
1. Hero
2. Logo trust strip
3. "How it works" — 3-step horizontal flow with 3D icons + connecting gradient line
4. Feature bento grid (6 tiles, mixed sizes, glass cards, 3D icons)
5. Live demo preview — autoplay muted video showing repurpose flow
6. Competitor comparison table (keep existing, restyle premium)
7. Testimonials — 3 highlighted quotes with avatar + outcome metric
8. Pricing teaser (link to /pricing)
9. FAQ (5 items, accordion)
10. Final CTA — big gradient block, single button

### 5. Copy rewrite
- Cut all filler, hype words, and redundant text
- Outcome-led headlines per section ("Ship a week of content in an afternoon")
- Concrete numbers everywhere (time saved, posts generated, hours back)

### 6. Mobile polish (priority — you're on 360px)
- Hero scales gracefully, CTA buttons full-width
- Bento collapses to single column with proper spacing
- Sticky mobile CTA bar appears after scroll

### 7. Micro-interactions (CSS only — Worker SSR compat)
- Fade-in-on-scroll for sections
- Gradient text shimmer on headline
- Card hover lift + border glow
- Aurora background slow drift

## Technical notes
- All changes in `src/routes/index.tsx` + new components under `src/components/landing/`
- 3D icons generated as transparent PNGs in `src/assets/landing/` (imagegen premium tier for quality)
- Fonts loaded via `<link>` in `src/routes/__root.tsx` (Instrument Serif + Geist), then registered in `@theme` in `src/styles.css`
- Add new design tokens (gradients, glass shadows, aurora) to `src/styles.css` — no hardcoded colors in components
- No framer-motion (per project memory) — CSS animations only
- SEO: keep existing meta, refresh H1 and description to match new copy

## Out of scope
- Backend, pricing logic, auth flows
- Dashboard or app interior pages
- New features — purely presentation upgrade

## Deliverable
A landing page that makes a creator land, scroll once, and reach for their credit card. Approve and I'll build it.