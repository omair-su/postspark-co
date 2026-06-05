
# Landing Demo v3 — "Convert in 60 Seconds" Plan

The current demo is a single textarea that returns 3 outputs (tweet, LinkedIn, hook). It works, but it doesn't *sell*. Visitors don't feel the pain solved — repurposing **one** thing into **many** across **platforms in their voice**. This plan turns the demo into the single strongest conversion asset on the page.

## Goals (in priority order)

1. **Show the magic in <10 seconds** — first paint must already have a pre-filled example so people see output before typing.
2. **Demonstrate the core promise visibly** — "1 input → 30 pieces" must be visually obvious, not implied.
3. **Trigger the upgrade moment naturally** — show locked premium outputs (carousel, thread, newsletter, video script) as blurred teasers with "Unlock with free account" CTAs.
4. **Reduce friction to try** — accept URL paste (blog/YouTube) and not just raw text.
5. **Prove quality** — let users pick a *tone* (Professional / Casual / Bold / Storyteller) and re-generate instantly.

---

## Part 1 — Input Upgrades (`HeroDemoWidget.tsx`)

### 1.1 Multi-source input with tabs
Replace single textarea with 3 input modes:
- **Paste Text** (current behavior)
- **Blog URL** — paste any article URL; server fetches + extracts via existing `src/server/import.server.ts`
- **YouTube URL** — paste video link; server pulls transcript via existing `src/lib/import.functions.ts` pattern

Each tab pre-filled with a working example so users can click "Generate" with zero typing.

### 1.2 Pre-filled compelling sample
Default text on load: a real-world blog paragraph about productivity/AI (~150 chars). Visitor sees output *immediately* after first click, no thinking required.

### 1.3 Tone selector chips
Above the Generate button: 4 tone pills (Professional / Casual / Bold / Storyteller). Selected tone passes to API and changes voice — proves the "in your voice" promise.

### 1.4 Character counter + live preview
Show "243 / 4000 chars" subtle below textarea. Adds polish.

---

## Part 2 — Output Upgrades (the "wow" moment)

### 2.1 Expand from 3 → 6 platform outputs
Free (unlocked):
- 🐦 Tweet
- 💼 LinkedIn post
- 📧 Email subject line

Locked (blurred + "Sign up free to unlock"):
- 🧵 Twitter thread (5 tweets)
- 📰 Newsletter intro
- 🎬 YouTube Short script (30s hook)

Visually this **immediately** proves "1 → 30" because users *see* 6 deliverables from one input, with more clearly available behind signup.

### 2.2 Streaming output (Claude streaming)
Stream the generation token-by-token (typewriter effect) instead of waiting for full JSON. Already have `callClaude` — add a `callClaudeStream` variant returning a `ReadableStream`. The visible typing animation is the single biggest "wow" trigger in AI demos.

### 2.3 Result card actions
Each output card gets:
- **Copy** (existing)
- **Regenerate** (new — re-runs just that platform)
- **Tweak tone** (mini popover with same 4 tone chips)
- **Character count** badge (e.g. "247 / 280" for tweets — proves platform-native sizing)

### 2.4 Visual platform mockups (optional polish)
For Tweet and LinkedIn, render the output inside a **mini fake-UI card** that looks like a real Twitter/LinkedIn post (avatar placeholder, username, timestamp, like icons). Adds massive perceived quality with ~30 lines of CSS.

---

## Part 3 — Conversion Mechanics

### 3.1 Live social proof above the demo
Small ticker: "🔥 2,847 pieces generated today · 312 creators signed up this week" — fetched from `demo_uses` count (already tracked) + `profiles` count. Updates on page load.

### 3.2 Locked-output reveal CTA
The 3 locked cards each have an overlay:
> "🔒 Unlock thread + newsletter + video script → **Sign up free** (no card)"

Clicking any locked card → `/signup` with `?from=demo_lock_{platform}` analytics tag.

