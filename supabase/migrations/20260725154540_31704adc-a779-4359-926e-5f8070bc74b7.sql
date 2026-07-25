
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  whatsapp_phone text,
  whatsapp_connected_at timestamptz,
  post_published boolean NOT NULL DEFAULT true,
  post_failed boolean NOT NULL DEFAULT true,
  scheduled_reminder boolean NOT NULL DEFAULT true,
  approval_request boolean NOT NULL DEFAULT true,
  account_connected boolean NOT NULL DEFAULT true,
  subscription boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np_own_all" ON public.notification_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message_id text,
  error_message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_notifications TO authenticated;
GRANT ALL ON public.whatsapp_notifications TO service_role;
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wn_own_read" ON public.whatsapp_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "wn_own_insert" ON public.whatsapp_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS wn_user_created ON public.whatsapp_notifications (user_id, created_at DESC);

CREATE TRIGGER np_updated
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
