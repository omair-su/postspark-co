-- Wave 4: onboarding, public gallery, referrals

-- 1. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_role text,
  ADD COLUMN IF NOT EXISTS primary_platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Backfill referral codes for existing profiles
UPDATE public.profiles
SET referral_code = lower(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
WHERE referral_code IS NULL;

-- Make handle_new_user generate a referral_code on signup, and accept referred_by from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ref_by_code text;
  ref_by_id uuid;
BEGIN
  ref_by_code := NEW.raw_user_meta_data->>'referral_code';
  IF ref_by_code IS NOT NULL AND length(ref_by_code) > 0 THEN
    SELECT user_id INTO ref_by_id FROM public.profiles WHERE referral_code = lower(ref_by_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, avatar_url, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    lower(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)),
    ref_by_id
  );
  RETURN NEW;
END;
$function$;

-- 2. Repurpose jobs: add public sharing fields
ALTER TABLE public.repurpose_jobs
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_public ON public.repurpose_jobs (is_public, created_at DESC) WHERE is_public = true;

-- Public read policy: anyone can read jobs that are marked public
DROP POLICY IF EXISTS "Public can view public jobs" ON public.repurpose_jobs;
CREATE POLICY "Public can view public jobs"
ON public.repurpose_jobs
FOR SELECT
USING (is_public = true);

-- 3. Referrals table (tracks reward state)
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | rewarded
  reward_granted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own referrals" ON public.referrals;
CREATE POLICY "Users see their own referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Trigger: when a profile is created with referred_by, insert a referrals row
CREATE OR REPLACE FUNCTION public.handle_referral_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, status)
    VALUES (NEW.referred_by, NEW.user_id, 'pending')
    ON CONFLICT (referred_user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_referral ON public.profiles;
CREATE TRIGGER on_profile_referral
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_on_profile();