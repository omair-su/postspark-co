REVOKE ALL ON FUNCTION public.cleanup_cron_job_run_details() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_cron_job_run_details() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_cron_job_run_details() FROM authenticated;