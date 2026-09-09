ALTER TABLE public.generated_images ADD COLUMN IF NOT EXISTS quality text;

CREATE TABLE public.image_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'replicate',
  prediction_id text,
  poll_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  model text,
  prompt text NOT NULL,
  full_prompt text,
  style text,
  aspect text,
  template text,
  quality text,
  seed bigint,
  negative_prompt text,
  reference_url text,
  source text NOT NULL DEFAULT 'generate',
  reservation_id uuid,
  image_url text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.image_jobs TO authenticated;
GRANT ALL ON public.image_jobs TO service_role;

ALTER TABLE public.image_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own image jobs"
  ON public.image_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_image_jobs_user_created ON public.image_jobs (user_id, created_at DESC);
CREATE INDEX idx_image_jobs_pending ON public.image_jobs (status, created_at) WHERE status = 'pending';

CREATE TRIGGER update_image_jobs_updated_at
  BEFORE UPDATE ON public.image_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();