
CREATE OR REPLACE FUNCTION public.prevent_profiles_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND auth.role() IS DISTINCT FROM 'service_role' THEN
      NEW.plan := OLD.plan;
    END IF;
  END IF;
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND auth.role() IS DISTINCT FROM 'service_role' THEN
      NEW.referred_by := OLD.referred_by;
    END IF;
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND auth.role() IS DISTINCT FROM 'service_role' THEN
      NEW.referral_code := OLD.referral_code;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profiles_protected_columns();
