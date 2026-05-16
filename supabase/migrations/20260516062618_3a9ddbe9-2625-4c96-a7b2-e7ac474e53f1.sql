
-- 1. Restrict UPDATE on profiles to safe columns only (prevent plan self-escalation)
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (
  display_name, avatar_url, handle, tagline,
  primary_role, primary_platforms,
  weekly_digest_enabled, onboarding_completed
) ON TABLE public.profiles TO authenticated;

-- 2. Restrict public profile reads to safe display columns via a security-barrier view
DROP POLICY IF EXISTS "Public can view creator showcase fields" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true) AS
SELECT user_id, handle, display_name, avatar_url, tagline, created_at
FROM public.profiles
WHERE handle IS NOT NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Remove duplicate blog SELECT policies
DROP POLICY IF EXISTS "Anyone view authors" ON public.blog_authors;
DROP POLICY IF EXISTS "Anyone view categories" ON public.blog_categories;

-- 4. Add explicit UPDATE storage policy for generated-images bucket
CREATE POLICY "Users update own generated images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
