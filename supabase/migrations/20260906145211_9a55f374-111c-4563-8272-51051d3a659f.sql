ALTER TABLE public.generated_images
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS seed bigint,
  ADD COLUMN IF NOT EXISTS negative_prompt text,
  ADD COLUMN IF NOT EXISTS reference_url text,
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS generated_images_user_created_idx ON public.generated_images (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.studio_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label text,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_references TO authenticated;
GRANT ALL ON public.studio_references TO service_role;

ALTER TABLE public.studio_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own studio references"
  ON public.studio_references FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_studio_references_updated_at ON public.studio_references;
CREATE TRIGGER update_studio_references_updated_at
  BEFORE UPDATE ON public.studio_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();