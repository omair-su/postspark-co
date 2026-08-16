# Repurpose Studio — World-Class Rebuild (Generation, Preview, Publishing)

Five fixes, one architectural change. The root cause behind both the broken preview and the broken publishing is the same: generation returns **one big text blob per format**, and the UI guesses where posts start and end. We replace that with real **pieces** — each generated post is its own object with platform, index, character count and media slots. Preview and publishing both read from pieces, so nothing can be mis-split again.

## 1. No pre-selected formats

Current behaviour (confirmed in code): the page opens with Twitter x5, LinkedIn x2, Email, Video Script already ticked — 9 pieces before the user touches anything. That both dilutes quality and burns credits.

- Nothing is selected on load. Step 3 stays disabled with "Pick at least one format".
- Format picker gets a clean empty state plus optional one-tap **Starter recipes** (e.g. "LinkedIn + X", "Full launch pack") the user must explicitly click.
- Live cost/quality meter: total pieces, estimated time, and a soft warning above ~8 pieces ("Fewer formats = deeper, better writing").

## 2. Real 1–2 piece options everywhere

Quantity lists get low-end options and saner defaults:

| Format | New options | Default |
|---|---|---|
| Threads | 1, 2, 3, 5, 8, 10, 12, 15, 20 | 3 |
| Instagram | 1, 2, 3, 5, 7 | 1 |
| Carousel | 1, 2 (single slide/pair), 5, 7, 8, 10, 12 | 8 |
| Facebook / TikTok | 1, 2, 3, 5 | 1 |
| Twitter / X | 1, 2, 3, 5, 7, 10, 15, 20 | 3 |
| LinkedIn | 1, 2, 3, 5 | 1 |

Threads also gets a **mode** toggle: "Single posts" (N independent posts) vs "Connected chain" (one thread of N). Today it is always a chain, which is why the user sees 10 pieces from one request.

## 3. Deeper, non-compressed Claude writing

- Token budget scales with requested count instead of a flat cap, so 5 LinkedIn posts don't get squeezed into one 3,500-token response.
- Two-pass writing for premium formats (LinkedIn, Email, Video, Carousel, Threads chain): pass 1 = angle plan (hook, promise, proof, CTA per piece); pass 2 = write full pieces against that plan. Costs one extra short call, massively raises quality.
- Anti-compression rules in every prompt: no truncation, no "…", every piece self-contained and fully developed, no repeating the same idea across pieces, concrete specifics pulled from the source.
- Extended thinking enabled for the plan pass so structure is reasoned before writing.
- Brand kit, brand voice, tone sliders and language stay exactly as they are today.

## 4. One post = one preview card

Generation switches to structured output (Claude tool call) returning a piece array per format, so segmentation is authoritative, never regex-guessed. A safe text fallback parser remains for legacy saved packs.

Preview rules:

- Email newsletter = **one** card (subject options + preview text + full body inside a single premium inbox mock). Today it fragments into 5–6 cards, which is exactly the screenshot problem.
- LinkedIn / Facebook / Instagram / TikTok = one card per post, never split on blank lines.
- Twitter = one card per tweet; Threads chain = one card with connected posts stacked inside a single threaded rail.
- Video script, SEO, Podcast, Carousel = one document/deck card each (carousel gets a swipeable slide viewer).
- Ask for 10 pieces → exactly 10 cards.

Premium card design: real platform chrome (avatar, handle, verified tick, engagement row), per-piece character counter against the platform limit with a green/amber/red ring, per-piece Copy / Edit inline / Regenerate this one / Publish / Schedule, a Grid vs Feed view toggle, and light/dark parity using existing tokens.

## 5. Publishing Center that actually publishes multi-platform in one click

Current behaviour (confirmed): one shared textarea, one shared character limit set to the *smallest* selected platform — so a 3,000-char LinkedIn post immediately errors when Threads or X is also selected, and every platform shows the same LinkedIn text.

New model — **publish queue of pieces, not one shared textarea**:

- Handoff from Repurpose sends the whole pack (all pieces with their platform), not one string.
- The Center lists each piece as its own row: platform badge, its own editable text, its own character limit and counter, its own media slot, its own preview.
- Auto-routing: tweets → X, threads → Threads, LinkedIn → LinkedIn, IG caption → Instagram, FB post → Facebook, video script → YouTube/TikTok description. Manual override per row.
- **Publish all** runs every row against its own native endpoint with its own limit. 2 LinkedIn + 5 Threads + 2 tweets = 9 correct native posts from one click. Concurrency-limited, per-row status (queued → publishing → published/failed with the real API error), retry failed rows only, published rows show a live link.
- Pre-flight checks before anything fires: over-limit rows, Instagram missing media, disconnected accounts — all surfaced as fixable warnings instead of mid-run failures.
- Long tweets can auto-split into a native X thread (opt-in per row) instead of being rejected.
- **Schedule all** uses the same queue with per-row time or auto-spacing (e.g. 90 min apart), writing to the existing scheduled_posts pipeline.

## Also worth adding (same pass)

- Per-piece Regenerate and "Make it shorter / punchier / more specific" quick actions.
- Export pack: copy all, download .md/.txt, push to Google Docs (already integrated).
- Failed formats retry individually without re-running the whole pack or burning a credit (limit logic already only counts successes).

## Technical notes

- `src/lib/repurpose.server.ts`: token scaling, two-pass planner, structured `content_pieces` tool schema per format via existing `callClaudeWithTool`, Threads single-vs-chain mode.
- `src/lib/repurpose.functions.ts`: return `pieces[]` alongside the legacy `output` string; persist pieces on the pack row.
- New `src/lib/pieces.ts`: shared piece type, platform limits, and the fallback text→pieces parser used for older packs.
- `src/routes/dashboard.repurpose.tsx`: empty initial `picks`, new quantity lists, recipes, piece-based output rendering, pack-level handoff.
- `src/components/VisualPreview.tsx`: rewritten to render one card per piece (no `splitIntoPosts` guessing), premium platform chrome, per-piece actions.
- `src/routes/dashboard.publishing.tsx`: queue UI + per-row limits/media/status, replacing the single shared textarea and shared `activeLimit`.
- `src/components/PublishMenu.tsx`: hand off the full pack payload.
- Existing publishers (`socialPublish.functions.ts`, `metaPublish.functions.ts`, LinkedIn media path) are reused unchanged; only orchestration changes.
