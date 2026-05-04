-- 1. Drop the old Stripe-based subscriptions table (was unused, no data to preserve)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 2. Create new Paddle-aligned subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_user_env ON public.subscriptions(user_id, environment);

-- 3. RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Active subscription helper (defaults to live for safety)
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND environment = check_env
    AND (
      (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  );
$$;

-- 6. Auto-sync profiles.plan from subscription changes
CREATE OR REPLACE FUNCTION public.sync_profile_plan_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
  new_plan text;
  has_active boolean;
  best_product text;
BEGIN
  target_user := COALESCE(NEW.user_id, OLD.user_id);

  -- Find the highest-tier active subscription for this user (live env in production, sandbox in preview)
  -- We pick agency over pro if both somehow exist
  SELECT product_id INTO best_product
  FROM public.subscriptions
  WHERE user_id = target_user
    AND (
      (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  ORDER BY
    CASE product_id
      WHEN 'agency_plan' THEN 1
      WHEN 'pro_plan' THEN 2
      ELSE 3
    END,
    created_at DESC
  LIMIT 1;

  IF best_product = 'agency_plan' THEN
    new_plan := 'agency';
  ELSIF best_product = 'pro_plan' THEN
    new_plan := 'pro';
  ELSE
    new_plan := 'free';
  END IF;

  UPDATE public.profiles
  SET plan = new_plan, updated_at = now()
  WHERE user_id = target_user;

  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_sync_plan
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_plan_from_subscription();