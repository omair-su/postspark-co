
-- Recreate view as SECURITY INVOKER (lint 0010)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, handle, display_name, avatar_url, tagline, created_at
FROM public.profiles
WHERE handle IS NOT NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow anon to SELECT profiles only via column-level grants on safe fields,
-- gated by an RLS policy that requires handle IS NOT NULL.
REVOKE SELECT ON TABLE public.profiles FROM anon;
GRANT SELECT (user_id, handle, display_name, avatar_url, tagline, created_at)
  ON TABLE public.profiles TO anon;

CREATE POLICY "Public can view showcase profiles (safe cols)"
ON public.profiles FOR SELECT
TO anon
USING (handle IS NOT NULL);
