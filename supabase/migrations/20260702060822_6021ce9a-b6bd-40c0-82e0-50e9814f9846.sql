
-- Revoke public EXECUTE on internal cron/trigger helpers
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

-- Add missing UPDATE policy for shorts-videos private bucket
CREATE POLICY "Users can update own shorts videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'shorts-videos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'shorts-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
