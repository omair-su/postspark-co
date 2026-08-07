ALTER TABLE public.user_canva_designs
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_urls text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.canva_design_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  design_row_id uuid NOT NULL REFERENCES public.user_canva_designs(id) ON DELETE CASCADE,
  canva_design_id text NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  label text,
  source text NOT NULL DEFAULT 'export',
  design_title text,
  thumbnail_url text,
  export_urls text[] NOT NULL DEFAULT '{}'::text[],
  slide_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS canva_design_versions_row_idx
  ON public.canva_design_versions(design_row_id, version_number DESC);

GRANT SELECT ON public.canva_design_versions TO authenticated;
GRANT ALL ON public.canva_design_versions TO service_role;

ALTER TABLE public.canva_design_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Canva design versions"
  ON public.canva_design_versions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);