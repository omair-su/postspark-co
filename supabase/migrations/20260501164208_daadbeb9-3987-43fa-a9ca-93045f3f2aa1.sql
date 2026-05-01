-- Tighten UPDATE policy on repurpose_jobs: prevent users from changing user_id and view_count via WITH CHECK + trigger
DROP POLICY IF EXISTS "Users can update own jobs" ON public.repurpose_jobs;

CREATE POLICY "Users can update own jobs"
ON public.repurpose_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Prevent privilege/integrity escalation: users may not modify view_count or change user_id
CREATE OR REPLACE FUNCTION public.prevent_repurpose_jobs_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  IF NEW.view_count IS DISTINCT FROM OLD.view_count THEN
    -- Only allow view_count changes when called by a privileged role (service_role)
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND auth.role() IS DISTINCT FROM 'service_role' THEN
      NEW.view_count := OLD.view_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_protected_cols_repurpose_jobs ON public.repurpose_jobs;
CREATE TRIGGER prevent_protected_cols_repurpose_jobs
BEFORE UPDATE ON public.repurpose_jobs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_repurpose_jobs_protected_columns();