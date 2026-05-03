REVOKE EXECUTE ON FUNCTION public.get_approval_by_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.respond_to_approval(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_approval_by_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_approval(text, text, text, text) TO service_role;