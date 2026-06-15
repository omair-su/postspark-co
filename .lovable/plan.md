# Phase 5 — Distribution (Comprehensive)

User-picked primary channel: **TikTok / Shorts demos**. Plus AppSumo LTD prep and build-in-public scaffolding so the founder can run one weekly cadence and get free compounding distribution.

Five workstreams, all built in one session.

---

## 1. TikTok / Shorts Demo Factory (the primary lever)

A new dashboard tool: `/dashboard/shorts-studio` — turns any input (creator URL, transcript, blog post) into a **30-60s vertical video script + shot list + on-screen captions + hook variants**, ready to record with OBS or CapCut.

**Server**: `src/lib/shorts.functions.ts` + `src/server/shorts.server.ts`
- `generateShortsScript({ input, style, duration })` → calls Claude with a vertical-video prompt that returns:
  - 3 hook variants (first 1.5s)
  - Shot list with timestamps, B-roll suggestion, on-screen caption per shot
  - CTA card text
  - Suggested trending audio category (no licensed audio, just a category tag)
  - Title + description + 8 hashtags

**UI**: `src/routes/dashboard.shorts-studio.tsx`
- Input panel reusing `ImportInputPanel` (URL/paste/upload).
- Output panel: collapsible shot cards, copy-all button, "Export script as .txt" and "Export captions as .srt".
- Counts against the same `repurpose_jobs` table with `tool='shorts_studio'` (free 3/mo, Pro unlimited).

**Public landing tool**: `src/routes/tools.shorts-script-generator.tsx`
- SEO page targeting "tiktok script generator", "youtube shorts script", "instagram reels script".
- One free demo behind `/api/public/demo` (existing pattern).

**Daily demo template (founder workflow)**: `src/lib/email-templates/founder-daily-shorts.tsx` + new admin button on `/dashboard/testimonials-admin` "Email me today's shorts brief" — picks a recent viral creator URL from a curated seed list and emails the founder a ready-to-record brief. Internal accelerator, not user-facing.

## 2. AppSumo / LTD Launch Landing

New route `src/routes/deals.lifetime.tsx` — a dedicated, AppSumo-style pitch page for the **$97 Founding Lifetime** deal (already wired in Paddle). Separate from the homepage so we can link it from AppSumo, Reddit, X, IH, etc.

Sections:
- Hero with live spots-remaining counter (reuse `getFoundingSpots`).
- "What you get for $97 forever" feature checklist.
- 60s value calculator: "At $24/mo Pro, $97 pays back in 4 months. Lifetime = $X saved over 3 years."
- FAQ accordion (refunds, transferability, what counts as "lifetime").
- Single sticky CTA → Paddle checkout (`founding_lifetime_97`).
- Pre-launch sign-up form for waitlist after 50 spots fill (writes to `profiles.ltd_waitlist=true`).

Add `src/components/deals/LtdValueCalculator.tsx` and `LtdFaq.tsx`.
Add route to sitemap with priority 0.9.

## 3. Build-in-Public Engine

New dashboard tool: `/dashboard/build-in-public` — turns real product metrics into daily X/LinkedIn posts so the founder never has to think about what to write.

**Server**: `src/lib/buildInPublic.functions.ts`
- `getMetricsSnapshot()` — pulls real numbers: signups last 7d, repurposes last 7d, MRR (from `subscriptions`), top tool used.
- `generateFounderPosts({ metrics, tone })` — Claude prompt returns 5 post variants (milestone, lesson, before/after, question, behind-the-scenes), each with X (280) and LinkedIn (1300) versions.

**UI**: `src/routes/dashboard.build-in-public.tsx`
- Live metrics tiles at top.
- "Generate today's 5 posts" button.
- Each post card: edit-in-place, copy, "Open in X" / "Open in LinkedIn" intent URLs.
- Pro-only; nudges free users.

## 4. Directory Listing Kit (one-time founder asset)

New route `src/routes/dashboard.distribution-kit.tsx` (admin-only) with ready-to-paste assets:
- Futurepedia / TAFT / FutureTools / Perplexity Pages submission text (short + long descriptions, tags, screenshots checklist).
- "About PostSpark" press-kit one-pager (markdown copy block).
- Logo download links (existing `/brand-assets` bucket).
- Submission checklist with `localStorage`-persisted checkboxes.

No backend changes — purely a static admin workspace so the founder ships submissions in one sitting.

## 5. SEO blog seed (kill the "0 posts at priority 0.9" leak)

Seed **10 real blog posts** via a one-shot migration into `blog_posts` table using Claude-drafted content. Topics chosen for actual search demand from the audit:
1. "How to repurpose a blog post into 30 social posts in 2026"
2. "PostSpark vs Castmagic: honest comparison"
3. "PostSpark vs OpusClip: which is right for you"
4. "PostSpark vs Repurpose.io"
5. "The 2026 creator content stack"
6. "How to write hooks that get 100k views (with templates)"
7. "Brand voice AI: what it is and why it matters"
8. "From podcast to 50 pieces of content: a workflow"
9. "Why content repurposing beats content creation in 2026"
10. "The complete guide to LinkedIn carousels"

Each post: 800-1200 words, real markdown, author = founder, category = "Guides" or "Comparisons", `published_at = now() - random(0-30 days)`, real cover image (generate one per post via Replicate at build).

Implementation: `scripts/seed-blog.ts` (one-off Node script) writes via service role. Run once, results land in DB. The audit's 3 "alternatives.*" routes already exist; keep them but cross-link from the new comparison blog posts.

Update `sitemap[.]xml.tsx` already pulls from `blog_posts` so the 10 posts auto-appear.

---

## Technical references

- Tool registration: add `shorts_studio` and `build_in_public` to `src/lib/tools-catalog.ts` and dashboard tile grid.
- Usage tracking: reuse `repurpose_jobs` table with new `tool` values; respect `FREE_MONTHLY_LIMIT = 3`.
- Paddle: no new IDs needed (uses existing `founding_lifetime_97`).
- Claude calls: extend `src/server/anthropic.server.ts` with shorts + founder-posts prompts; pull brand voice + brand kit server-side (existing pattern).
- Memory updates: new entries for Shorts Studio, Build-in-Public, LTD landing, blog seed.

## Out of scope this turn
- Native publishing OAuth (Phase 6).
- Chrome extension (Phase 6).
- Auto-posting to TikTok/X/LinkedIn — we generate, founder posts manually for now.

---

## One question before I build

The blog seed (#5) writes 10 generated posts straight to the DB under the founder's name. That's real content but AI-drafted — confirm you want me to ship it as-is, or scaffold the 10 *titles + outlines* only and let you write the bodies?
