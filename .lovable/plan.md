# PostSpark Rescue Plan — From Zero to First Paying Users

You don't have a product problem. You have a **checkout, trust, and distribution** problem. The audit found that your product is feature-complete and well-architected, but three things are silently killing every conversion attempt. We fix those first, then build the loops that bring users in.

> **Brutal headline finding:** the Paddle price IDs in `PricingV2.tsx` and `dashboard.billing.tsx` are placeholder strings (`"pro_monthly_trial"`, etc.), not real Paddle IDs (`pri_01...`). If this is the case, **no one can pay you even if they want to**. This is hypothesis #1 for zero conversions.

---

## Phase 0 — Stop the bleed (THIS WEEK, ~2 days)

These are P0 fixes. Without them nothing else matters.

1. **Verify and fix Paddle checkout** — Audit every `priceId` passed to `usePaddleCheckout`. Replace placeholder strings with real Paddle `pri_01...` IDs. Manually run the Pro checkout flow end-to-end in production and confirm a test charge succeeds.
2. **Fix the email-signup dead end** — `signup.tsx` currently redirects email signups to `/login` after confirmation. Redirect straight to `/dashboard` (or `/onboarding`) so momentum isn't lost.
3. **Fix trust-eroding inconsistencies**:
   - Hero demo widget says "3 free demos/day" but pricing says "10/month" — make them match.
   - Changelog has `date: "May 7, 2026"` (future-dated) — set to real release dates.
   - Remove `/funnel` (public live conversion stats) from the sitemap; gate it admin-only.

## Phase 1 — Landing page refinement (NO rebuild, 3 days)

Verdict: **refine, do not rebuild**. The structure (Hero → Pain → WhoFor → HowItWorks → Pricing → FAQ) is sound. What's missing is **proof and specificity**.

1. **Rewrite the hero headline** with a concrete number. Current "Stop Rewriting the Same Content for Every Platform" is generic. Try: *"Turn 1 blog post into 30 platform-ready posts in 90 seconds."* Shorten CTA from "Start Repurposing Content for Free" → **"Start Free"**.
2. **Replace SocialProofBar copy** ("Join early creators…" = admission of smallness). Wire the existing `LiveCounter` component with a real metric (e.g. "8,400 content pieces generated this month") pulled from the DB.
3. **Add a real testimonials section** between PricingV2 and FoundingMember. Component already exists (`TestimonialsSection.tsx`), it just isn't imported. Seed with 3–5 real quotes (see Phase 4 for how to get them); **kill the hardcoded "4.9 · 127 reviews"** — that's a credibility bomb.
4. **Make Founding Member real** — render a live counter ("63 of 100 spots claimed") from a Supabase count of paid subscribers. Without a counter, the urgency is theatre.
5. **Move the hero demo output below the fold** so visitors see a real AI result on the page, not just a form.

## Phase 2 — Pricing & free-tier rework (2 days)

The audit confirms the 2026 reality: **10 free repurposes/month is too generous** — casual creators get all the value they need and never feel the wall. Competitor research recommends shifting from "credits forever" to "trial drives intent."

Proposed structure (please confirm before we build):
- **Starter (Free):** 3 repurposes/month + watermark on images. Enough to feel value, not enough to live on.
- **Pro:** $24/mo (was $19) — unlimited repurposes, no watermark, Brand Voice, all image models.
- **Creator:** $59/mo — everything in Pro + team seat + scheduled publishing + API.
- **Founding deal:** First 50 paid sign-ups get **$97 Lifetime Deal** (one-time). Creates an evangelist cohort, generates non-dilutive cash, and gives you real testimonials in 2 weeks.

Add a soft "you've used 2/3" upgrade nudge **before** the wall, not after generation completes.

## Phase 3 — Email infrastructure (the single biggest growth lever, 3 days)

Today PostSpark has exactly **one email route** (unsubscribe). Users sign up and never hear from you again. This is the #1 reason free → paid is broken. Build (using your existing Lovable Emails infra):

- **Day 0:** Welcome + "your first repurpose in 60 seconds" (link straight into a pre-filled studio).
- **Day 2:** "Here are 3 things creators do with PostSpark" (real examples).
- **Day 5:** Brand Voice teaser ("Make AI sound like *you*") → Pro upsell.
- **Day 7:** Founding Member offer ($97 LTD or trial).
- **Usage triggers:** at 2/3 free credits → "you're almost out, here's what Pro unlocks."
- **Trial-end:** 24h reminder + offer.

