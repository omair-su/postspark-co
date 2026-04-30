
# Premium Feature Upgrade Plan for RepurposeAI

## Current State
The app has: landing page, auth (email + Google), content repurposing (text/YouTube to tweets, LinkedIn, email, video script), history, PDF export, usage limits (3 free/month), and settings page.

## New Premium Features

### 1. More Output Formats (6 new types)
Add these content types to the repurpose engine:
- **Instagram Captions** (with hashtag suggestions)
- **Facebook Posts**
- **Blog Summary / SEO Meta Description**
- **TikTok/Reels Script**
- **Podcast Show Notes**
- **Thread (X/Twitter thread format)**

Update the content type selector, AI prompt, and result cards.

### 2. Tone & Style Controls
Let users choose the voice/style of generated content:
- Tone selector: Professional, Casual, Humorous, Inspirational, Educational
- Custom instructions field: "Write like [brand voice]" free-text input
- These get sent to the AI prompt for personalized output

### 3. Content Templates (Saved Prompts)
- Users can save their favorite tone + format combinations as reusable templates
- New `templates` database table (user_id, name, config JSON)
- Quick-apply from the repurpose page
- Pro feature only

### 4. Analytics Dashboard
A new `/dashboard/analytics` page showing:
- Content generated over time (bar chart by week/month)
- Most-used output formats (pie/donut chart)
- Total words generated
- Usage streak tracker
- All computed from existing `repurpose_jobs` data, no new tables needed

### 5. Favorites & Organization
- Star/bookmark individual outputs from history
- Add a `favorites` boolean column to `repurpose_jobs`
- Filter history by favorites
- Search history by input text

### 6. Bulk Export
- Export all history or selected items as a single PDF or CSV
- "Select All" checkbox in history view

### 7. Character/Word Count on Results
- Show word count and character count on each result card
- Show Twitter character limit indicator on tweet outputs

### 8. Regenerate Individual Sections
- Instead of regenerating everything, allow regenerating just one section (e.g., only tweets)
- New server function that takes a single output type

### 9. Dark/Light Theme Toggle
- Add theme switcher in navbar and settings
- Persist preference in localStorage
- Currently dark-only; add proper light theme support

### 10. Landing Page Enhancements
- Add a live demo/playground section (paste text, see sample output without login)
- Add FAQ/accordion section
- Add "Trusted by" logo bar
- Add a CTA banner before footer

## Technical Implementation

### Database Changes (2 migrations)
1. **Add `is_favorite` column** to `repurpose_jobs` (boolean, default false)
2. **Create `templates` table**: id, user_id, name, tone, custom_instructions, selected_types (jsonb), created_at
   - RLS: users can CRUD own templates only
   - Pro/Agency plan check enforced in server function

### New Files
- `src/routes/dashboard.analytics.tsx` -- analytics page
- `src/routes/dashboard.templates.tsx` -- templates management
- `src/components/ToneSelector.tsx` -- tone/style picker component
- `src/components/ThemeToggle.tsx` -- dark/light toggle
- `src/components/landing/FAQSection.tsx` -- FAQ accordion
- `src/components/landing/TrustedBySection.tsx` -- logo bar
- `src/components/landing/DemoSection.tsx` -- live demo
- `src/server/templates.functions.ts` -- template CRUD server functions
- `src/server/analytics.functions.ts` -- analytics data server function

### Modified Files
- `src/server/repurpose.functions.ts` -- add tone/custom instructions params, single-section regenerate
- `src/routes/dashboard.repurpose.tsx` -- add tone selector, new formats, per-section regenerate
- `src/routes/dashboard.history.tsx` -- favorites toggle, search, bulk export, bulk select
- `src/routes/dashboard.index.tsx` -- link to analytics
- `src/components/DashboardLayout.tsx` -- add Analytics and Templates nav items
- `src/routes/index.tsx` -- add new landing sections
- `src/routes/__root.tsx` -- theme provider
- `src/styles.css` -- light theme variables

### Charts
Use lightweight chart rendering with CSS or a small library (recharts) for the analytics dashboard.

### No Payments Changes
The upgrade buttons remain as-is. Payments can be added separately when you're ready (via Stripe integration with your own API keys).

## Priority Order
1. More output formats + tone controls (highest impact)
2. Favorites + search in history
3. Analytics dashboard
4. Templates
5. Theme toggle
6. Landing page enhancements
7. Bulk export
8. Per-section regenerate
