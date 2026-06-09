
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
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.repurpose_jobs
  SET
    outputs = COALESCE(outputs, '{}'::jsonb) || COALESCE(_patch, '{}'::jsonb),
    title = COALESCE(NULLIF(title, ''), _title)
  WHERE id = _job_id AND user_id = _user_id;
END;
$$;
