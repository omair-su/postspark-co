-- 1. Drop broad SELECT policy on brand-assets bucket; public URL access still works without it
DROP POLICY IF EXISTS "Public read brand assets" ON storage.objects;

-- Allow owners to list/manage their own brand-asset objects
CREATE POLICY "Users list own brand assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'brand-assets' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. Revoke EXECUTE on workspace helper SECURITY DEFINER functions from end users.
-- These are only referenced inside RLS policies, where they execute with definer rights
-- regardless of caller grants.
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.workspace_role(uuid, uuid) FROM PUBLIC, anon, authenticated;