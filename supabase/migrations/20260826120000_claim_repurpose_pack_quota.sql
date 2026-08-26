-- Atomic free-tier repurpose quota claim.
-- Serializes per user so two concurrent packs cannot both pass the monthly cap.
-- Empty packs created in the last 15 minutes count as reservations (same TTL as
-- the previous application-level empty-pack cleanup).

CREATE OR REPLACE FUNCTION public.claim_repurpose_pack(
  _pack_id uuid,
  _user_id uuid,
  _input_text text,
  _title text DEFAULT NULL,
  _brand_kit_id uuid DEFAULT NULL,
  _workspace_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _is_pro boolean;
  _used int;
  _limit int := 3;
  _month_start timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _pack_id IS NULL OR _user_id IS NULL THEN
    RAISE EXCEPTION 'invalid pack claim';
  END IF;

  -- Transaction-scoped lock: concurrent claims for the same user queue here.
  PERFORM pg_advisory_xact_lock(42, hashtext(_user_id::text));

  IF EXISTS (
    SELECT 1 FROM public.repurpose_jobs
    WHERE id = _pack_id AND user_id = _user_id
  ) THEN
    RETURN 'ok';
  END IF;

  SELECT COALESCE(plan, 'free') INTO _plan
  FROM public.profiles
  WHERE user_id = _user_id;

  _plan := COALESCE(_plan, 'free');
  _is_pro := _plan IN ('pro', 'agency');
  _month_start := date_trunc('month', now());

  IF NOT _is_pro THEN
    SELECT COUNT(*)::int INTO _used
    FROM public.repurpose_jobs
    WHERE user_id = _user_id
      AND created_at >= _month_start
      AND (
        (
          outputs IS NOT NULL
          AND jsonb_typeof(outputs) = 'object'
          AND outputs <> '{}'::jsonb
        )
        OR created_at > now() - interval '15 minutes'
      );

    IF _used >= _limit THEN
      RETURN 'limit_reached';
    END IF;
  END IF;

  INSERT INTO public.repurpose_jobs (
    id, user_id, input_text, title, outputs, brand_kit_id, workspace_id, tool
  ) VALUES (
    _pack_id,
    _user_id,
    COALESCE(_input_text, ''),
    COALESCE(_title, ''),
    '{}'::jsonb,
    _brand_kit_id,
    _workspace_id,
    'repurpose'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_repurpose_pack(uuid, uuid, text, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_repurpose_pack(uuid, uuid, text, text, uuid, uuid) TO authenticated, service_role;
