CREATE TABLE IF NOT EXISTS public.generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  prompt text NOT NULL,
  style text,
  aspect text,
  template text,
  source text NOT NULL DEFAULT 'generate',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own images" ON public.generated_images
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own images" ON public.generated_images
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own images" ON public.generated_images
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_generated_images_user_created
  ON public.generated_images (user_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read generated images" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');
CREATE POLICY "Users upload own generated images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users delete own generated images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );