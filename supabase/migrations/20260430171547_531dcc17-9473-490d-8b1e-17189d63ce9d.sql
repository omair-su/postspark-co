
-- Add is_favorite column to repurpose_jobs
ALTER TABLE public.repurpose_jobs ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Allow users to update their own jobs (for toggling favorite)
CREATE POLICY "Users can update own jobs"
ON public.repurpose_jobs
FOR UPDATE
USING (auth.uid() = user_id);

-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  custom_instructions TEXT DEFAULT '',
  selected_types JSONB NOT NULL DEFAULT '["tweets","linkedin","email","video"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Users can view own templates"
ON public.templates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
ON public.templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON public.templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON public.templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
