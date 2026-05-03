
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  brand_name text,
  brand_handle text,
  logo_url text,
  primary_color text DEFAULT '#7c3aed',
  secondary_color text DEFAULT '#1a1a2e',
  accent_color text DEFAULT '#f59e0b',
  font_heading text DEFAULT 'Inter',
  font_body text DEFAULT 'Inter',
  tagline text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own brand kit" ON public.brand_kits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own brand kit" ON public.brand_kits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own brand kit" ON public.brand_kits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own brand kit" ON public.brand_kits FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER set_brand_kits_updated_at BEFORE UPDATE ON public.brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform IN ('twitter','linkedin')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own social accounts" ON public.social_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own social accounts" ON public.social_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER set_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS platform_post_id text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_error text;

CREATE TABLE IF NOT EXISTS public.post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scheduled_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_post_id text NOT NULL,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments integer DEFAULT 0,
  impressions integer DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(platform, platform_post_id)
);
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own metrics" ON public.post_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read brand assets" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "Users upload own brand assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own brand assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own brand assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
