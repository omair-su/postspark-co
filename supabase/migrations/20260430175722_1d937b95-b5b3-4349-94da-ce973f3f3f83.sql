-- Fix 1: Change repurpose_jobs UPDATE policy from 'public' to 'authenticated'
DROP POLICY "Users can update own jobs" ON public.repurpose_jobs;
CREATE POLICY "Users can update own jobs"
  ON public.repurpose_jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix 2: Restrict profiles UPDATE to only display_name and avatar_url columns
-- so users cannot escalate their plan
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;