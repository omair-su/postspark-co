CREATE TABLE public.video_render_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_id text NOT NULL UNIQUE,
  source_path text NOT NULL,
  output_path text,
  status text NOT NULL DEFAULT 'starting',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_render_jobs TO authenticated;
GRANT ALL ON public.video_render_jobs TO service_role;

ALTER TABLE public.video_render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own render jobs" ON public.video_render_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own render jobs" ON public.video_render_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own render jobs" ON public.video_render_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own render jobs" ON public.video_render_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_video_render_jobs_updated_at BEFORE UPDATE ON public.video_render_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();