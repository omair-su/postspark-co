-- 1. social_accounts: allow users to connect/refresh their own accounts
CREATE POLICY "users insert own social accounts"
ON public.social_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own social accounts"
ON public.social_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. post_metrics: allow user to insert/update metrics for their own posts
--    (analytics writer runs as the user via authenticated server fn)
CREATE POLICY "users insert own metrics"
ON public.post_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own metrics"
ON public.post_metrics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Full-text search index for History
CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_fts
ON public.repurpose_jobs
USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(input_text,'')));

-- 4. Helper indexes for calendar status filter
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_status
ON public.scheduled_posts (user_id, status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_user_created
ON public.repurpose_jobs (user_id, created_at DESC);