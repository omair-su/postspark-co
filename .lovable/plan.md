# Brand Kit + Brand Voice — Pro Enterprise Overhaul

This is a large scope (~3 phases, several new tables, ~15–20 new components). To ship it safely without regressing the dark theme or breaking existing users, I'll deliver in **3 phases** and stop between each so you can verify. Everything reuses the existing dark tokens, Lucide icons, and Claude backend — no new paid APIs.

---

## Phase 1 — Data model + Multi-Profile foundation (backend + core UX)

**Highest leverage first: without this, nothing else scales to agencies.**

### Schema changes (migration)
- `brand_kits`: add `name`, `is_active`, `logo_variants jsonb` (primary/icon/light/dark), `colors jsonb` (5 roles + saved swatches array), `neutral_color`, `background_color`, `custom_fonts jsonb` (uploaded TTF/OTF URLs). Drop `UNIQUE(user_id)` — allow multiple kits per user.
- `brand_voices`: add `dos jsonb` (always-use phrases), `donts jsonb` (banned words), `tone_sliders jsonb` (formality/humor/enthusiasm/complexity 0–100), `emoji_density`, `sentence_length`, `cta_style`, `source_url text`.
- Bucket `brand-assets` — extend for 4 logo slots + custom font uploads.

### Backend server functions (`brandKit.functions.ts`, `brandVoice.functions.ts`)
- `listBrandKits`, `createBrandKit`, `setActiveBrandKit`, `deleteBrandKit`
- Same set for voices (list/create/activate/delete already partly exist — extend)
- `analyzeVoiceFromUrl` — server-side fetch + Claude summary (reuses `anthropic.server.ts`)
- `scoreVoiceMatch` — Claude self-eval, returns 0–100
- `generateVoicePreviews` — 3 short samples (tweet/LinkedIn/hook) after training
- `exportBrandGuide` — returns PDF via existing `jspdf` (client-side)

### UX
- Profile switcher dropdown at top of both pages ("Acme Corp ▾ / + New profile")
- Active kit/voice is auto-applied to Repurpose (already wired via `is_active`)

---

## Phase 2 — Brand Kit premium controls

- **Logo Vault**: 2×2 grid, 4 slots (primary/icon/light-bg/dark-bg), each with light+dark preview swatch beside it
- **Color System**:
  - 5 role slots + preset palettes (Electric SaaS, Neon Cyber, Warm Luxury, Minimalist)
  - Image-to-palette extractor (client-side canvas k-means, no API)
  - Auto tint/shade ramp (5 lighter + 5 darker per color)
  - "My Swatches" saved bank
  - Advanced picker with Hex/RGB/HSL tabs + copy buttons
- **Contrast Auto-Fix**: extends existing `contrast.ts` — when Fail, compute nearest AA-passing shade, "Apply suggested" button
- **Typography**:
  - Google Fonts search (categories: Sans/Serif/Display/Mono) via Google Fonts CSS API
  - Custom font upload (TTF/OTF/WOFF)
  - Suggested pairings row
  - Live preview card
- **Export Brand Guide**: single-click PDF summary
- **Watermark controls**: opacity + placement (already have brand watermark logic in `imageWatermark.ts`)

All styled with existing `bg-slate-900/60 backdrop-blur-xl border-slate-800/80` glass cards, Lucide icons at matching stroke.

---

## Phase 3 — Brand Voice premium controls

- **AI Extraction Hub** — tabs: Paste / Analyze URL / Upload doc
- **Visible Voice Profile card** — human-readable summary from Claude, user-editable (stored override)
- **Dimensional Tone Sliders** — 4 sliders with live % labels
- **Vocabulary Guardrails** — tag-chip inputs for Do's / Don'ts + formatting toggles (emoji density, sentence length, CTA style)
- **Live Test Bench** — sticky right-side panel, "topic → generate sample" using active kit + voice
- **Voice Match Score** — badge on generated content in Repurpose ("94% match"), regenerate button when <75%
- **Live sample previews** post-training (3 short samples auto-generated)

Repurpose integration: server-side prompt builder consumes tone sliders + dos/donts + custom instructions when active voice is set.

---

## Technical notes (for you, not required reading)

- No new paid APIs: Google Fonts is free CSS, Claude does voice analysis/scoring, color extraction is client-side canvas.
- Multiple profiles = schema change + drop unique constraint; existing single kits/voices auto-migrate as the user's first profile with `is_active=true`.
- Font uploads land in the existing `brand-assets` bucket under `<user_id>/fonts/`.
- All new server functions follow the existing `.middleware([requireSupabaseAuth])` + try/catch pattern.

---

## Delivery plan

- **This turn (if approved):** Phase 1 — schema migration, extended server functions, profile switcher on both pages. Nothing user-visible breaks; existing kit/voice becomes profile #1.
- **Next turn:** Phase 2 — full Brand Kit UI (logo vault, palette engine, contrast auto-fix, Google Fonts, export).
- **Turn after:** Phase 3 — full Brand Voice UI (extraction hub, sliders, guardrails, test bench, match score) + Repurpose wiring.

Each phase is independently shippable and testable. Approve to start Phase 1.
