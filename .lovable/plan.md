# PostSpark — Next-Level Growth Plan

Honest diagnosis: the product is already feature-rich (repurpose, brand voice, brand kit, image studio, carousels, hooks, calendar, gallery, referrals, payments, demo, funnel, SEO blog, agency analytics). The bottleneck is **not features** — it's **distribution + funnel conversion + proof**. This plan focuses on shipping only what moves visitors → signup → paid, and giving you assets to drive traffic.

---

## Phase 1 — Convert the traffic you already get (highest ROI, ship first)

Goal: lift signup rate from current baseline and unlock first 10 paid users.

1. **Homepage rewrite around 1 promise + 1 proof**
  - New hero: "Turn one idea into a week of posts in 60 seconds" + live mini-demo above the fold (move `LandingDemoSection` higher, right after Hero).
  - Replace generic features grid with a "watch it work" video/GIF of an actual repurpose run.
  - Add real outputs from `/gallery` as a scrolling proof strip.
2. **Pricing page that closes**
  - Anchor on Agency $49 (highlight), Pro $19 in middle, Free on right.
  - Add money-back guarantee line, "no card for free", 5 FAQ objections only.
  - Add annual toggle (save 20%) — better cashflow and commitment.
3. **Demo → signup hand-off**
  - After demo output, auto-save the input to `localStorage` so the signup flow pre-fills it and runs the FULL pack on first login (instant wow).
  - Add "Email me the full pack" capture for visitors not ready to sign up → lead magnet.
4. **Upgrade nudges that actually fire**
  - Verify `UpgradeNudgeModal` triggers on: 3rd repurpose used, hitting limit, scroll-50% on dashboard once/7d.
  - Add blurred "4th preview" on the limit screen instead of hard wall.
5. **Trust signals everywhere**
  - Live counter from `repurpose_jobs` ("X posts repurposed this week") on hero + pricing.
  - Wire real testimonials from `testimonials-admin` into landing (currently has section, confirm it pulls from DB).
  - Add "Featured on" bar (ProductHunt badge, AppSumo, etc.) — placeholders until earned.

---

## Phase 2 — SEO traffic engine (compounding, ship in turn 2)

Goal: 500+ organic visitors/day within 60 days.

6. **Programmatic tool pages** (already started — expand the pattern)
  - Existing: `tools.youtube-to-twitter-thread`, `tools.blog-to-linkedin-carousel`, `tools.podcast-to-newsletter`, `tools.newsletter-to-social`.
  - Add 8 more: `youtube-to-linkedin`, `blog-to-twitter-thread`, `podcast-to-tweets`, `video-to-carousel`, `transcript-to-blog`, `linkedin-to-tweets`, `webinar-to-shorts`, `interview-to-newsletter`. Each = real free tool (1 use/day no signup) → signup wall.
7. **Comparison pages** (high commercial intent)
  - `/vs/repurpose-io`, `/vs/castmagic`, `/vs/opus-clip`, `/vs/taplio`, `/vs/buffer`.
  - Honest comparison table + "why creators switch" — these rank fast and convert.
8. **Use-case pages** (expand existing for/* pattern)
  - Existing: `for.creators`, `for.agencies`, `for.podcasters`, `for.youtubers`.
  - Add: `for/coaches`, `for/saas-founders`, `for/newsletter-writers`, `for/course-creators`.
9. **Blog auto-publishing**
  - Use existing `seoBlog` feature to publish 2 posts/week targeting these keywords. Add scheduler so it auto-publishes from queue.
  - Add internal linking between tool/comparison/use-case pages.
10. **Technical SEO polish**
  - Verify sitemap includes all new routes, og:image per page (derived from content), proper canonicals on dynamic routes.

---

## Phase 3 — Built-in virality (ship in turn 3)

Goal: every free user becomes a (small) acquisition channel.

11. **Watermark on free exports** — "Made with PostSpark →" with referral link on images, carousels, PDFs. Remove on Pro.
12. **Public gallery as Open Graph engine** — per-item OG image generator, "Remix this" CTA prefills signup with source.
13. **Share-to-unlock** — "Tweet your result to unlock 2 bonus repurposes this month".
14. **Referrals polish** — `ReferralBanner` made prominent in dashboard, auto-generated share image with user's name + offer.

---

## Phase 4 — Lifecycle emails (ship in turn 4)

You already have Lovable Emails infra + templates. Wire the sequences:

- **Day 0**: Welcome + 60s demo video
- **Day 1**: "Did you try Brand Voice?" (highest-converting feature)
- **Day 3**: Case study from gallery
- **Day 6**: "Credits reset in X days" + upgrade
- **Day 14**: Last-chance 15% off first month
- **Behavior-triggered**: hit limit → instant upgrade email; 7d inactive → re-engage; trial ending → win-back

---

## Phase 5 — Outbound assets you execute (I generate, you send)

These I can't send — but I'll generate every asset:

15. **ProductHunt launch kit** — gallery images, GIFs, tagline A/B variants, hunter outreach DM, launch-day comment script. Aim for a Tuesday.
16. **Build-in-public thread** — "$80k spent, $0 earned, here's what I learned" X + LinkedIn thread (these hit 100k+ views consistently).
17. **Cold outreach kit**:
  - LinkedIn DM script for 2–10 person content agencies (offer: 60-day free Agency in exchange for testimonial → goal is 5 design partners, not sales).
    - Cold email script for podcasters/newsletter ops ("I'll repurpose your last episode into 10 posts for free, no signup").
18. **Reddit/IH/BetaList copy** — value-first posts for r/Entrepreneur, r/SideProject, r/SaaS, r/podcasting + Indie Hackers milestone + BetaList/Uneed/Tinylaunch/Fazier/Peerlist submissions.
19. **AppSumo LTD listing** (optional, controversial but reliable) — $59 LTD copy, gallery, FAQ. Capped at 1000 codes = ~$45k cash + reviews + ~1500 users.

---

## Recommended execution order

```text
Turn 1  → Phase 1 (homepage + pricing + demo→signup + nudges + trust)
Turn 2  → Phase 2 (8 tool pages + 5 comparison pages + 4 use-case pages)
Turn 3  → Phase 3 (watermarks + gallery OG + referral polish)
Turn 4  → Phase 4 (lifecycle email sequences wired to triggers)
Turn 5  → Phase 5 assets (PH kit + threads + cold outreach + Reddit/IH copy)
```

Turn 1 is where 80% of the conversion lift comes from. Phases 2–4 compound. Phase 5 is what actually brings traffic — those are yours to send, but I'll write every word.

---

## What I need from you to start

- Reply **"go turn 1"** to ship Phase 1 (homepage + pricing + demo handoff + nudges + trust signals), or
- Reply **"go turn N"** to start at a specific phase, or
- Tell me which items to drop/swap/reorder.

If you're unsure: **start with turn 1**. There's no point driving traffic to a funnel that doesn't convert.