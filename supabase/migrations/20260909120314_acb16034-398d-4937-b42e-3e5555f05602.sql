REVOKE EXECUTE ON FUNCTION public.reserve_usage(uuid, text, integer, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_usage(uuid, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated;