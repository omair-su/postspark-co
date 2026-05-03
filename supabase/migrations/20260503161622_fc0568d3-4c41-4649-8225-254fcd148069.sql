-- Audit log table
CREATE TABLE public.approval_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL,
  job_id uuid NOT NULL,
  workspace_id uuid,
  actor_user_id uuid,
  actor_label text,
  action text NOT NULL,
  old_status text,
  new_status text,
  client_name text,
  client_comment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_audit_approval ON public.approval_audit_log(approval_id, created_at DESC);
CREATE INDEX idx_approval_audit_workspace ON public.approval_audit_log(workspace_id, created_at DESC);

ALTER TABLE public.approval_audit_log ENABLE ROW LEVEL SECURITY;

-- Read access: workspace members or the approval creator
CREATE POLICY "members view approval audit"
ON public.approval_audit_log
FOR SELECT
TO authenticated
USING (
  actor_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.approval_requests a
    WHERE a.id = approval_audit_log.approval_id
      AND (
        a.created_by = auth.uid()
        OR (a.workspace_id IS NOT NULL AND public.is_workspace_member(a.workspace_id, auth.uid()))
      )
  )
);

-- No INSERT/UPDATE/DELETE policies → only service_role / SECURITY DEFINER trigger may write.

-- Trigger function
CREATE OR REPLACE FUNCTION public.log_approval_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _action text;
  _old text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'created';
    _old := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
      RETURN NEW; -- only log status changes
    END IF;
    _action := 'status_changed';
    _old := OLD.status;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.approval_audit_log(
    approval_id, job_id, workspace_id,
    actor_user_id, actor_label,
    action, old_status, new_status,
    client_name, client_comment
  ) VALUES (
    NEW.id, NEW.job_id, NEW.workspace_id,
    _actor,
    COALESCE(NEW.client_name, NEW.client_email, CASE WHEN _actor IS NULL THEN 'public_link' ELSE NULL END),
    _action, _old, NEW.status,
    NEW.client_name, NEW.client_comment
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_approval_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER approval_requests_audit
AFTER INSERT OR UPDATE ON public.approval_requests
FOR EACH ROW EXECUTE FUNCTION public.log_approval_change();