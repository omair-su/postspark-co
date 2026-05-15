
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS tagline text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_key ON public.profiles (lower(handle)) WHERE handle IS NOT NULL;

ALTER TABLE public.repurpose_jobs
  ADD COLUMN IF NOT EXISTS hook_variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS winning_hook_index integer;

-- Allow the public to read minimal profile fields needed by the showcase page.
DROP POLICY IF EXISTS "Public can view creator showcase fields" ON public.profiles;
CREATE POLICY "Public can view creator showcase fields"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (handle IS NOT NULL);
