DROP POLICY IF EXISTS "Public read generated images" ON storage.objects;
-- Allow only owners to list/select their own files via API; public direct URLs still work because bucket is public.
CREATE POLICY "Users read own generated images" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );