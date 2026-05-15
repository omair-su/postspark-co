
# PostSpark — Next-Level Feature Plan

## Part 1 — Audit of Current Features

| Area | What exists | Gaps / what's missing for "premium AI" feel |
|---|---|---|
| **Repurpose** (core) | 10 output types, tone, language, brand voice, brand kit, A/B hooks, favorites, history | No per-output regenerate-with-feedback ("make shorter / punchier"), no inline edit + AI rewrite, no quality scoring, no platform-preview mockups (LinkedIn/X visual cards) |
| **Image Studio** | Replicate generation, prompt + style + aspect | No image editing (inpaint/outpaint), no background remove, no on-image text overlay, no auto-resize per platform (1:1, 9:16, 16:9 batch), no carousel/slide generator |
| **SEO Blog** | Title, meta, slug, outline, markdown, FAQ | No internal linking suggestions, no SERP-aware competitor outline, no AI image insertion, no FAQ schema export, no "humanize" pass, no readability score |
| **Hook Lab** | 5 viral hooks per topic/platform | No hook scoring, no save-to-library, no swipe-file browser, no remix existing winning hooks |
| **Brand Voice** | Train from samples, auto-apply | No voice strength slider, no multiple voices per project, no voice match-score on output |
| **Brand Kit** | Logo, colors, fonts, tone | No auto-extract from website URL, no logo background remove |
| **Templates** | Save/load presets | No public template marketplace, no AI-suggested template per topic |
| **Calendar** | Stores scheduled posts (UI only — no publishing) | Needs "Copy & open" deep links per platform, ICS export, drag-reschedule, content gaps detector |
| **History** | List, favorite, delete, bulk | No semantic search, no folders/tags, no "find similar past post" |
| **Analytics / Agency Analytics** | Job counts, basic charts | No trend insights, no AI-written weekly digest, no "top performing format" recommendation |
| **Gallery (public showcase)** | Public job pages, /u/:handle | No like/upvote, no remix-this-post button, no embed code |
| **Onboarding** | Wizard | No "import from URL/RSS to see magic instantly" first-run demo |
| **Dashboard** | Daily Spark, activation checklist, command palette | No AI assistant chat sidebar, no usage forecast, no streaks |
| **Settings / Team / Referrals / Brand Admin** | Functional | Fine for now |

---

## Part 2 — High-Demand AI Features to Add (no paid OAuth needed)

Ranked by market demand × build cost × differentiation. All use Anthropic Claude (already wired) + Replicate (images) + ElevenLabs (audio, already wired) + browser APIs.

### Tier 1 — Ship first (biggest "wow" per hour of work)

1. **AI Chat Assistant ("Spark Copilot")** — floating sidebar chat that knows the user's brand voice, recent jobs, and can: rewrite selected output, suggest hooks, draft replies, brainstorm topics. Searched term: "AI writing copilot".
2. **YouTube / URL → Repurpose in one click** — paste any YouTube URL → fetch transcript (youtube-transcript npm) → auto-run repurpose. Already have `import.server.ts`; extend to YouTube + article scraping. Massive search volume: "youtube to blog AI", "youtube to tweets".
3. **Carousel Generator (LinkedIn / Instagram)** — AI writes 6–10 slides + designs them with brand kit colors → exports PNG/PDF. Huge demand: "AI carousel maker". Pure HTML→canvas, no paid API.
4. **AI Humanizer / Anti-AI-detector pass** — second Claude pass that rewrites for burstiness + perplexity. Trending search: "AI humanizer". One server function.
5. **Platform Previews** — render generated tweet / LinkedIn post / IG caption inside a realistic mockup card before copying. Pure CSS components. Makes app feel premium instantly.
6. **Thumbnail / Cover Image Generator** — preset for "YouTube thumbnail", "Blog cover", "X header" with text overlay using brand fonts/colors. Wraps existing Replicate.

### Tier 2 — Strong demand, medium effort

7. **Voice / Podcast → Content** — user uploads MP3 → ElevenLabs/Whisper transcribe → repurpose. ("podcast to blog AI")
8. **Newsletter Generator** — long-form email + subject line A/B + preview-text variants, with sections.
9. **Reply Generator** — paste a tweet/LinkedIn comment → 5 on-brand reply options. Tiny feature, huge daily-use value.
10. **Content Calendar AI Planner** — "generate 30 days of content ideas from my niche/website" → fills calendar. Uses existing calendar table.
11. **SEO Internal Link & Competitor Outline** — given keyword, scrape top 3 SERP titles via a free SERP API or DuckDuckGo HTML, build a better outline. (Optional: Perplexity connector — already documented.)
12. **AI Image Editor** — background remove (Replicate `cjwbw/rembg`), inpaint, upscale. Wraps Replicate models.
13. **Translate & Localize** — one-click translate any past job into N languages, store as variants.

### Tier 3 — Stickiness & growth (no $ required)

14. **Swipe File / Hook Library** — community-curated viral hooks browsable + remixable; seeds from public showcase jobs.
15. **Weekly AI Digest Email** — Lovable Emails infra already in place; cron-style server route summarizes user's week + suggests next post.
16. **Streaks & XP** — "5-day creation streak", unlocks badges on public profile. Pure DB + UI.
17. **Public Template Marketplace** — extend templates table with `is_public` + browse page. Network effect.
18. **Chrome-extension-style Bookmarklet** — drag-to-bookmark "Repurpose this page" → opens dashboard prefilled. Zero infra.
19. **Embeddable Showcase Widget** — `<iframe>` snippet for users' personal sites featuring their /u/:handle posts.
20. **Semantic Search across History** — pgvector + Claude embeddings; "find that post about onboarding".

### Skipped (per your instruction, until $1k revenue)
- X / LinkedIn / Threads OAuth publishing
- Native mobile apps requiring Apple/Google fees

---

## Suggested Build Order (4 phases)

**Phase A — Premium polish (1–2 turns)**
- Spark Copilot chat sidebar (Tier 1 #1)
- Platform Previews on Repurpose results (#5)
- AI Humanizer toggle on every output (#4)

**Phase B — High-search-volume magnets (2–3 turns)**
- YouTube/URL one-click repurpose (#2)
- Carousel Generator (#3)
- Reply Generator (#9)

**Phase C — Image & audio expansion (2 turns)**
- Thumbnail/cover generator with text overlay (#6)
- AI Image Editor: bg remove + upscale (#12)
- Podcast/voice → content (#7)

**Phase D — Stickiness & SEO (2 turns)**
- 30-day AI Calendar Planner (#10)
- SEO competitor-aware outline + internal links (#11)
- Swipe file + public template marketplace (#14, #17)
- Streaks + weekly digest email (#16, #15)

---

## Technical Notes
- All AI calls reuse `src/server/anthropic.server.ts` (Claude Sonnet 4.5).
- New server functions follow the `*.functions.ts` + `*.server.ts` split already used.
- Image features extend existing Replicate client in `src/server/image.server.ts`.
- YouTube transcripts: add `youtube-transcript` (Worker-compatible, pure JS).
- Carousel export: client-side `html-to-image` → PDF via existing `exportPdf.ts`.
- Semantic search later: enable `pgvector` extension + new `embeddings` column.

---

## Question before I start building

Which phase do you want first? My recommendation: **Phase A + the YouTube one-click repurpose from Phase B** in the next turn — it's the single biggest "wow" for new users and matches what's exploding on Google right now ("AI carousel", "AI humanizer", "youtube to blog AI", "AI copilot").
