# Pricing & Gallery — Landing-Grade Premium Rebuild

Both pages still use the old v3 shell (dark slate nav/footer, off-brand type, low-contrast cards). They will be rebuilt on the exact v4 landing system so the whole marketing site feels like one product.

## Shared design system (from the new landing page)

- Same shell: v4 nav + v4 footer + sticky CTA, so header/footer match `/` pixel for pixel.
- Same palette: obsidian base with violet mesh, `#7C3AED` primary, `#A78BFA` accents, purple-tinted borders, gradient headline text.
- Same typography: Geist display for headings (tight tracking, large clamp sizes), Inter for body, uppercase micro-labels.
- Same motion: fade-in-up on scroll, floating orbs/mesh drift, marquee, card hover lift + purple glow, reduced-motion respected.

## Pricing page

1. Hero: violet mesh + drifting orbs, "Pricing" micro-label, gradient headline, subhead, trust row (no card required, cancel anytime, 7 platforms).
2. Plan cards: the landing pricing block (monthly/annual toggle with savings pill, Pro highlighted with glow ring, Free / Pro $24 / Agency $49) plus a Founding Lifetime $97 card with a scarcity counter.
3. Comparison table: full feature matrix with sticky header, grouped rows (Create, Publish, Brand, Team), check/dash icons, mobile turning into per-plan stacked cards.
4. Value reinforcement: ROI strip (hours saved, cost vs. hiring a freelancer), logo/model marquees, 3 testimonials with plan badges.
5. FAQ: landing FAQ accordion extended with billing questions (trials, refunds, seats, cancellation, upgrades).
6. Final CTA band + footer, matching the landing mesh CTA.

## Gallery page

1. Hero: same mesh treatment, gradient headline, live counters (creations, formats, creators).
2. Sticky filter bar: glass pill tabs (Community / Photos / Videos), source chips, search field with purple focus ring — styled like the landing chips, not the old dark selects.
3. Community grid: masonry-ish cards with format chips, author, view count, hover lift + glow, gradient border on featured.
4. Media grid with big mobile thumbnails: 1 column full-bleed on mobile (16:9 tall cards, rounded 20px), 2 columns on tablet, 3–4 on desktop. Each tile gets staggered scroll-in scale/fade, hover/tap zoom on the image, gradient scrim with attribution, and videos autoplay muted preview on hover (tap-to-play on mobile).
5. Lightbox: full-screen preview with blurred backdrop, arrow/swipe navigation, download + attribution actions.
6. Skeletons switch from grey blocks to the shimmering gradient loader; infinite scroll keeps working; empty states get an illustrated card.
7. Final CTA + v4 footer.

## What's still missing to reach "million-dollar AI company" level

- Social proof density: real named testimonials with avatars/results, customer logos, review-platform ratings.
- Pricing psychology: interactive ROI calculator, per-seat Agency pricing preview, plan recommender quiz.
- Gallery depth: category taxonomy, "remix this in PostSpark" one-click deep link from any gallery item, creator profile pages, weekly featured picks.
- Trust: security/privacy badges, uptime status link, refund guarantee seal.
- Performance/SEO: `Product`/`Offer` and `ImageObject` JSON-LD, responsive `srcset` for gallery images, blur-up placeholders, per-page OG images.

## Technical notes

- Reuse `Lp4Nav`, `Lp4Footer`, `Lp4StickyCta`, `Lp4Pricing`, `Lp4Faq`, `Lp4FinalCta`, `useFadeIn`, `delay` from `src/components/landing/v4/`; drop `NavV3`/`FooterV3`/`PricingV3`/`FAQV3` usage from `src/routes/pricing.tsx` and `src/routes/gallery.index.tsx`.
- Wrap both routes in the `lp4` class so all landing animation/token classes apply.
- New CSS only as additive `lp4-*` utilities in `src/styles.css` (gallery tile, lightbox, sticky compare header). No dashboard token changes.
- Pricing numbers keep coming from `src/lib/pricing.ts`; feature matrix rows stay consistent with `src/lib/plans.ts` and the enforced 3/month free limit.
- Gallery data flow (`getGalleryFeed`, `getPublicStockFeed`, attribution modal, infinite scroll) is unchanged — presentation only.
- Update head metadata on both routes with page-specific OG/Twitter copy and keep canonicals.
