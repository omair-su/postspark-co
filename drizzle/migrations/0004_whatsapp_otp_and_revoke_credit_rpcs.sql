-- 1. Lock down privileged SECURITY DEFINER credit RPCs.
-- These mint/spend/refund purchased credits and are only ever called from
-- server code using the service role. Public (anon) and end-user
-- (authenticated) roles must never be able to execute them directly.
REVOKE ALL ON FUNCTION public.grant_credits(uuid, text, integer, text, text, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, text, integer, text, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, integer) TO service_role;

-- 2. WhatsApp phone ownership verification (OTP) state.
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_pending_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_otp_hash text,
  ADD COLUMN IF NOT EXISTS whatsapp_otp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_otp_attempts integer NOT NULL DEFAULT 0;