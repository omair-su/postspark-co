
# PostSpark — Traffic & Conversion SEO/GEO Plan

Goal: get PostSpark ranking on Google page 1 for buyer-intent + high-volume terms across all features (not just the homepage), be cited by AI engines (ChatGPT, Perplexity, Google AI Overviews), and turn that traffic into Pro/Agency upgrades.

## Phase 1 — Foundation fixes (this session)

Issue from screenshot: Google only shows the homepage as a single blue link. No sitelinks, no feature pages indexed prominently. Two root causes:

1. Weak per-page metadata + missing structured data on key feature/tool/use-case routes.
2. No internal linking hub pushing authority into feature pages.
3. No GEO (Generative Engine Optimization) signals: no `llms-full.txt`, weak FAQ schema coverage, no HowTo/SoftwareApp schema on tool pages.

Concrete changes:

- **Rewrite head() metadata** on every public-facing route to a buyer-intent template:
  - Title: `<Primary Keyword> — <Outcome> | PostSpark` (≤60 chars)
  - Description: hook + outcome + free-tier CTA (150–160 chars, keyword in first 100 chars)
  - Add `og:title`, `og:description`, `og:url`, `og:type`, `twitter:card`, canonical (leaf only)
  - Routes to upgrade: `pricing`, `tools.linkedin-video-downloader`, `dashboard.image-studio` landing (new public `/tools/ai-image-generator`), `tools.podcast-to-newsletter`, `tools.youtube-to-twitter-thread`, `tools.blog-to-linkedin-carousel`, `tools.newsletter-to-social`, `features.*`, `for.*`, `use-cases.*`, `alternatives.*`, `gallery`, `blog`.

- **Add JSON-LD per page type:**
  - Tools → `SoftwareApplication` + `HowTo` + `FAQPage`
  - Features → `SoftwareApplication` + `FAQPage`
  - Use-cases → `Article` + `FAQPage` + `BreadcrumbList`
  - Alternatives → `Article` + `ItemList` (comparison) + `FAQPage`
  - Pricing → `Product` with `Offer` for each tier
  - Blog post → `Article` + `BreadcrumbList` + `FAQPage` (already partial)

- **Homepage sitelinks fix:** add a `SiteNavigationElement` JSON-LD + `WebSite` `potentialAction` SearchAction in `__root.tsx`, and tighten the homepage internal nav so Google can extract sitelinks (Pricing, Tools, Gallery, Blog, Features).

## Phase 2 — Sitemap & robots upgrades

- Audit `src/routes/sitemap[.]xml.tsx`: confirm every public route above is present with correct `<priority>` and `<lastmod>`. Currently missing or under-prioritized: new public tool landing pages (image generator, podcast diarization), use-cases podcasters/youtubers, comparison pages, gallery `$slug`.
- Split into a sitemap index when >5k URLs: `sitemap.xml` → `sitemap-pages.xml`, `sitemap-blog.xml`, `sitemap-gallery.xml`, `sitemap-tools.xml`. Improves crawl budget.
- Add `<image:image>` extensions for blog posts and gallery entries so Google Images indexes them.
- `robots.txt`: keep current disallows; add `Allow: /api/public/` so demo/track endpoints used in landing JS aren't false-positive blocked; add explicit `User-agent: GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended` with `Allow: /` so AI engines index us. Add `Sitemap:` lines for each split sitemap.

## Phase 3 — Keyword strategy (high-volume, buyer-intent)

