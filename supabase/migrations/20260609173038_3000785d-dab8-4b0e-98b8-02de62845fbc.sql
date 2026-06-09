
CREATE OR REPLACE FUNCTION public.append_repurpose_outputs(
  _job_id uuid,
  _user_id uuid,
  _patch jsonb,
  _title text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.repurpose_jobs
  SET
    outputs = COALESCE(outputs, '{}'::jsonb) || COALESCE(_patch, '{}'::jsonb),
    title = COALESCE(NULLIF(title, ''), _title)
  WHERE id = _job_id AND user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.append_repurpose_outputs(uuid, uuid, jsonb, text) TO authenticated, service_role;
