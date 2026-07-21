
-- Phase 1: Multi-profile Brand Kit + Brand Voice
ALTER TABLE public.brand_kits DROP CONSTRAINT IF EXISTS brand_kits_user_id_key;
ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS logo_variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_swatches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS neutral_color text,
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS custom_fonts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS watermark_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Ensure only one active kit per user (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS brand_kits_one_active_per_user
  ON public.brand_kits(user_id) WHERE is_active = true;

ALTER TABLE public.brand_voices
  ADD COLUMN IF NOT EXISTS dos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS donts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tone_sliders jsonb NOT NULL DEFAULT '{"formality":50,"humor":50,"enthusiasm":50,"complexity":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS emoji_density text NOT NULL DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS sentence_length text NOT NULL DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS cta_style text NOT NULL DEFAULT 'soft',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS style_override text;