## Phase 4 — Real social proof campaign (1 week, ongoing)

1. **Email every existing free user**: "Use PostSpark Pro free for 2 months in exchange for a 60-second video testimonial with your handle." Even 5 real ones replaces the fake fallbacks.
2. **Seed the public Gallery** with 20–30 high-quality examples from your own use — currently it's empty, which makes the brand look unused.
3. **Activate referrals UX**: pre-written tweets, LinkedIn templates, share-image cards. Right now users get a link and no message — nobody shares friction.
4. **Post-generation "Share my result"** button → tweet card "I turned 1 post into 30 with @PostSpark" — viral loop that's currently missing.

## Phase 5 — Distribution (parallel to everything, weeks 2–6)

Three channels, ranked by 2026 ROI for solo SaaS:

1. **TikTok / Shorts demos** — 30–60s screen recordings of PostSpark turning a known creator's video into a thread/carousel. Post daily. This is the #1 lever in 2026 for creator tools.
2. **AppSumo / LTD launch** — list the $97 lifetime deal. Buys you 500+ users, $20k+ non-dilutive, and an army of feedback givers.
3. **Build-in-public on X/LinkedIn** — daily founder posts about prompt engineering, AI quality, before/after outputs. Be your own best case study.

Plus quick wins: list on **Futurepedia, There's An AI For That, FutureTools, Perplexity Pages**; publish **10 real blog posts** (your blog is at sitemap priority 0.9 with **zero posts** — that's actively hurting SEO), and write 3 honest "PostSpark vs Castmagic/OpusClip/Repurpose.io" comparison pages with real screenshots.

## Phase 6 — Product gaps to close next (week 3+)

In priority order, based on competitor analysis:

1. **Native publishing (Buffer / Typefully / X / LinkedIn OAuth)** — calendar today schedules to nowhere. This is the #1 reason creators churn from PostSpark to Buffer.
2. **Chrome extension** — "Repurpose this page" — every competitor has one; it's a distribution channel via Chrome Web Store.
3. **Connect Humanizer + Hook Lab + Image Studio into the Repurpose flow** as one-click steps, not separate islands.
4. **Brand Voice feedback loop** — thumbs up/down on outputs to fine-tune.
5. **Notion / Google Docs / Zapier import** — eliminate the manual paste step.

## Pages to kill or merge
- 23 unused `src/components/landing/v1` files — delete.
- 4 `dashboard.guided.*` routes — consolidate.
- 3 thin `features.*` pages — merge into one.
- `/funnel` public page — make admin-only.

---

## Technical references (file:line for the agent)

- Paddle IDs: `src/components/landing/v2/PricingV2.tsx` (priceId props), `src/routes/dashboard.billing.tsx:85`, `src/routes/dashboard.settings.tsx` checkout calls.
- Signup redirect: `src/routes/signup.tsx:77`.
- Hero: `src/components/landing/v2/Hero.tsx:78` (CTA), demo inconsistency at `src/components/landing/v2/HeroDemoWidget.tsx:57`.
- SocialProofBar: `src/components/landing/v2/SocialProofBar.tsx:12`.
- Testimonials wire-in: `src/routes/index.tsx` add after `<PricingV2 />`; fix hardcoded "127 reviews" at `src/components/landing/TestimonialsSection.tsx:42`.
- Founding Member counter: `src/components/landing/v2/FoundingMember.tsx:36`.
- Changelog dates: `src/routes/changelog.tsx`.
- Sitemap exclusions: `src/routes/sitemap[.]xml.tsx`.
- Email infra: extend existing Lovable Emails templates under `src/lib/email-templates/`.

---

## Questions before we build

1. **Paddle IDs — are `pro_monthly_trial` etc. real or placeholders?** Critical to confirm before anything else.
2. **OK to drop free tier from 10/mo → 3/mo** and add the **$97 lifetime founding deal**?
3. **Which channel will YOU personally drive** — TikTok demos, X/LinkedIn building-in-public, or AppSumo prep? I can scaffold all three but you need to pick one to commit to weekly.
4. **OK to delete the 23 v1 landing components and merge the duplicate marketing pages?**

Once you answer these, we start with Phase 0 (checkout fix) the same turn.
