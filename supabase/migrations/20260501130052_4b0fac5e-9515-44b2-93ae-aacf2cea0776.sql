CREATE TABLE public.brand_voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  samples JSONB NOT NULL DEFAULT '[]'::jsonb,
  style_summary TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand voices"
  ON public.brand_voices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brand voices"
  ON public.brand_voices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand voices"
  ON public.brand_voices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand voices"
  ON public.brand_voices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX brand_voices_one_active_per_user
  ON public.brand_voices (user_id) WHERE is_active = true;

CREATE INDEX brand_voices_user_id_idx ON public.brand_voices (user_id);

CREATE TRIGGER update_brand_voices_updated_at
  BEFORE UPDATE ON public.brand_voices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();