# AI Humanizer → World-Class

## What the research says separates the leaders

Tested comparisons (HumanizerBench, ToHuman, ToolRadar, Aug 2026) rank humanizers on four things, in this order:

1. **Bypass rate** across GPTZero / Copyleaks / Originality / Winston / ZeroGPT
2. **Meaning preservation** — facts, numbers, names, claims untouched
3. **Readability** — output must not read like thesaurus soup
4. **Transparency** — every credible tool now shows before/after scores, per-sentence changes, and refuses "100% undetectable" claims

The technical levers they all use: **burstiness** (sentence-length variance), **perplexity** (word predictability), removal of AI lexical fingerprints, rhythm/paragraph-shape variation, and controlled imperfection. Nobody wins on a single prompt — winners run analyze → rewrite → critique passes and give the user sentence-level control.

## Audit of what PostSpark has today

| Area | Current state | Verdict |
|---|---|---|
| Engine | One Claude call, one static system prompt (`copilot.server.ts` → `humanizeText`) | Weakest link |
| Scoring | Regex counts on ~12 words, "human score" is a made-up formula (`75 + delta*3`), "Meaning preserved ✓ 100%" is hardcoded | Not credible |
| Control | 3 strength buttons, purpose/style/preserve pills. No sentence-level anything | Shallow |
| Length | Hard 5,000-char UI cap / 8,000 server cap, single shot | Blocks blog/essay users |
| Brand Voice | Not used at all in the humanizer path (Replies uses it, humanize doesn't) | Missing |
| History | Rows are written to `repurpose_jobs` but the page never reads them; "Save to Swipe File" is a fake toast | Broken promise |
| UI | Hardcoded light-mode hex (`#1A1A2E`, `#6B4EFF`, `bg-white`) — breaks the Obsidian Luxe dark theme; 5 stacked config cards push the editor below the fold; no diff view | Off-brand, off-token |
| Limits | Counts against the shared 3/month `repurpose_jobs` bucket | Keep, but surface it |
| Landing page | `/tools/ai-humanizer` is the generic `SegmentPage` template — no demo, no comparison, no FAQ, no JSON-LD | Under-built |

## The plan

### Phase 1 — Real analysis engine (built-in heuristic detector)

New `src/lib/humanizeMetrics.ts` (pure, shared client/server, unit-testable) computing genuine signals:

- **Burstiness**: sentence-length standard deviation + coefficient of variation
- **Perplexity proxy**: type/token ratio, bigram repetition, common-word density
- **AI fingerprints**: a curated 120+ pattern library (openers, transitions, corporate verbs, tricolons, "not only… but also", em-dash abuse, "it's not X, it's Y")
- **Rhythm**: paragraph shape variance, uniform-opener detection, passive ratio
- **Readability**: Flesch reading ease + grade level
- **Meaning integrity**: extracted numbers, %, dates, proper nouns, URLs — diffed input vs output, any drop flagged loudly

These roll into an honest **AI-likelihood score 0–100** labelled "estimated" with a per-signal breakdown. No fake "100% preserved" claims anywhere.

### Phase 2 — Multi-pass rewrite with sentence-level control

Rebuild `humanizeText` into a 3-stage pipeline in `src/lib/humanize.server.ts`:

1. **Analyze** — Claude tool-call returns detected tells, register, risky sentences
2. **Rewrite** — targeted prompt built from stage 1 + intensity + purpose + style + preserve list + **active Brand Voice + Brand Kit tone** (reusing `activeBrandKit.server.ts` and `brand_voices`, same as Replies)
3. **Critique & repair** — Claude re-reads its own output against the metrics; if any fact drifted or the score barely moved, it repairs only the offending sentences

Then per-sentence control in the UI: aligned **diff view** where every changed sentence is a card with **Accept / Revert / Re-roll** (`rewriteSentence` server fn re-rolls one sentence in context) and a "why changed" tag. Output text is assembled from accepted sentences, so the user owns the final copy.

### Phase 3 — Long-form batch mode

Paragraph-boundary chunker (~1,200 words/chunk with 1-sentence overlap for continuity), sequential passes with live progress, up to 20,000 words. Streams chunk-by-chunk into the editor so users see progress instead of a spinner. Quota counts one run, not one per chunk.

### Phase 4 — History & versions

New `humanizer_runs` table (user_id, input, output, settings, metrics before/after, created_at) with RLS + GRANTs, migration explained before it runs. Sidebar of past runs, version compare (v1 vs v2 vs v3 of the same source), one-click restore, real "Save to Swipe File" wired to the existing swipe-file functions.

### Phase 5 — UI/UX rebuild (premium)

- **Two-pane workspace**: full-height editor left, output right, settings collapsed into a compact top toolbar + slide-over "Advanced" panel — editor above the fold on first paint
- **Score dial**: animated before → after AI-likelihood ring with per-signal bars (burstiness, perplexity, fingerprints, readability) and a plain-English verdict
- **View switcher**: Output · Diff · Metrics
- **All hardcoded hex replaced with semantic tokens** so dark (default) and light both look intentional; glass panels, `lux-progress` streaming state, shimmer skeletons — matching Carousel/Image Studio
- Mobile: stacked tabs (Input / Output / Diff), sticky action bar
- Keyboard: ⌘↵ humanize, ⌘⇧C copy

### Phase 6 — Public landing page

Rebuild `/tools/ai-humanizer` as a real page: live before/after slider with real samples, honest "how detection works" explainer, metric breakdown demo, competitor comparison table, 8-question FAQ, FAQPage + SoftwareApplication JSON-LD, unique head/OG. No "100% undetectable" claims — positioning is *quality + control + your voice*, which is defensible and on-brand.

## Technical notes

- Text AI stays Claude (`claude-sonnet-4-5` via `anthropic.server.ts`); multi-pass = up to 3 calls per run, so free tier stays 1 run = 1 credit and only successful runs are counted (same rule as Repurpose).
- New files: `src/lib/humanizeMetrics.ts`, `src/lib/humanize.server.ts`, `src/lib/humanize.functions.ts`, `src/components/humanizer/*` (ScoreDial, DiffView, SentenceCard, MetricsPanel, HistoryRail).
- `copilot.server.ts` `humanizeText` kept as a thin delegate so SparkCopilot / AskBar / SEO-blog callers don't break.
- One migration for `humanizer_runs` (+ RLS, + GRANTs). No existing table altered.
- Server-fn files stay thin wrappers (declarations only) per the splitting rule.
- Verification each phase: typecheck, lint, build, plus a Playwright pass on the dashboard route in dark and light mode.

## Out of scope (call it out)

No third-party detector API — the score is our own honest estimator, labelled as an estimate. If you later want true GPTZero/Originality verdicts, that's a Pro add-on needing a paid key.
