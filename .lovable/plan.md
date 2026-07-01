
# Landing Page v4 — Complete the Million-Dollar Story

Goal: make the new landing page fully represent every PostSpark tool, ship a luxury logo icon (no "P"), and bring tool subpages + comparison into the same visual system — while keeping the page short and conversion-focused, in the vibe of Claude / ChatGPT / Perplexity / Gemini.

---

## 1. New PostSpark Logo Icon (used everywhere)

- Generate a premium 1024×1024 abstract mark (not a "P" letter). Direction:
  - A glowing violet-to-cyan **spark / prism** shape on obsidian, similar visual weight to Claude's starburst and Gemini's diamond — geometric, symmetrical, iconic at 32px.
  - Deliver PNG (transparent) + monochrome SVG version.
- Replace icon in:
  - `public/favicon.svg`, `public/manifest.json`, apple-touch icons
  - `src/components/PostSparkLogo.tsx` (mark + wordmark variants)
  - OG defaults in `src/routes/__root.tsx`
  - The downloadable 1024×1024 asset for Meta/TikTok/LinkedIn developer consoles
- Keep wordmark typography (Instrument Serif) as-is; only the icon changes.

## 2. Landing page — new sections (still short, conversion-first)

Insert into `src/routes/index.tsx` between existing hero and pricing, using the V3 component system (same tokens, gradients, glass cards):

1. **"Every studio in one subscription" — Tools grid**
   A single bento section featuring all real tools, each linking to its dedicated landing page:
   - Repurpose Studio → `/features/repurpose-blog-to-social`
   - Shorts Studio → `/tools/shorts-script-generator`
   - Image Studio (GPT-Image-2, Flux 1.1 Pro, Gemini 2.5/3) → `/tools/ai-image-generator`
   - Hook Lab → `/tools/hook-generator`
   - Carousel Generator → `/tools/blog-to-linkedin-carousel`
   - SEO Blog Writer → `/tools/youtube-to-blog`
   - AI Humanizer → `/dashboard/humanizer` (add a public `/tools/ai-humanizer` landing if missing)
   - Reply Generator → `/tools/reply-generator`
   - Thumbnail Maker → `/tools/youtube-thumbnail-maker`
   - LinkedIn Video Downloader → `/tools/linkedin-video-downloader`

2. **"Powered by the frontier" — Model logos strip**
   Small trust bar: Claude Sonnet 4.5, GPT-Image-2, Flux 1.1 Pro, Gemini 3, ElevenLabs. Reinforces premium AI stack.

3. **"For creators, agencies, podcasters, YouTubers" — audience switcher**
   4 pill tabs linking to existing `/for/*` pages.

4. **Redesigned Comparison table** (replaces the light-theme one in the screenshots)
   Rebuild inside V3 system: obsidian card, violet accent header column, glass rows, gradient check marks, muted red X, "Limited" pills in violet/10. Same rows/content, new shell.

5. **FAQ (6 items, collapsible)** — schema.org FAQPage JSON-LD.

Keep total scroll to ~7 sections max: Hero → Social proof → Tools grid → Models strip → Feature bento (existing) → Comparison → Audience → Pricing → FAQ → CTA.

## 3. Footer — surface every tool landing page

Rebuild `src/components/Footer.tsx` with 5 columns matching the V3 dark theme:
- **Studios**: Repurpose, Shorts, Image, Carousel, SEO Blog, Thumbnail
- **Free Tools**: Humanizer, Reply Generator, Hook Generator, LinkedIn Downloader, YouTube→Blog, YouTube→Thread
- **For**: Creators, Agencies, Podcasters, YouTubers
- **Compare**: vs Buffer, Hootsuite, Jasper, Typefully, Repurpose.io, ChatGPT
- **Company**: Pricing, Blog, Changelog, Roadmap, Privacy, Terms, Data Deletion

## 4. Bring tool + feature + comparison pages into V3 system

- Create `src/components/landing/v3/ToolPageShell.tsx` — reusable shell with same background, typography, hero, CTA, footer.
- Migrate these to the shell (keep copy, swap chrome):
  - All `src/routes/tools.*.tsx`
  - All `src/routes/features.*.tsx`
  - All `src/routes/alternatives.*.tsx` (comparison pages)
  - All `src/routes/for.*.tsx`
  - `src/routes/use-cases.*.tsx`
- `SegmentPage.tsx` gets rewritten once — all tool pages inherit the new look automatically.

## 5. Copy polish

- Replace generic "AI content" phrases with outcome-led lines matching hero voice.
- Strip filler / duplicate CTAs on landing.
- Ensure single H1 per page, meta title/description already handled per route.

---

## Technical notes

- No new dependencies. Uses existing Tailwind tokens + V3 components.
- Logo generation via `imagegen` (premium tier for icon legibility).
- Comparison redesign is CSS/JSX only — same data.
- Tool page migration = swap outer wrapper in `SegmentPage.tsx`; no route changes, no SEO regressions (URLs, titles, JSON-LD preserved).
- No backend/schema changes.

## Out of scope (ask before doing)

- Rewriting pricing tiers or copy.
- Changing tool functionality.
- Adding new tools.
