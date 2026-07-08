-- Performance support for frequently repeated PostgREST reads.
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created
  ON public.analytics_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_user_created
  ON public.repurpose_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_public_feed
  ON public.repurpose_jobs (is_featured DESC, created_at DESC)
  WHERE is_public = true AND public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_public_slug
  ON public.repurpose_jobs (public_slug)
  WHERE is_public = true AND public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_scheduled_for
  ON public.scheduled_posts (user_id, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_env_created
  ON public.subscriptions (user_id, environment, created_at DESC);

-- cron.job_run_details had grown to gigabytes of historical scheduler output while app data is tiny.
-- Truncating this extension-owned log table is fast and removes bloat that a large DELETE could not clear before timeout.
TRUNCATE TABLE cron.job_run_details;

CREATE OR REPLACE FUNCTION public.cleanup_cron_job_run_details()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = cron, public
AS $$
  DELETE FROM cron.job_run_details
  WHERE end_time < now() - interval '7 days';
$$;

SELECT cron.schedule(
  'cleanup-cron-job-run-details',
  '0 3 * * *',
  $$SELECT public.cleanup_cron_job_run_details();$$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-cron-job-run-details'
);