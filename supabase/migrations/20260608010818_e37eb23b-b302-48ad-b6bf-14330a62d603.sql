CREATE TABLE public.swipe_file (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  platform TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.swipe_file TO authenticated;
GRANT ALL ON public.swipe_file TO service_role;

ALTER TABLE public.swipe_file ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own swipe items"
  ON public.swipe_file FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX swipe_file_user_idx ON public.swipe_file(user_id, created_at DESC);

CREATE TRIGGER update_swipe_file_updated_at
  BEFORE UPDATE ON public.swipe_file
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();