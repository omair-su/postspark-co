ALTER FUNCTION public.prevent_repurpose_jobs_protected_columns() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.prevent_repurpose_jobs_protected_columns() FROM PUBLIC, anon, authenticated;