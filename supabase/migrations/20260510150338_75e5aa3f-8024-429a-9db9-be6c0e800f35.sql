
-- 1. App role enum + user_roles table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Seed founder as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('b12b275f-c9e8-42fa-95e7-02e8f0cfb874', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Blog scheduling: extend status check + add scheduled_at
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'published'));

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled
  ON public.blog_posts (scheduled_at)
  WHERE status = 'scheduled';

-- 4. Admin RLS for blog tables
DROP POLICY IF EXISTS "Admins manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view categories" ON public.blog_categories;
CREATE POLICY "Anyone view categories" ON public.blog_categories
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage categories" ON public.blog_categories;
CREATE POLICY "Admins manage categories" ON public.blog_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view authors" ON public.blog_authors;
CREATE POLICY "Anyone view authors" ON public.blog_authors
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage authors" ON public.blog_authors;
CREATE POLICY "Admins manage authors" ON public.blog_authors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Cron: auto-publish scheduled posts every 15 min
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('publish-scheduled-blog-posts');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'publish-scheduled-blog-posts',
  '*/15 * * * *',
  $cron$
  UPDATE public.blog_posts
  SET status = 'published',
      published_at = COALESCE(published_at, now())
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();
  $cron$
);
