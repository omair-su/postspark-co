CREATE TABLE public.tiktok_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT,
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT
);

GRANT ALL ON public.tiktok_webhook_logs TO service_role;

ALTER TABLE public.tiktok_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.tiktok_webhook_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX idx_tiktok_webhook_logs_received_at ON public.tiktok_webhook_logs (received_at DESC);
CREATE INDEX idx_tiktok_webhook_logs_event_type ON public.tiktok_webhook_logs (event_type);