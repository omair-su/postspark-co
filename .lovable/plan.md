# PostSpark SEO Plan — Drive Organic Pro Signups

## Current state (audit)

| Area | Status |
|---|---|
| Root `<head>` meta | ✅ Good (title, description, OG, Twitter, canonical) |
| Per-route `head()` | ⚠️ Only ~6 pages have it; **most don't** (incl. `/pricing`) |
| `og-image.png` | ❌ Missing — 404 on every share |
| `sitemap.xml` | ⚠️ Static, only 4 URLs (missing gallery, blog, content pages) |
| `robots.txt` | ⚠️ Allows `/dashboard/*` and auth pages to be crawled |
| Structured data (JSON-LD) | ❌ None |
| Blog / content marketing | ❌ None — biggest organic-acquisition gap |
| Public Gallery indexing | ⚠️ Pages exist but no per-job meta or sitemap inclusion |
| Comparison / use-case pages | ❌ None (no "vs Buffer", "for agencies", etc.) |
| Page speed signals | ⚠️ Good preconnect, but no preloaded LCP image |

## Strategy

Organic Pro signups come from **three funnels**:
1. **Branded search** ("PostSpark") → already covered by root meta.
2. **Tool/feature search** ("AI tweet generator", "repurpose blog post to LinkedIn") → needs landing pages + per-route meta + JSON-LD `SoftwareApplication`.
3. **Content/use-case search** ("how to repurpose a YouTube video", "agency content workflow") → needs a blog and use-case pages.

This plan covers all three.

---

## Phase 1 — Technical SEO foundation

### 1.1 Per-route `head()` for every public page

