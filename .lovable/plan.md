
## Goal

Ship a compliant Unsplash + Pexels stock media integration so PostSpark users can search millions of premium photos and videos from inside the app, and so we can pass Unsplash's production API review.

## 1. Secrets

Request via `add_secret`:
- `UNSPLASH_ACCESS_KEY` (server, required)
- `PEXELS_API_KEY` (already present — reuse)

Server-only. Never exposed to browser.

## 2. Server functions — `src/lib/stockMedia.functions.ts` + `src/server/stockMedia.server.ts`

Auth-protected via `requireSupabaseAuth`. All three endpoints:

- `searchStockPhotos({ query, source: 'unsplash' | 'pexels' | 'all', page, orientation })` — returns normalized `StockPhoto[]`:
  ```
  { id, source, thumbUrl, regularUrl, fullUrl, width, height,
    photographerName, photographerUrl, // Unsplash: with utm_source=postspark&utm_medium=referral
    sourceUrl,                          // link to photo page on provider
    downloadLocation?                   // Unsplash only, server-side use
  }
  ```
- `searchStockVideos({ query, source: 'pexels', page, orientation })` — Pexels videos only (Unsplash has no video API).
- `trackUnsplashDownload({ downloadLocation })` — server-side GET to `photo.links.download_location` with `Client-ID` header. Called every time a user picks/inserts/downloads an Unsplash photo. Fire-and-forget, returns `{ ok: true }`.

Photographer URL format: `https://unsplash.com/@{username}?utm_source=postspark&utm_medium=referral`. "Unsplash" brand link: `https://unsplash.com/?utm_source=postspark&utm_medium=referral`.

## 3. Reusable UI — `src/components/stock/`

- `StockMediaPicker.tsx` — dialog/panel with search input, source tabs (All / Unsplash / Pexels / Videos), orientation filter, infinite-scroll grid. Emits `onSelect(item)`. On select for Unsplash, calls `trackUnsplashDownload` before firing `onSelect`.
- `StockPhotoCard.tsx` — renders hotlinked `regularUrl` (never re-hosted). Bottom-left overlay attribution with dark gradient:
  - "Photo by [Name] on Unsplash" — 11px, `rgba(255,255,255,0.9)`, both links `target="_blank" rel="noopener noreferrer nofollow"`, always visible, never cropped.
  - Pexels equivalent: "Photo by [Name] on Pexels" (best-practice parity).
- `StockAttribution.tsx` — standalone attribution component reused wherever a selected stock photo is displayed inline (previews, published outputs).

## 4. Integration points

Hook `StockMediaPicker` into:
- **AI Image Studio** (`src/routes/dashboard.image-studio.tsx` if present) — add "Stock" tab next to AI generate.
- **Thumbnail & Cover Generator** — add "Use stock background" button.
- **Shorts Studio** — extend existing Pexels video search to use the new normalized picker, and add Unsplash photos as still overlays.
- **New page**: `src/routes/dashboard.stock-gallery.tsx` — full-screen browsable gallery, main entry point.
- **Public marketing route**: `src/routes/tools.stock-photos.tsx` — SEO landing "Free stock photos & videos inside PostSpark".

Wherever a picked Unsplash photo is later rendered (preview, exported post, thumbnail export), the attribution follows the image via `StockAttribution`. When Unsplash photo is inserted into a scheduled social post, prepend `Photo by {name} on Unsplash` to the caption automatically (per Unsplash guideline for social use).

## 5. Storage rule

Never re-upload Unsplash images to our bucket. Only store metadata in `stock_media_uses` (new table) for tracking:
- `user_id, source, external_id, regular_url, photographer_name, photographer_url, download_location, used_in, created_at`
- RLS: user reads/writes own rows; service_role all; GRANT to authenticated + service_role.

For Pexels the same table applies (source='pexels'), attribution shown similarly.

## 6. Compliance checklist (to satisfy Unsplash review email)

- [x] Attribution visible on every displayed Unsplash photo (search results, previews, exports).
- [x] Photographer name links to their Unsplash profile with UTM.
- [x] "Unsplash" brand links to unsplash.com with UTM.
- [x] `download_location` triggered on every "use" (select/insert/download/set-as-background).
- [x] Hotlinked `urls.regular` / `urls.full`; no re-hosting.
- [x] Social-post caption auto-prepends photographer credit.

## 7. Screenshot for submission

After deploy, open `postspark.co/dashboard/stock-gallery`, search, and screenshot with the URL bar visible showing attribution on cards.

## Technical notes

- Rate-limit search endpoints per user (in-memory Map): 30 req/min.
- Cache search results in-memory 60s to reduce API calls.
- Unsplash key stays server-only; `trackUnsplashDownload` runs on server so client never sees the key.
- No database migration for stock_media_uses in v1 if we skip analytics — but recommended to include so we can report to Unsplash if asked.

Ready to implement on approval.
