
ALTER TABLE public.brand_voices ADD COLUMN IF NOT EXISTS quality_score integer;
ALTER TABLE public.repurpose_jobs ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_featured ON public.repurpose_jobs(is_featured, created_at DESC) WHERE is_featured = true;