Add unique `title`, `description`, `og:title`, `og:description`, `canonical` to:
- `/pricing` — *"PostSpark Pricing — Free, Pro $19/mo, Agency $49/mo"*
- `/login`, `/signup` — set `noindex` (auth pages shouldn't compete with `/`)
- `/privacy`, `/terms`, `/refunds` — short descriptive title + `noindex` is acceptable, but indexable trust pages also help
- `/gallery` — *"Content Inspiration Gallery — See AI-Repurposed Posts"*
- `/gallery/$slug` — dynamic from loader: job title + first 160 chars of input as description, OG image from job's first generated image
- `/review/$token`, `/invite/$token`, `/checkout/success`, `/auth/callback`, `/onboarding`, `/reset-password`, `/unsubscribe` — `noindex, nofollow` (private/transactional)

Each page also gets a route-specific `<link rel="canonical">`.

### 1.2 Create real OG image

Generate `/public/og-image.png` (1200×630) with PostSpark logo, tagline "Turn 1 Post Into 30. Instantly.", brand gradient. Same image used as Twitter card and root OG. Currently 404s on every share — fixing this alone improves CTR from social.

### 1.3 Dynamic sitemap as a server route

Replace static `public/sitemap.xml` with `src/routes/sitemap[.]xml.tsx` (TanStack server route). Includes:
- All static public routes with realistic `priority` and `changefreq`
- All public Gallery jobs (`repurpose_jobs WHERE is_public = true`) with `lastmod` from `created_at`
- All blog posts (Phase 3)

Re-fetched on every request so new gallery items + blog posts appear automatically.

### 1.4 Tighten `robots.txt`

```text
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /onboarding
Disallow: /auth/
Disallow: /checkout/
Disallow: /invite/
Disallow: /review/
Disallow: /reset-password
Disallow: /unsubscribe

Sitemap: https://postspark.co/sitemap.xml
```

### 1.5 Structured data (JSON-LD)

- **Root**: `Organization` (name, logo, sameAs social links) + `WebSite` with `SearchAction`.
- **Pricing page**: `Product` with three `Offer` entries (Free, Pro $19, Agency $49).
- **Gallery item pages**: `CreativeWork` with author, datePublished.
- **Blog posts** (Phase 3): `Article` with author, datePublished, image.
- **FAQ section** on landing: `FAQPage` markup → eligible for rich-result FAQ snippets.

### 1.6 Performance signals (Core Web Vitals)

- Preload the hero LCP image (or use inline SVG hero).
- Add `fetchpriority="high"` to the hero image.
- Audit `framer-motion`-free CSS animations (already enforced by project rules).
- Add `width`/`height` on every `<img>` to prevent CLS.

---

## Phase 2 — Conversion-focused landing pages

These are **separate routes** (not hash anchors) so each ranks independently:

| Route | Target query | Purpose |
|---|---|---|
| `/features/repurpose-blog-to-social` | "repurpose blog post to social media" | Long-tail capture |
| `/features/youtube-to-tweets` | "youtube video to tweets" | Long-tail capture |
| `/features/linkedin-post-generator` | "AI LinkedIn post generator" | Mid-tail capture |
| `/for/agencies` | "content repurposing for agencies" | Agency-tier acquisition |
| `/for/creators` | "content tools for creators" | Pro-tier acquisition |
| `/compare/postspark-vs-buffer` (etc.) | "X vs PostSpark" | Comparison searches |

Each page: hero, 3 benefits, 1 demo/screenshot, FAQ, CTA → signup. All linked from the footer for internal-link equity.

---

## Phase 3 — Content marketing engine (highest organic ROI)

### 3.1 Blog infrastructure

- New routes: `/blog` (index) and `/blog/$slug` (post).
- New table `blog_posts` (slug, title, excerpt, content_md, cover_image_url, author, published_at, status).
- MDX or markdown rendering with `marked` + DOMPurify (already Worker-safe).
- Each post: `<Article>` JSON-LD, OG image = cover image, canonical, RSS feed at `/rss.xml`.
- Blog index + each post auto-included in dynamic sitemap.

### 3.2 Launch content (10 cornerstone posts)

Topics chosen for search volume + buyer intent:
1. "How to repurpose a blog post into 10 tweets (with examples)"
2. "The agency guide to content repurposing workflows"
3. "AI vs human content repurposing: a 2026 comparison"
4. "How to turn a YouTube video into a LinkedIn carousel"
5. "Email newsletter from blog: 5-minute workflow"
6. "Building a brand voice AI can actually copy"
7. "Hook lab: 50 LinkedIn opening lines that convert"
8. "From SEO blog to social posts in one click"
9. "Content batching for solo creators (case study)"
10. "Why repurposing beats creating new content (data)"

Each post links naturally to relevant feature pages → Pro CTA.

---

## Phase 4 — Off-page & ongoing

(Outside code, but listed so you can track):
- Submit `sitemap.xml` to Google Search Console + Bing Webmaster.
- Verify domain in GSC, monitor Core Web Vitals + indexed pages weekly.
- Add PostSpark to Product Hunt, AlternativeTo, G2, Capterra, There's An AI For That.
- Build internal link graph: footer links every feature/blog page from every page.
- Add testimonials with `Person` + `Review` JSON-LD.

---

## Implementation order

```text
Sprint A (1 session) — Foundation
  ├─ Per-route head() for all public pages
  ├─ OG image generation + commit to /public/og-image.png
  ├─ Dynamic sitemap route + tightened robots.txt
  └─ JSON-LD: Organization, WebSite, Product (pricing), FAQPage (landing)

Sprint B (1 session) — Conversion pages
  ├─ /features/* (3 pages)
  ├─ /for/agencies, /for/creators
  └─ Footer link mesh

Sprint C (1 session) — Blog engine
  ├─ blog_posts table + admin UI to publish (or seed via SQL)
  ├─ /blog and /blog/$slug routes with markdown rendering
  ├─ RSS feed
  └─ Article JSON-LD + sitemap inclusion

Sprint D (ongoing) — Content
  └─ Publish 10 cornerstone posts using existing seo-blog generator
```

---

## Technical notes (skip if non-technical)

- Sitemap uses TanStack server route file `src/routes/sitemap[.]xml.tsx` returning `text/xml`. Reads `repurpose_jobs WHERE is_public = true` and `blog_posts WHERE status='published'` via `supabaseAdmin`.
- All `head()` follow the project's existing TanStack `createFileRoute({ head: () => ({...}) })` pattern; child meta override root meta automatically.
- `noindex` pages get `<meta name="robots" content="noindex,nofollow">` in `head()` AND `Disallow:` in robots.txt (belt + braces).
- Gallery item OG image derives from `job.outputs.images?.[0] ?? '/og-image.png'` so every shared link has a unique preview.
- Blog posts use `marked` (~30KB, Worker-safe) for MD→HTML; sanitized with `DOMPurify` to prevent XSS in author content.
- JSON-LD injected via `head().scripts: [{ type: 'application/ld+json', children: JSON.stringify(...) }]`.

## What I won't touch unless you ask

- Existing dashboard routes (already `noindex`-equivalent since auth-gated).
- Brand voice / colors / copy — SEO-only changes.
- Paddle/payment flows.
- The `generated-images` public bucket (you accepted this risk).

## Expected outcome

Working backwards from goal: **organic Pro signups**. Phase 1 fixes the foundation that makes everything else effective (correct OG, sitemap, structured data → 2-4× CTR from search/social on existing traffic). Phase 2 captures bottom-funnel buyer queries. Phase 3 captures top-funnel awareness queries and feeds them into the funnel. Phase 4 is distribution.

Realistic timeline to first organic Pro signups: **2-3 weeks after Sprint C ships** (Google indexing + ranking lag), accelerating from month 2 onward as content accumulates.

Approve and I'll start with **Sprint A** (foundation) in the next message.
