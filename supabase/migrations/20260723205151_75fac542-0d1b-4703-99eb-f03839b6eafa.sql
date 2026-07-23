
-- 1. Extend social_accounts with metadata JSONB
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. social_pages: each Facebook Page a user can publish to
CREATE TABLE IF NOT EXISTS public.social_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'facebook',
  page_id TEXT NOT NULL,
  page_name TEXT,
  page_category TEXT,
  page_picture_url TEXT,
  page_followers_count INTEGER DEFAULT 0,
  page_access_token TEXT,
  instagram_business_account_id TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, page_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_pages TO authenticated;
GRANT ALL ON public.social_pages TO service_role;
ALTER TABLE public.social_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social pages"
  ON public.social_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_social_pages_updated_at
  BEFORE UPDATE ON public.social_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. publishing_logs
CREATE TABLE IF NOT EXISTS public.publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  action TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.publishing_logs TO authenticated;
GRANT ALL ON public.publishing_logs TO service_role;
ALTER TABLE public.publishing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own publishing logs"
  ON public.publishing_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own publishing logs"
  ON public.publishing_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. webhook_events (service-role write; users only read their own via join with platform_user_id, so restrict to admins)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook events"
  ON public.webhook_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. analytics_cache
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, metric, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_cache TO authenticated;
GRANT ALL ON public.analytics_cache TO service_role;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analytics cache"
  ON public.analytics_cache FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. account_permissions
CREATE TABLE IF NOT EXISTS public.account_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, permission)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_permissions TO authenticated;
GRANT ALL ON public.account_permissions TO service_role;
ALTER TABLE public.account_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own account permissions"
  ON public.account_permissions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_account_permissions_updated_at
  BEFORE UPDATE ON public.account_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
