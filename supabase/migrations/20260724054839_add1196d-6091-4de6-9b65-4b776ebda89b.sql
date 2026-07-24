ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS reply_text TEXT,
  ADD COLUMN IF NOT EXISTS media_urls JSONB;