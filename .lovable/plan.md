# Guided Studios v2 — World-class rebuild

Convert the 4 modal-based guided tools (Founder Lesson, Creator Playbook, Product Launch, Marketing Tip) into full dedicated pages with multi-step wizards, platform selectors, advanced AI outputs, and shared output utilities.

## 1. Routing & shell

Create 4 new route files (replacing the modal flow):
- `src/routes/dashboard.guided.founder-lesson.tsx`
- `src/routes/dashboard.guided.creator-playbook.tsx`
- `src/routes/dashboard.guided.product-launch.tsx`
- `src/routes/dashboard.guided.marketing-tip.tsx`

Shared layout pieces in `src/components/guided/`:
- `GuidedStudioShell.tsx` — sticky header (icon badge, title, subtitle, back), step indicator, 2-col desktop / stacked mobile, sticky mobile generate button.
- `StepIndicator.tsx`, `PlatformSelector.tsx`, `FormatChip.tsx`, `WillGenerateBox.tsx`, `GenerateButton.tsx`, `CharCounter.tsx`, `StudioField.tsx`.
- `OutputPanel.tsx` — tabs per format, Copy / Save to Swipe / Download .txt / Download .pdf / Regenerate variations / Edit with AI buttons.
- `HookCard.tsx` — hook + score, "Use this hook" selector (Founder Lesson).
- `CarouselPreview.tsx` — slide-by-slide editable preview, "Send to Image Studio" (Creator Playbook).

Update dashboard tile clicks: route to new pages instead of opening `GuidedIntakeModal`. Keep modal as deprecated/removed.

Card grid restyle in `dashboard.index.tsx` / `ToolTile.tsx`:
- Colored top gradient stripe per card (purple / amber / pink / green).
- Icon badge with tinted bg, output-format pills row at bottom, "Start →" CTA, usage badge ("Most Popular" / "New").

## 2. Server-side AI engines

New files in `src/server/`:
- `founderLesson.server.ts` — generates 3 scored hooks + outputs per selected platform, accepts lesson type / tone / length / hook style.
- `creatorPlaybook.server.ts` — accepts playbook format (step-by-step, myth-vs-reality, before-after, framework, checklist, secrets), generates carousel slides (10) + thread + LinkedIn + IG captions.
- `productLaunch.server.ts` — product-type-aware (physical, SaaS, digital, service, subscription); generates Shopify desc, FB/IG ad (primary+headline+CTA), TikTok script, Google Search ad, Amazon listing, launch email / 3-email sequence, organic posts.
- `marketingTip.server.ts` — channel-aware, content-angle aware; generates platform outputs + optional 7-day content plan.

All use existing `callClaude` / `callClaudeWithTool` from `anthropic.server.ts`. Structured tool-use for hook scoring and carousel slides.

Matching client function files in `src/lib/`:
- `founderLesson.functions.ts`, `creatorPlaybook.functions.ts`, `productLaunch.functions.ts`, `marketingTip.functions.ts`

Each uses `createServerFn` with `requireSupabaseAuth`, enforces usage limits via existing `assertCanRepurpose` pattern, increments usage on success, applies brand voice if Pro.

## 3. Swipe file

New table `swipe_file` (user_id, type, title, content, platform, created_at). RLS: user owns rows. Used by "Save to Swipe File" on every output.

## 4. Shared output features

In `OutputPanel.tsx`:
- Copy button with 2s "Copied! ✓" success state.
- Download .txt (client `Blob`), Download .pdf (reuse `src/lib/exportPdf.ts`).
- Save to Swipe File (server fn → `swipe_file` table).
- Regenerate variations: different angle / tone / shorter / more data.
- Edit with AI: small prompt → re-calls server fn with edit instruction.
- Schedule → push to calendar (reuse existing calendar fn).

## 5. Styles

Add tokens / utility classes to `src/styles.css` under `@layer components`:
- `.studio-input`, `.studio-textarea`, `.studio-form-label`, `.platform-chip[.selected]`, `.will-generate-box`, `.generate-btn`, `.copy-btn[.copied]`, `.char-counter`, guided-studio-card stripes.

Use design tokens (oklch from existing palette) — purple matches existing `--primary`.

## 6. Mobile

Full-screen scrollable form, sticky generate button with safe-area inset, compact step indicator, 1-col platform chips wrapping, output tabs become horizontal scroll.

## Out of scope this pass
- Real virality scoring model (hook scores come from Claude rationale only).
- Live preview pane that updates as user types (output appears after generate).
- Product URL auto-extract (placeholder field; extraction lands later).
- Per-output A/B test harness beyond regenerate variations.

After approval I'll build it in this order: migration → shared components + styles → server engines + functions → 4 pages → wire dashboard tiles → test build.
