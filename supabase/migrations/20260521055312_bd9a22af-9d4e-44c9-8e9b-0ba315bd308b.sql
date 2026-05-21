-- Revoke direct SELECT on workspace_invites.token from end-user roles.
-- Token lookups are performed server-side via supabaseAdmin in acceptInvite.
REVOKE SELECT (token) ON public.workspace_invites FROM authenticated;
REVOKE SELECT (token) ON public.workspace_invites FROM anon;