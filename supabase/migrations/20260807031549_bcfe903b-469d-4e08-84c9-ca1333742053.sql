CREATE TABLE IF NOT EXISTS public.user_canva_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  canva_design_id text NOT NULL,
  design_title text,
  design_type text NOT NULL DEFAULT 'thumbnail',
  platform text,
  format_width integer,
  format_height integer,
  thumbnail_url text,
  export_urls text[] NOT NULL DEFAULT '{}',
  slide_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  canva_edit_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_canva_designs TO authenticated;
GRANT ALL ON public.user_canva_designs TO service_role;

ALTER TABLE public.user_canva_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own canva designs" ON public.user_canva_designs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own canva designs" ON public.user_canva_designs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own canva designs" ON public.user_canva_designs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own canva designs" ON public.user_canva_designs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_canva_designs_user_type
  ON public.user_canva_designs(user_id, design_type);

CREATE TRIGGER update_user_canva_designs_updated_at
  BEFORE UPDATE ON public.user_canva_designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('twitter','x','linkedin','threads','facebook','instagram','tiktok','youtube','pinterest','canva'));