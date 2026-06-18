
# Shorts Studio + Landing Premium Upgrade

Three workstreams, one plan. Execute in this order so the broken thing is fixed first, the product gets the depth that justifies "million-dollar SaaS", and the landing is rebuilt to actually sell it.

---

## Part 1 — Fix "Generate Script" doing nothing

Likely root cause based on the wiring (`generateShorts` server fn → `callClaudeWithTool` with `max_tokens: 3500`):

1. Claude tool call sometimes returns no `tool_use` block (long blog inputs + strict schema → it text-replies instead). Currently `result.data` becomes null, `error` is "Generation failed", but UI shows a single brief toast that the user is missing.
2. `withAIProgress` wraps the call — if it throws, the toast never fires.
3. Free-plan limit returns `LIMIT_REACHED` silently.

Fixes:
- Use `invoke-server-function` + `server-function-logs` after build to confirm the exact failure path.
- Tighten `generateShortsScript`:
  - Bump `maxTokens` to 6000.
  - When Claude returns no tool block, retry once with a stricter "you MUST call return_shorts_script" reminder.
  - Truncate input to 8000 chars (down from 12000) — Claude is more reliable.
  - Return human-readable `error` strings.
- In `dashboard.shorts-studio.tsx`, wrap `run()` so any thrown error is toasted, and surface `LIMIT_REACHED` with an inline upgrade card (not just a toast that disappears).
- Add a tiny "Diagnostics" log line in console on failure (status + message).

---

## Part 2 — Make Shorts Studio premium (4 features the user picked)

### 2A. AI voiceover + burned-in captions
- New `narrateShort` server fn in `src/lib/shorts.functions.ts` → calls Lovable AI Gateway `/v1/audio/speech` (`openai/gpt-4o-mini-tts`) with the full assembled VO (all shots joined).
- Voice picker: Alloy / Verse / Sage / Coral / Echo / Ash (6 chips, free preview limited to Alloy; rest = Pro).
- SSE stream → client decodes PCM → assembles into one `wav` Blob → uploads to `shorts-videos/<user>/<job>-vo.wav`.
- "Generate voiceover (Pro)" button below the shot list. Free users see lock badge + upgrade CTA.
- Captions: keep existing SRT download, but add "Burn captions into video" toggle that uses an in-browser canvas+MediaRecorder pipeline (when a video file is uploaded) — overlays the on-screen captions per timestamp onto the user's uploaded video. Pure browser, no ffmpeg.

### 2B. Hook virality score + B-roll search
- Extend `return_shorts_script` schema: each hook gets `score` (0-100) and `score_reason` (one sentence). Claude self-rates.
- Each shot gets `broll_search_query` (e.g. "person typing on laptop coffee shop").
- New "Find clips" button per shot → calls Pexels videos API (free key, server-side env: `PEXELS_API_KEY` — request via `add_secret` only if user proceeds). Returns 6 vertical-friendly clip thumbnails + download URLs in a popover.
- Hook cards show a colored score chip (green ≥80, amber 60-79, red <60).

### 2C. Series mode (1 source → 5 shorts)
- New toggle "Series mode (Pro)" above the Generate button. When on, call a new server fn `generateShortsSeries`:
  - Asks Claude to split the source into 5 episodic angles with cliffhangers, then runs `return_shorts_script` for each (parallel `Promise.all`).
  - Inserts 5 rows into `repurpose_jobs` with `outputs.series_index` 1..5 and shared `series_id` UUID stored in `outputs`.
- UI: tabbed view "Episode 1…5" each rendering the existing script layout.
- Free plan: blocked with "Upgrade to unlock Series mode" CTA.

### 2D. Trending audio picker + AI thumbnail
- Trending audio: curated JSON in `src/lib/trendingAudio.ts` (15 sounds per platform × 6 niches — Tech, Fitness, Founder, Lifestyle, Marketing, Education). Selector chip group below "Audio category", filtered by selected platform + niche dropdown. Each sound shows BPM, vibe tag, and a copy-to-clipboard "Search '<sound name>' in <platform>" string (no licensed audio files).
- Thumbnail: new "Generate cover" button → calls existing image generation path (Replicate already wired) with a prompt assembled from `script.title` + chosen style (Bold, Editorial, Meme, Cinematic). Stores in `generated-images` bucket. Pro feature.

### Schema/data work for Part 2
- Migration: `ALTER TABLE repurpose_jobs ADD COLUMN voiceover_path TEXT, ADD COLUMN cover_image_path TEXT;` (no new policies needed; existing user-scoped policies apply).
- No new tables.