Target clusters (I'll pull exact volumes via Semrush before writing copy):

| Cluster | Primary keywords | Page that ranks |
|---|---|---|
| Repurposing | "content repurposing tool", "ai content repurposing", "repurpose blog to social" | `/`, `/features/repurpose-blog-to-social` |
| LinkedIn | "linkedin post generator", "linkedin carousel generator", "linkedin video downloader" | `/features/linkedin-post-generator`, `/tools/blog-to-linkedin-carousel`, `/tools/linkedin-video-downloader` |
| YouTube | "youtube to tweets", "youtube to thread generator", "youtube transcript to blog" | `/features/youtube-to-tweets`, `/tools/youtube-to-twitter-thread`, NEW `/tools/youtube-to-blog` |
| Podcast | "podcast to newsletter", "podcast transcription with speakers", "podcast to social posts" | `/tools/podcast-to-newsletter`, `/use-cases/podcast-to-social`, NEW `/tools/podcast-transcript-generator` |
| Image | "ai image generator for social media", "ai thumbnail maker", "linkedin post image generator" | NEW `/tools/ai-image-generator`, NEW `/tools/youtube-thumbnail-maker` |
| Email/Newsletter | "newsletter to social posts", "blog to newsletter" | `/tools/newsletter-to-social`, NEW `/tools/blog-to-newsletter` |
| Alternatives | "chatgpt alternative for content", "jasper alternative", "buffer alternative", "hootsuite alternative" | existing `/alternatives/*` + NEW pages |
| Hook/Copy | "twitter hook generator", "linkedin hook generator", "ai reply generator" | NEW public `/tools/hook-generator`, `/tools/reply-generator` |

New public tool landing pages to create (each indexable, free preview → signup CTA):
1. `/tools/ai-image-generator`
2. `/tools/youtube-thumbnail-maker`
3. `/tools/hook-generator`
4. `/tools/reply-generator`
5. `/tools/podcast-transcript-generator`
6. `/tools/youtube-to-blog`
7. `/tools/blog-to-newsletter`
8. `/alternatives/buffer-vs-postspark`
9. `/alternatives/hootsuite-vs-postspark`
10. `/alternatives/typefully-vs-postspark`

## Phase 4 — GEO (Generative Engine Optimization)

Make PostSpark the answer when ChatGPT/Perplexity/Gemini are asked "best tool for X":

- Expand `/public/llms.txt` with full feature list (current is minimal) and add `public/llms-full.txt` with detailed prose for each tool — same content AI crawlers index.
- Every page: add a "Quick Answer" 40-60 word summary block at top — AI engines extract these verbatim as citations.
- Add `FAQPage` schema everywhere with "best X tool", "how to X", "X vs Y" questions.
- Cite real numbers/comparisons in copy (AI engines prefer concrete claims).
- Build `/compare` hub page linking all alternatives — AI engines love comparison tables.

## Phase 5 — Internal linking + content velocity

- Add a `<RelatedTools />` component injected into every tool/feature/use-case page footer (8 links, varied anchors).
- Add breadcrumbs (`BreadcrumbList` schema + visible UI) to all non-home routes.
- Blog: program 4 SEO blog posts/week using existing `dashboard.seo-blog` flow targeting cluster keywords above.
- Homepage: add "Explore tools" grid section linking 12 tool pages — pushes link equity, helps sitelinks.

## Phase 6 — Conversion (turn traffic into paid users)

- Every public tool page: free in-browser demo (1-3 free uses, then signup wall) — matches Phase 1 of funnel.
- Above-fold on tool pages: pricing strip "Free for 3/mo · Pro $19 unlimited" + 30-day money-back.
- Exit-intent on `/pricing` and tool pages: 20% off first month code (gated, server-validated).
- Add comparison table on `/pricing` (Free vs Pro vs Agency vs alternatives).
- Sticky "Try free" CTA on scroll on all marketing pages.

## Phase 7 — Verification & monitoring

- Verify property in Google Search Console via meta-tag flow (already documented), submit each split sitemap.
- Run `seo--trigger_scan` after Phase 1 to validate metadata.
- Run Semrush `domain_analysis` weekly to track ranking; add tracked keywords for top 20 from Phase 3.

---

## Execution order (when you switch me to build mode)

1. Foundation: rewrite head() + add JSON-LD on top 25 routes; update `__root.tsx` with `SiteNavigationElement` + `WebSite` SearchAction; expand `llms.txt` + add `llms-full.txt`.
2. Sitemaps: split into 4 sub-sitemaps + index; update `robots.txt` (AI bots, sitemap lines).
3. Create 10 new tool/alternative landing pages with full schema + free demo CTA.
4. Build shared `<RelatedTools />` + `<Breadcrumbs />` + `<QuickAnswer />` components; inject into all marketing pages.
5. Pricing/comparison upgrades + exit-intent.
6. Trigger SEO rescan + run Semrush keyword research to refine titles before deploy.

Estimated: ~25–35 file changes. Mostly additive — no schema/db work.

## Open questions

- Should new tool pages run a live free demo (uses Lovable AI credits) or be marketing-only with "Try free" CTA? Live demo converts ~3× better but costs credits.
- Are the 10 proposed alternative/tool URLs OK, or do you want to prune/add?
- Pull exact Semrush volumes for the keyword clusters before writing titles, or proceed with my keyword guesses and refine later?
