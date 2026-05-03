
-- Fix approval_requests permissive policies
DROP POLICY IF EXISTS "public view by token select" ON public.approval_requests;
DROP POLICY IF EXISTS "anyone can update approval by token" ON public.approval_requests;

CREATE POLICY "members view approvals" ON public.approval_requests FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  );

CREATE POLICY "members update approvals" ON public.approval_requests FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  );

-- Token-based public access via SECURITY DEFINER RPCs
CREATE OR REPLACE FUNCTION public.get_approval_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'status', a.status,
    'client_name', a.client_name,
    'client_comment', a.client_comment,
    'decided_at', a.decided_at,
    'created_at', a.created_at,
    'job', jsonb_build_object(
      'id', j.id,
      'title', j.title,
      'input_text', j.input_text,
      'outputs', j.outputs
    ),
    'workspace_white_label', COALESCE(w.white_label, false),
    'workspace_name', w.name
  ) INTO result
  FROM public.approval_requests a
  JOIN public.repurpose_jobs j ON j.id = a.job_id
  LEFT JOIN public.workspaces w ON w.id = a.workspace_id
  WHERE a.token = _token;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_approval(
  _token text,
  _status text,
  _client_name text,
  _client_comment text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _status NOT IN ('approved','changes_requested') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.approval_requests
    SET status = _status,
        client_name = COALESCE(_client_name, client_name),
        client_comment = COALESCE(_client_comment, client_comment),
        decided_at = now()
  WHERE token = _token AND status = 'pending';
  RETURN FOUND;
END;
$$;

-- Lock down execute permissions
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.workspace_role(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_role(uuid, uuid) TO authenticated;

-- Token RPCs are intentionally callable by anon (clients without accounts)
GRANT EXECUTE ON FUNCTION public.get_approval_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_approval(text, text, text, text) TO anon, authenticated;
