CREATE TABLE public.humanizer_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  source_hash TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics_before JSONB,
  metrics_after JSONB,
  meaning JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.humanizer_runs TO authenticated;
GRANT ALL ON public.humanizer_runs TO service_role;

ALTER TABLE public.humanizer_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own humanizer runs"
  ON public.humanizer_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save their own humanizer runs"
  ON public.humanizer_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own humanizer runs"
  ON public.humanizer_runs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own humanizer runs"
  ON public.humanizer_runs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX humanizer_runs_user_created_idx ON public.humanizer_runs (user_id, created_at DESC);
CREATE INDEX humanizer_runs_source_hash_idx ON public.humanizer_runs (user_id, source_hash, version);

CREATE TRIGGER update_humanizer_runs_updated_at BEFORE UPDATE ON public.humanizer_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();