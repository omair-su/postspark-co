
# PostSpark — First Paying Users Plan

Two tracks running together: **(A) ship in-app growth features** that convert traffic to paid, and **(B) a marketing playbook** you execute outside the app. You've already invested heavily — now we need distribution + conversion, not more features.

Honest diagnosis first: the product is feature-complete and premium. Zero sales after this much spend almost always means **distribution problem + friction in the funnel**, not a product problem.

---

## Track A — In-App Changes I Will Build

### 1. Conversion funnel fixes (highest ROI)
- **Public Gallery as SEO + social proof engine**: make `/gallery` index page indexable, add per-item Open Graph images, "Made with PostSpark" badge on each public output, and a "Remix this" CTA that pushes to signup with the source prefilled.
- **Free tier limit tightening on output, looser on trial**: keep 3 repurposes/month but show a *blurred* 4th preview with "Upgrade to unlock" — proven 2–3x lift vs hard wall.
- **Exit-intent + scroll-50% upgrade modal** on dashboard with annual discount (20% off) — only fires once per 7 days.
- **Pricing page rewrite**: lead with Agency plan (anchor), social proof row, money-back guarantee line, FAQ trimmed to 5 objections.
- **Onboarding → first "wow" in <60s**: skip optional steps, auto-run a sample repurpose from a demo URL so user sees output before they even paste anything.

### 2. Built-in viral loops
- **Watermark on free-tier exports** (images, carousels, PDFs): subtle "Made with PostSpark →" with referral link. Removed on Pro.
- **Referral program polish**: double-sided reward (referrer gets 1 month free, referred gets 20% off) — already in DB, needs prominent dashboard banner + share-image generator.
- **Share-to-unlock**: "Tweet your result to unlock 2 bonus repurposes this month" on free tier.

### 3. SEO content engine (compounding traffic)
- **Programmatic SEO landing pages**: 20 pages like `/tools/youtube-to-twitter-thread`, `/tools/blog-to-linkedin-carousel`, `/tools/podcast-to-newsletter`. Each is a real free tool (1 free use, no signup) → signup wall after.
- **Comparison pages**: `/vs/repurpose-io`, `/vs/castmagic`, `/vs/opus-clip` — high-intent keywords competitors won't write.
- **Use-case pages**: `/for/podcasters`, `/for/youtubers`, `/for/coaches`, `/for/saas-marketers` (you already have `/for/creators` and `/for/agencies` — expand the pattern).

### 4. Lifecycle emails (you have Lovable Emails infra)
- Day 0: Welcome + 60-sec demo video
- Day 1: "Did you try Brand Voice?" (highest-converting feature)
- Day 3: Case study email (one customer success)
- Day 6: "Your free credits reset in X days" + upgrade CTA
- Day 14: Last-chance discount (15% off first month)
- On 3rd repurpose used: immediate "You hit your limit" with upgrade CTA

### 5. Trust & social proof
- Real testimonials section (replace placeholders) — I'll add a CMS-style admin so you can add them as they come in
- Live counter "X posts repurposed this week" (real number from `repurpose_jobs`)
- Logo bar of tools we integrate with (YouTube, Notion, Substack, LinkedIn) — visual not endorsement

---

## Track B — Marketing Playbook (You Execute, I Can't)

### Week 1–2: Foundation (free, do these first)
1. **ProductHunt launch** — schedule for a Tuesday/Wednesday. I'll generate the assets (gallery images, GIFs, tagline variants, hunter outreach template).
2. **Personal X/LinkedIn build-in-public thread**: post your $80k spend story honestly — "I built an AI content tool, spent $80k, made $0. Here's what I learned" — this kind of post regularly hits 100k+ views.
3. **Reddit posts** (no link, just value): r/Entrepreneur, r/SideProject, r/SaaS, r/marketing, r/contentmarketing — share the build-in-public story, mention tool in comments only when asked.
4. **Indie Hackers** milestone post + product listing.
5. **BetaList / Uneed / Tinylaunch / Fazier / Peerlist** submissions — all free, take 2 hours total.

### Week 2–4: Outbound to ICP (small B2B agencies + solo creators)
6. **LinkedIn cold outreach to 20 agencies/day**: target "Content Marketing Agency" 2–10 employees. Script: free Agency-tier trial for 60 days in exchange for a testimonial. **Goal: 5 design partners, not sales.**
7. **Cold email to podcasters/newsletter operators** using Apollo or Hunter (50/day) — pitch: "I'll repurpose your last episode into 10 posts for free, no signup."
8. **Partner with 3 micro-influencers** in creator-economy niche (5k–30k followers) — give them lifetime Agency in exchange for one honest review video.

### Week 4–8: Content engine
9. **YouTube: 1 video/week** — "I repurposed Lex Fridman's podcast into 30 posts in 5 minutes" style — these rank fast on long-tail.
10. **X: 3 posts/day** — output examples from PostSpark itself (eat your own dog food publicly).
11. **SEO blog**: 2 posts/week targeting comparison + use-case keywords — your `seoBlog` feature can write them.

### Paid (only after organic shows signal)
12. **Reddit Ads** ($10/day) to r/podcasting, r/NewTubers — cheapest B2C creator targeting.
13. **X Ads** to followers of competitors (@castmagic, @opusclip).
14. **Skip Google Ads** until you have ≥1% conversion rate — too expensive for current funnel.

### Pricing experiments to consider
- **Lifetime deal on AppSumo** ($59 LTD) — controversial but reliably brings 500–2000 users + reviews + cash. Cap at 1000 codes.
- **Annual plan**: $190/yr (vs $228) — better cashflow.
- **Free Agency trial for verified agencies** (14 days, no card) — converts much better than free tier.

---

## What I Recommend We Ship First (Turn 1)

If you approve this plan, I'll do **Track A items 1, 2, and 4** in the first turn (funnel fixes + viral loops + lifecycle emails). That's the highest-ROI in-app work. Track A item 3 (programmatic SEO) is Turn 2 because it's 20+ new routes. Track A item 5 (trust/proof) is Turn 3.

Track B is yours to execute — but I can generate every asset you need (PH copy, X threads, cold email scripts, LinkedIn DM templates, video scripts, AppSumo listing copy) whenever you ask.

**Reply "go" and I'll start Turn 1.** Or tell me which items to swap, skip, or prioritize.