### 3.3 "Generate again" gate
After 1 free generation, second click shows: *"Loved it? Get 10 free repurposes/month →"* with signup CTA *and* still allows 2 more anonymous uses (current 3/day limit stays).

### 3.4 Remaining-uses counter
Replace silent rate limit with visible: "2 of 3 free demos left today · Unlimited with free account →"

### 3.5 Post-generation upgrade panel (replace current static box)
After result, show a 3-up grid:
- ✅ "You just saved ~45 minutes"
- ✅ "Pro users average 30 pieces per input"
- ✅ "Join 1,200+ creators" → big signup button

---

## Part 4 — Server Changes

### 4.1 `src/routes/api/public/demo.ts`
- Accept new `Schema`: `{ input?, url?, sourceType: 'text'|'blog'|'youtube', tone: 'professional'|'casual'|'bold'|'storyteller', platforms: string[] }`
- If `url`: call existing blog/YouTube extractor, then feed extracted text to Claude
- Update system prompt to return all 6 platform outputs in one call
- Switch handler to **streaming response** (SSE) — yields each platform as it completes so the UI can render progressively
- Keep IP-hash rate limit at 3/day (unchanged)

### 4.2 New endpoint `src/routes/api/public/demo-stats.ts`
GET-only. Returns:
```json
{ "generatedToday": 2847, "signupsThisWeek": 312 }
```
Used by the social-proof ticker. Cached server-side for 60s.

### 4.3 `src/server/anthropic.server.ts`
Add `callClaudeStream({ systemPrompt, userPrompt })` returning a `ReadableStream<string>` for token streaming.

---

## Part 5 — Files Changed

```text
EDIT  src/components/landing/v2/HeroDemoWidget.tsx   (full rebuild)
EDIT  src/routes/api/public/demo.ts                  (streaming + URL input + tone + 6 outputs)
EDIT  src/server/anthropic.server.ts                 (add streaming variant)
NEW   src/routes/api/public/demo-stats.ts            (social-proof counter)
NEW   src/components/landing/v2/demo/SourceTabs.tsx
NEW   src/components/landing/v2/demo/ToneChips.tsx
NEW   src/components/landing/v2/demo/PlatformCard.tsx
NEW   src/components/landing/v2/demo/LockedCard.tsx
NEW   src/components/landing/v2/demo/SocialProofTicker.tsx
NEW   src/components/landing/v2/demo/PostUpgradePanel.tsx
EDIT  src/components/landing/v2/Hero.tsx             (no layout change; widget is self-contained)
```

No DB migrations needed — reuses existing `demo_uses` and `profiles` tables.

---

## Visual / Brand

- Keep current landing palette: white surface, `#7C3AED` primary, `#F5F3FF` accent, `#0F172A` ink, Inter font.
- Locked cards: white background, 6px blur on text, gold (`#C9A87C`) lock icon, subtle violet gradient overlay.
- Streaming cursor: thin violet `|` blinking — same as current hero typewriter.
- Mini platform mockups: real brand colors (Twitter `#1DA1F2`, LinkedIn `#0A66C2`) but used **only** inside the mock card frame, never in PostSpark chrome.

---

## Open Questions (please confirm before I build)

1. **Streaming** — go for token-by-token streaming now, or keep it simple JSON for v1 and add streaming later? (Streaming is ~3x more impressive but adds ~1 hour of work.)
2. **URL ingestion** — include Blog URL + YouTube URL tabs in v1, or text-only for v1 and add URLs in v2? (URL support is the biggest pain-relief signal but adds server work.)
3. **Mini platform mockups** — render outputs inside fake Twitter/LinkedIn cards? (Massive perceived quality boost; pure CSS, ~45 min.)
4. **Locked premium outputs** — comfortable showing 3 blurred outputs gated behind signup, or do you want all 6 fully visible? (Gating drives signups but some users dislike it.)

If you say "yes to all", I'll build the full version in one pass.
