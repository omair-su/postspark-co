ALTER TABLE public.repurpose_jobs ADD COLUMN IF NOT EXISTS series_id uuid;
ALTER TABLE public.repurpose_jobs ADD COLUMN IF NOT EXISTS series_index int;
CREATE INDEX IF NOT EXISTS repurpose_jobs_series_id_idx ON public.repurpose_jobs(series_id);