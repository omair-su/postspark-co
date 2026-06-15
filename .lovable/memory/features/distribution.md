---
name: Distribution (Phase 5)
description: Shorts Studio, Build-in-Public engine, AppSumo LTD landing, Distribution Kit, blog seed
type: feature
---
# Phase 5 — Distribution

## Shorts Studio
- Server: src/server/shorts.server.ts + src/lib/shorts.functions.ts
- UI: /dashboard/shorts-studio (Pro unlimited, free 3/mo)
- Public SEO landing: /tools/shorts-script-generator
- Output: 3 hook variants, shot list with timestamps, on-screen captions, CTA, hashtags, audio category. Exports .txt and .srt.
- Counts against repurpose_jobs with tool='shorts_studio'.

## Build-in-Public Engine
- Server: src/server/buildInPublic.server.ts + src/lib/buildInPublic.functions.ts
- UI: /dashboard/build-in-public (Pro only)
- Pulls real metrics: signups/repurposes last 7d, total users, MRR from active subs, top tool used.
- Generates 5 post archetypes (milestone/lesson/before-after/question/BTS) each with X (≤280) + LinkedIn (≤1300) variants.
- Has "Post →" intent links to X and LinkedIn.

## AppSumo / LTD Landing
- Route: /deals/lifetime (deals.lifetime.tsx)
- Live spots counter via getFoundingSpots (founding_lifetime_97 subs vs 50 cap).
- LtdValueCalculator: slider 1-10 years showing savings vs $24/mo.
- LtdFaq: 7 questions including refunds, transferability, lifetime definition.
- Direct Paddle checkout for founding_lifetime_97.

## Distribution Kit (admin)
- Route: /dashboard/distribution-kit (admin-only via has_role)
- Pre-written short/long descriptions, tags, screenshot checklist.
- 10 directories with submit links + localStorage-persisted checkboxes.

## Blog Seed
- Script: scripts/seed-blog.ts (idempotent upsert on slug)
- 10 published posts seeded under postspark-team author.
- Topics: repurposing how-to, 3 competitor comparisons (Castmagic/OpusClip/Repurpose.io), 2026 creator stack, hook templates, brand voice, podcast workflow, repurposing vs creation, LinkedIn carousels.

## Sitemap updates
- Added /tools/shorts-script-generator (0.9) and /deals/lifetime (0.9) to STATIC_ROUTES.
- Blog posts auto-appear via existing dynamic query.
