CREATE TABLE public.shorts_editor_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled project',
  project_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shorts_editor_projects TO authenticated;
GRANT ALL ON public.shorts_editor_projects TO service_role;

ALTER TABLE public.shorts_editor_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own editor projects"
ON public.shorts_editor_projects FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_shorts_editor_projects_updated_at
BEFORE UPDATE ON public.shorts_editor_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_shorts_editor_projects_user ON public.shorts_editor_projects(user_id, updated_at DESC);