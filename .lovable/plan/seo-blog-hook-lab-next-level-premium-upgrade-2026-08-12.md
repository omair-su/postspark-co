# SEO Blog + Hook Lab — Next-Level Premium Upgrade

Both tools work, but they are the two least finished surfaces in the workspace: they still use hardcoded light-mode colors (broken in the default dark theme), they throw away half of what the AI already returns, and they lose everything the moment you leave the page. This plan turns both into flagship, agency-grade tools.

**Everything below is implemented in a single session — no phases, no "next turn" follow-ups.**

## What's broken or missing today

SEO Blog (`src/routes/dashboard.seo-blog.tsx`)
- Cards, previews and pills are hardcoded `bg-white` / `#1A1A2E` / `#FAFAF8` / `#E5E7EB` — text goes invisible in dark mode (dark is the default theme).
- The article is dumped into a raw `<pre>` block. No rendered preview, no editing, no per-section regeneration.
- The server already returns `competitorHeadings` and `suggestedInternalLinks` in the outline step — the UI never displays them.
- SEO score is a single number with no breakdown, no keyword density, no readability, no fix list.
- Exports are `.md` / `.txt` / Google Docs only. No HTML, no FAQ JSON-LD schema, no WordPress-ready output.
- Generations are saved to history in the background but there is no way to reopen a past article.
- No cover image, no internal-link injection, no publish path into the site blog.

Hook Lab (`src/routes/dashboard.hook-lab.tsx`)
- Same hardcoded-light-color problem; one card even mixes a dark navy gradient with dark text (top hook is unreadable in light mode).
- "Save to Swipe File" only fires a toast. A real `swipe_file` table already exists and is unused here.
- No per-hook remix/regenerate, no character counts or platform limit warnings, no score breakdown.
- The A/B picker just copies two strings. The database already has `hook_variants` and `winning_hook_index` for real A/B tracking.
- No history of past hook runs, no series/thread mode, no direct "schedule this hook" path.

## What we build

### 1. One premium visual language (both pages)
- Rebuild every card, pill, label, preview and output block on the existing token system (`pw-surface`, `pw-hero`, `ds-*` vars, `SpotlightCard`, `LiquidTabs`) so both pages match Repurpose Studio and are perfect in light and dark.
- Two-column premium layout on desktop: sticky configuration rail on the left, live output canvas on the right (single column on mobile).
- `LiquidTabs` for the SEO Blog's three modes instead of plain buttons.
- Glass output cards with brand-glow hover, staggered reveal on results, and the shimmer (`lux-flow`) loader instead of a spinner-only button.
- Zero hardcoded hex colors left in either file.

### 2. SEO Blog — advanced writer features
- **Rendered article preview** with a Preview / Markdown / HTML toggle. Preview renders headings, lists, tables and callouts properly.
- **Inline editing** of the generated article, plus per-section "Regenerate this section", "Expand", "Shorten" and "Add example" actions.
- **SEO Analyzer panel**: keyword density (primary + each secondary), title/meta length meters with green/amber/red bars, heading distribution, word count vs target, readability grade, internal/external link count — each with a one-line fix suggestion. Score becomes a ring with the full breakdown behind it.
- **Competitor intelligence display**: show the scraped competitor headings side by side with our outline, and flag the topics they cover that we don't ("content gaps").
- **Internal links**: render the suggested internal links and add one-click "insert into article" using the natural anchor.
- **Export suite**: Markdown, plain text, HTML, and FAQ + Article JSON-LD schema block, plus existing Google Docs export.
- **Cover image**: generate a hero image for the article from the title, using the existing image tooling and brand kit colors.
- **Outline → Article handoff** actually carries the approved outline into the generation prompt (today it only switches tabs).
- **History drawer**: recent SEO Blog runs pulled from generation history, one click to reopen with all outputs.

### 3. Hook Lab — advanced hook features
- **Real Swipe File**: save/unsave any hook to the existing `swipe_file` table, with a saved-hooks drawer, platform tag and search.
- **Per-hook actions**: Remix (5 new variants of that one hook), tone shift, shorten, and character count with a per-platform limit warning.
- **Score breakdown**: each hook shows its trigger (curiosity / controversy / relatability / aspiration / FOMO) plus a mini bar for pattern strength, specificity and platform fit — not just one number.
- **Real A/B lab**: pick two hooks, save them as tracked variants against a job, mark a winner, and see your win-rate history by framework so the tool learns which patterns work for this user.
- **Thread / series mode**: turn a winning hook into a 5-post connected arc with cliffhangers.
- **Send anywhere**: schedule a hook to the Calendar, push to the Publishing Center, or send to Repurpose (today only Repurpose exists).
- **History drawer**: past hook runs reopenable, grouped by topic and platform.
- **Empty and loading states**: illustrated empty state with sample prompts, shimmer skeleton cards during generation.

### 4. Server-side depth
- Richer prompts: SEO Blog gets the approved outline, brand voice and competitor gaps injected; Hook Lab returns structured trigger/score components.
- New server functions for section regeneration, hook remix, series mode, swipe-file CRUD and HTML/schema generation.
- Everything stays behind the existing Pro gate and generation limits.

## Technical notes

- Files touched: `src/routes/dashboard.seo-blog.tsx`, `src/routes/dashboard.hook-lab.tsx`, `src/lib/seoBlog.server.ts`, `src/lib/seoBlog.functions.ts`, `src/lib/hookLab.server.ts`, `src/lib/hookLab.functions.ts`, plus new components under `src/components/seo/` and `src/components/hooks/`.
- New small components: `SeoAnalyzerPanel`, `ArticlePreview`, `CompetitorGapPanel`, `ExportBar`, `HookCard`, `SwipeFileDrawer`, `HookScoreBars`, `ToolHistoryDrawer` (shared).
- Swipe file uses the existing `swipe_file` table (owner-scoped RLS already in place). A/B tracking uses the existing `repurpose_jobs.hook_variants` / `winning_hook_index` columns. No new tables needed.
- Markdown rendering uses the project's existing markdown path; no new heavy dependency.
- All new server functions live in `*.functions.ts` thin wrappers with logic in `*.server.ts`, following the current pattern, and keep `requireSupabaseAuth`.
- Analyzer math (density, readability, length meters) runs client-side so it updates live while editing.