---

## Part 3 — Landing redesign (colors + typography stay, everything else premium)

I'll capture the current preview with Playwright first to anchor each section, then refine — not rebuild from scratch. The design tokens in `tokens.css.ts` are the floor; we add depth, motion, and luxury surfaces on top.

### 3A. Hero + premium live demo
- Hero: keep copy, add layered depth — soft animated aurora behind the headline (CSS `radial-gradient` + slow keyframe), a `Border Beam`-style stroke around the demo widget, and a floating "Powered by Claude · Trusted by 12,000 creators" glass pill.
- New `HeroDemoWidget` v2: cinematic 3-panel preview that auto-cycles every 4s through:
  1. "Paste blog" → animated typing into the input
  2. "AI processing" → 3 progress bars (Twitter, LinkedIn, Newsletter) filling in sequence
  3. "Ready in 47s" → 3 platform output cards animate in (Twitter thread, LinkedIn post, Reels script) with platform-correct chrome.
- Replace the basic placeholder with this cinematic loop. CSS-only animations (no framer-motion — per project constraint).

### 3B. 3D-style luxury icon cards for Pain + Features
- Replace flat lucide icons in `PainSection`, `WhoFor`, and `HowItWorks` with custom 3D-feel icon cards:
  - 80×80 rounded-2xl tiles with layered gradient (soft purple → white), inner shadow, top-edge highlight, and a `lucide` icon centered with a duotone treatment (foreground purple, background `primaryUltra` halo).
  - Each card gets a subtle tilt-on-hover (`transform: perspective(800px) rotateX(...)` via CSS only) and a glow that follows pointer with `--mouse-x/--mouse-y` CSS vars.
- Apply consistently across pain points and feature tiles so the page feels like one luxury system.

### 3C. Competitor comparison vs Repurpose.io / Hootsuite
- New section `CompareSection` between `HowItWorks` and `PricingV2`:
  - Header: "Why creators leave Repurpose.io and Hootsuite for PostSpark"
  - 3-column table: PostSpark / Repurpose.io / Hootsuite × 8 rows (AI writes in your voice, 30 outputs in 60s, Shorts script + voiceover, brand voice training, founding lifetime, etc.).
  - Premium styling: PostSpark column highlighted with gradient border, gold checkmarks; competitors get grey ✕ or "limited" pills.
- Add a small footnote: "Comparison based on publicly available features as of June 2026."

### 3D. Animated How-it-works + pricing depth
- `HowItWorks`: replace the 3 static cards with an animated horizontal pipeline — input → AI engine → outputs. SVG path with an animated dot traveling along it (CSS `offset-path` animation). 3 stops along the path each reveal a glass card on scroll.
- `PricingV2`:
  - Add depth: gradient border on the Pro card, "Most popular" ribbon, soft floating shadow, animated price-tier toggle (monthly/annual) with sliding indicator.
  - Founding Lifetime card gets a gold gradient border + "47 of 50 claimed" live-style scarcity counter.
  - Add a fourth "Compare plans" link that scrolls to a detailed feature matrix.

### 3E. Cleanup pass
- Audit `routes/index.tsx` order; tighten section spacing (the user said "crowded"). Increase vertical rhythm to 96-128px between sections.
- Move `SocialProofBar` up tight under the hero, demote `TestimonialsSection` to a single dense marquee row instead of full cards (less crowded).
- Verify no duplicated CTA blocks (`FinalCTA` + `FoundingMember` shouldn't both shout "limited time" back-to-back).

---

## Research (before Part 3 build)
- Fetch live screenshots of repurpose.io and hootsuite landing pages to source the exact feature claims for the comparison table.
- Capture the current PostSpark landing with Playwright so design refinements can be made against the real anchor, not memory.

---

## Out of scope
- No color or typography changes (per user instruction).
- No new auth flows or billing changes.
- No native ffmpeg / Whisper — caption burning uses MediaRecorder; transcription not added in this round.

---

## Technical notes
- New secret needed: `PEXELS_API_KEY` (free tier, 200 req/hr). Will request via `add_secret` only after you approve and I'm in build mode.
- Voiceover uses Lovable AI Gateway TTS — no new key.
- All AI calls stay in `createServerFn` (text) or server routes (streaming TTS).
- All luxury visuals are CSS/SVG — no new heavy deps, keeps Worker SSR happy.
- Migrations follow the `CREATE → GRANT → RLS → POLICY` order.

Approve and I'll start with Part 1 (the bug), then Parts 2 + 3 in parallel sub-tasks.
