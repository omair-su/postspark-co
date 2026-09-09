-- Durable usage ledger -------------------------------------------------------
CREATE TABLE public.usage_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  idempotency_key text,
  state text NOT NULL DEFAULT 'reserved',
  period_start date NOT NULL DEFAULT (date_trunc('month', now())::date),
  units integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  settled_at timestamp with time zone
);

GRANT SELECT ON public.usage_reservations TO authenticated;
GRANT ALL ON public.usage_reservations TO service_role;

ALTER TABLE public.usage_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage reservations"
ON public.usage_reservations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE UNIQUE INDEX usage_reservations_idem_uniq
ON public.usage_reservations (user_id, kind, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX usage_reservations_lookup
ON public.usage_reservations (user_id, kind, period_start, state);

-- Reserve one unit of a monthly allowance, atomically.
-- Returns jsonb: { status: 'allowed'|'limit_reached'|'duplicate', reservation_id, used }
CREATE OR REPLACE FUNCTION public.reserve_usage(
  _user_id uuid,
  _kind text,
  _limit integer,
  _idempotency_key text DEFAULT NULL,
  _units integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period date := date_trunc('month', now())::date;
  _existing uuid;
  _used integer;
  _new_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text || ':' || _kind, 0));

  IF _idempotency_key IS NOT NULL THEN
    SELECT id INTO _existing
    FROM public.usage_reservations
    WHERE user_id = _user_id AND kind = _kind AND idempotency_key = _idempotency_key
    LIMIT 1;
    IF _existing IS NOT NULL THEN
      RETURN jsonb_build_object('status', 'duplicate', 'reservation_id', _existing);
    END IF;
  END IF;

  SELECT COALESCE(sum(units), 0) INTO _used
  FROM public.usage_reservations
  WHERE user_id = _user_id
    AND kind = _kind
    AND period_start = _period
    AND state IN ('reserved', 'consumed');

  IF _limit >= 0 AND _used + _units > _limit THEN
    RETURN jsonb_build_object('status', 'limit_reached', 'used', _used);
  END IF;

  INSERT INTO public.usage_reservations (user_id, kind, idempotency_key, period_start, units)
  VALUES (_user_id, _kind, _idempotency_key, _period, _units)
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object('status', 'allowed', 'reservation_id', _new_id, 'used', _used + _units);
END;
$$;

-- Settle a reservation: success keeps the unit, failure releases it.
CREATE OR REPLACE FUNCTION public.settle_usage(
  _reservation_id uuid,
  _success boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_reservations
  SET state = CASE WHEN _success THEN 'consumed' ELSE 'released' END,
      settled_at = now()
  WHERE id = _reservation_id AND state = 'reserved';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_usage(uuid, text, integer, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_usage(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_usage(uuid, text, integer, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_usage(uuid, boolean) TO service_role;

-- Durable per-user rate limiting -------------------------------------------
CREATE TABLE public.rate_limit_hits (
  id bigserial PRIMARY KEY,
  subject text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limit_hits TO service_role;

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

CREATE INDEX rate_limit_hits_lookup ON public.rate_limit_hits (subject, action, created_at DESC);

-- Returns true when the caller is over the limit for the window.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _subject text,
  _action text,
  _max integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hits integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(_subject || ':' || _action, 1));

  DELETE FROM public.rate_limit_hits
  WHERE subject = _subject
    AND action = _action
    AND created_at < now() - make_interval(secs => _window_seconds * 4);

  SELECT count(*) INTO _hits
  FROM public.rate_limit_hits
  WHERE subject = _subject
    AND action = _action
    AND created_at > now() - make_interval(secs => _window_seconds);

  IF _hits >= _max THEN
    RETURN true;
  END IF;

  INSERT INTO public.rate_limit_hits (subject, action) VALUES (_subject, _action);
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;