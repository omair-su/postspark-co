
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS tool text,
  ADD COLUMN IF NOT EXISTS repurpose_job_id uuid REFERENCES public.repurpose_jobs(id) ON DELETE SET NULL;

CREATE POLICY "shorts_videos_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'shorts-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "shorts_videos_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shorts-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "shorts_videos_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shorts-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
