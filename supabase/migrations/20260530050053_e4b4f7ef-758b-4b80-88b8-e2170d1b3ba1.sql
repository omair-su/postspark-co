-- Restrict workspace_invites.token column reads to service_role only.
-- Application code already uses supabaseAdmin to look up invites by token
-- (see acceptInvite), and end-user queries never select the token column.
REVOKE SELECT (token) ON public.workspace_invites FROM authenticated;
REVOKE SELECT (token) ON public.workspace_invites FROM anon;
-- Grant explicit per-column SELECT for the remaining safe columns so that
-- existing owner/admin SELECT queries continue to work under RLS.
GRANT SELECT (id, workspace_id, email, role, expires_at, accepted_at, created_at, invited_by)
  ON public.workspace_invites TO authenticated;