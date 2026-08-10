ALTER TABLE public.social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform = ANY (ARRAY['twitter','linkedin','facebook','instagram','threads','tiktok','youtube','pinterest','canva','whatsapp','google']));

CREATE TABLE IF NOT EXISTS public.google_doc_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_doc_id text NOT NULL,
  google_doc_url text NOT NULL,
  document_title text,
  source_tool text,
  content_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_doc_exports TO authenticated;
GRANT ALL ON public.google_doc_exports TO service_role;

ALTER TABLE public.google_doc_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own google doc exports" ON public.google_doc_exports;
CREATE POLICY "Users manage own google doc exports"
  ON public.google_doc_exports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_google_exports_user ON public.google_doc_exports(user_id, created_at DESC);

CREATE TRIGGER update_google_doc_exports_updated_at
  BEFORE UPDATE ON public.google_doc_exports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();