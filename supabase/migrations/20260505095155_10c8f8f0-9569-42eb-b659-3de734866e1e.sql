-- 1. Trigger: create profile when a new auth user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger: log referral when profile is created with referred_by set
DROP TRIGGER IF EXISTS on_profile_created_referral ON public.profiles;
CREATE TRIGGER on_profile_created_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_on_profile();

-- 3. Trigger: sync profiles.plan whenever subscriptions change
DROP TRIGGER IF EXISTS on_subscription_change_sync_plan ON public.subscriptions;
CREATE TRIGGER on_subscription_change_sync_plan
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan_from_subscription();

-- 4. Trigger: keep subscriptions.updated_at fresh
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Backfill: insert profile rows for any auth.users missing one
INSERT INTO public.profiles (user_id, display_name, avatar_url, referral_code)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  lower(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- 6. Backfill: recompute plan for every user who has any subscription rows
DO $$
DECLARE
  uid uuid;
BEGIN
  FOR uid IN SELECT DISTINCT user_id FROM public.subscriptions LOOP
    UPDATE public.profiles
    SET plan = COALESCE((
      SELECT CASE product_id
        WHEN 'agency_plan' THEN 'agency'
        WHEN 'pro_plan' THEN 'pro'
        ELSE 'free'
      END
      FROM public.subscriptions
      WHERE user_id = uid
        AND (
          (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
          OR (status = 'canceled' AND current_period_end > now())
        )
      ORDER BY CASE product_id WHEN 'agency_plan' THEN 1 WHEN 'pro_plan' THEN 2 ELSE 3 END,
               created_at DESC
      LIMIT 1
    ), 'free'),
    updated_at = now()
    WHERE user_id = uid;
  END LOOP;
END $$;