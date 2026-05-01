
# PostSpark Premium Upgrade Roadmap

Goal: turn PostSpark from "a content repurposer" into a **creator command center** that pulls people in, keeps them, and justifies Pro/Agency pricing. Below is a prioritized, phased plan — we ship in waves so each release feels like a "wow" moment, not one giant blob.

---

## Wave 1 — The "Wow on First Use" Layer (highest impact, ship first)

These features hit users in the first 60 seconds and drive conversions.

### 1. AI Brand Voice Training
- User pastes 3–5 samples of their past content (tweets, blog, LinkedIn).
- We store an embedding + style summary in a new `brand_voices` table.
- Every future generation auto-uses their voice → output sounds like *them*, not generic AI.
- Pro/Agency only. Massive retention driver.

### 2. One-Click Viral Hooks Generator
- New tab in repurpose page: "Hook Lab".
- Generates 10 scroll-stopping hooks per platform (Twitter, LinkedIn, TikTok, YouTube).
- Uses proven viral frameworks (curiosity gap, contrarian, listicle, story).
- Free users get 3 hooks; Pro gets 10 + framework labels.

### 3. Visual Content Preview (mockup cards)
- Render outputs inside realistic platform mockups (a fake tweet card, a fake LinkedIn post, a fake IG caption with image slot).
- Users *see* how content will look before posting → huge perceived value.
- Pure CSS, no API cost.

### 4. AI Image Generation for Posts
- Use `google/gemini-3.1-flash-image-preview` (free via Lovable AI) to generate post thumbnails, IG carousels, and quote cards.
- 1 image/repurpose for Free, unlimited for Pro.
- Auto-suggest based on content topic.

---

## Wave 2 — The "Creator Workflow" Layer (retention + daily-use)

### 5. Content Calendar & Scheduler View
- New `/dashboard/calendar` route.
- Drag-drop calendar showing planned posts by date/platform.
- New `scheduled_posts` table (date, platform, content, status).
- Phase 1: planning only (manual copy-out). Phase 2 (later): real publishing via platform APIs.

### 6. Multi-Language Repurposing
- Toggle: "Also generate in: Spanish, French, Urdu, Arabic, Hindi…" (12 languages).
- Pro feature. Opens international creator market — huge for Pakistan/MENA audience.

### 7. SEO-Optimized Long-Form Mode
- New output type: full 1500-word blog post with H1/H2/H3, meta description, focus keyword, internal link suggestions.
- Targets bloggers/agencies — Agency tier value driver.

### 8. Content Series Generator
- Input one topic → AI plans a **30-day content series** (calendar of 30 post ideas across formats).
- One click expands any day into full content.
- "Never run out of ideas again" — killer marketing line.

---

## Wave 3 — The "Differentiation" Layer (what competitors don't have)

### 9. Audio/Voice Input
- Record voice memo → Whisper transcription → repurpose.
- Creators talk faster than they type. Mobile-first feature.

### 10. URL & Document Import (expand beyond YouTube)
- Paste any blog URL, podcast link, PDF upload, or Google Doc → auto-extract → repurpose.
- Uses server-side fetch + readability extraction. Massive input-flexibility win.

### 11. Performance Predictor (AI Score)
- Each generated post gets an AI-predicted "engagement score" (0–100) with reasoning.
- "This LinkedIn post scores 87/100 — strong hook, weak CTA. Fix?"
- Cheap to compute, feels magical.

### 12. Team Workspaces (Agency tier)
- Invite team members, shared brand voices, approval workflow (draft → review → approved).
- New `workspaces` + `workspace_members` tables with RLS.
- Justifies the $49/mo Agency price.

---

## Wave 4 — The "Polish & Conversion" Layer

### 13. Onboarding Wizard
- 4-step first-login flow: pick niche → train voice → generate first post → see results.
- Boosts activation rate significantly.

### 14. Public Showcase / Gallery
- Opt-in: users can publish best generations to a public `/gallery` page.
- Social proof + SEO landing pages for free traffic.

### 15. Referral Program
- "Give 1 month free, get 1 month free" — built-in viral loop.
- New `referrals` table tracking codes + redemptions.

### 16. Browser Extension Stub (landing page first)
- Add "Coming Soon: Chrome Extension" section on landing.
- Capture emails for waitlist → build hype + email list.

---

## Technical Architecture Summary

**New database tables (all with RLS):**
- `brand_voices` (user_id, name, style_summary, sample_embeddings)
- `scheduled_posts` (user_id, content, platform, scheduled_for, status)
- `workspaces` + `workspace_members` + `workspace_roles` (separate role table — security pattern)
- `generated_images` (user_id, job_id, image_url, prompt)
- `referrals` (referrer_id, code, redeemed_by, redeemed_at)

**New server functions:**
- `brandVoice.functions.ts` — train/get/apply voice
- `images.functions.ts` — Gemini image generation
- `hooks.functions.ts` — viral hook generator
- `scheduling.functions.ts` — calendar CRUD
- `transcription.functions.ts` — audio → text via Lovable AI
- `import.functions.ts` — URL/PDF extraction

**AI models (all free via Lovable AI Gateway):**
- Text: `google/gemini-2.5-flash` (default), `openai/gpt-5-mini` (premium quality)
- Images: `google/gemini-3.1-flash-image-preview`
- Voice: existing transcription pipeline

**No payment work in this plan** — Paddle integration tracked separately.

---

## Recommended Build Order

I suggest we ship **Wave 1** first (4 features, ~1 build session each). They give the biggest "holy shit" moment for new visitors and immediately justify upgrading. Then we measure, iterate, and roll out Wave 2.

**My recommendation: start with #1 (Brand Voice) + #3 (Visual Preview) together** — they transform the *core* repurpose experience into something visibly better than every competitor.

Reply with which wave (or specific features) you want me to build first, and I'll start immediately.
