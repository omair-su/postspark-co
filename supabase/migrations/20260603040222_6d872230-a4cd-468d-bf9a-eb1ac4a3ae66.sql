-- Revoke column-level SELECT on sensitive token columns
REVOKE SELECT (token) ON public.approval_requests FROM authenticated;
REVOKE SELECT (token) ON public.approval_requests FROM anon;

REVOKE SELECT (token) ON public.workspace_invites FROM authenticated;
REVOKE SELECT (token) ON public.workspace_invites FROM anon;

-- Ensure service_role retains full access (used by security-definer functions and edge logic)
GRANT SELECT ON public.approval_requests TO service_role;
GRANT SELECT ON public.workspace_invites TO service_role;