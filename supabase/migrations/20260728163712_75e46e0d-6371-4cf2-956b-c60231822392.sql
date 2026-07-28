-- Per-user folder access on the private post-media bucket
CREATE POLICY "post_media_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "post_media_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "post_media_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "post_media_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- LinkedIn first-comment support on scheduled posts
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS first_comment text;