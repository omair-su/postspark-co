-- 1) Purchased credit wallets (image credits + schedule slots). Balances never expire.
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  image_credits integer NOT NULL DEFAULT 0 CHECK (image_credits >= 0),
  schedule_slots integer NOT NULL DEFAULT 0 CHECK (schedule_slots >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_wallets TO authenticated;
GRANT ALL ON public.credit_wallets TO service_role;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own wallet" ON public.credit_wallets;
CREATE POLICY "Users view own wallet" ON public.credit_wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_credit_wallets_updated_at ON public.credit_wallets;
CREATE TRIGGER set_credit_wallets_updated_at BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Purchase receipts (idempotency + "your purchases" history)
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image', 'schedule')),
  units integer NOT NULL CHECK (units > 0),
  price_id text NOT NULL,
  transaction_id text NOT NULL,
  amount_cents integer,
  currency text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, price_id)
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON public.credit_purchases(user_id, created_at DESC);

GRANT SELECT ON public.credit_purchases TO authenticated;
GRANT ALL ON public.credit_purchases TO service_role;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own credit purchases" ON public.credit_purchases;
CREATE POLICY "Users view own credit purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3) Grant credits from a completed payment. Idempotent per (transaction, price).
CREATE OR REPLACE FUNCTION public.grant_credits(
  _user_id uuid,
  _kind text,
  _units integer,
  _price_id text,
  _transaction_id text,
  _amount_cents integer DEFAULT NULL,
  _currency text DEFAULT NULL,
  _environment text DEFAULT 'sandbox'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inserted uuid;
BEGIN
  IF _kind NOT IN ('image', 'schedule') OR _units <= 0 THEN
    RAISE EXCEPTION 'invalid credit grant';
  END IF;

  INSERT INTO public.credit_purchases (user_id, kind, units, price_id, transaction_id, amount_cents, currency, environment)
  VALUES (_user_id, _kind, _units, _price_id, _transaction_id, _amount_cents, _currency, COALESCE(_environment, 'sandbox'))
  ON CONFLICT (transaction_id, price_id) DO NOTHING
  RETURNING id INTO _inserted;

  IF _inserted IS NULL THEN
    RETURN false; -- already granted
  END IF;

  INSERT INTO public.credit_wallets (user_id, image_credits, schedule_slots)
  VALUES (
    _user_id,
    CASE WHEN _kind = 'image' THEN _units ELSE 0 END,
    CASE WHEN _kind = 'schedule' THEN _units ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    image_credits = public.credit_wallets.image_credits + CASE WHEN _kind = 'image' THEN _units ELSE 0 END,
    schedule_slots = public.credit_wallets.schedule_slots + CASE WHEN _kind = 'schedule' THEN _units ELSE 0 END,
    updated_at = now();

  RETURN true;
END;
$$;

-- 4) Atomically spend purchased credits; false when the balance is short.
CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _kind text, _units integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ok boolean := false;
BEGIN
  IF _kind NOT IN ('image', 'schedule') OR _units <= 0 THEN
    RETURN false;
  END IF;

  IF _kind = 'image' THEN
    UPDATE public.credit_wallets
      SET image_credits = image_credits - _units, updated_at = now()
      WHERE user_id = _user_id AND image_credits >= _units;
  ELSE
    UPDATE public.credit_wallets
      SET schedule_slots = schedule_slots - _units, updated_at = now()
      WHERE user_id = _user_id AND schedule_slots >= _units;
  END IF;

  _ok := FOUND;
  RETURN _ok;
END;
$$;

-- 5) Give purchased credits back when the render/schedule failed.
CREATE OR REPLACE FUNCTION public.refund_credits(_user_id uuid, _kind text, _units integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _kind NOT IN ('image', 'schedule') OR _units <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.credit_wallets (user_id, image_credits, schedule_slots)
  VALUES (
    _user_id,
    CASE WHEN _kind = 'image' THEN _units ELSE 0 END,
    CASE WHEN _kind = 'schedule' THEN _units ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    image_credits = public.credit_wallets.image_credits + CASE WHEN _kind = 'image' THEN _units ELSE 0 END,
    schedule_slots = public.credit_wallets.schedule_slots + CASE WHEN _kind = 'schedule' THEN _units ELSE 0 END,
    updated_at = now();
  RETURN true;
END;
$$;

-- Wallet mutations are server-only.
REVOKE ALL ON FUNCTION public.grant_credits(uuid, text, integer, text, text, integer, text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, text, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, text, integer, text, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, integer) TO service_role;

-- 6) Brand guidelines: logo usage rules + written style guide notes on the brand kit.
ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS logo_guidelines jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS style_notes text,
  ADD COLUMN IF NOT EXISTS voice_notes text,
  ADD COLUMN IF NOT EXISTS auto_brand_images boolean NOT NULL DEFAULT true;
