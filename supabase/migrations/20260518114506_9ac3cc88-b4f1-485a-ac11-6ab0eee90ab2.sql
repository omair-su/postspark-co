
-- 1) PROFILES: drop anon SELECT policy and column grants entirely.
-- Public showcase data is served via server functions using the service-role
-- client (see src/lib/showcase.functions.ts / src/server/gallery.server.ts),
-- so anon no longer needs direct table access.
DROP POLICY IF EXISTS "Public can view showcase profiles (safe cols)" ON public.profiles;
REVOKE SELECT ON TABLE public.profiles FROM anon;
DROP VIEW IF EXISTS public.public_profiles;

-- 2) APPROVAL_REQUESTS: revoke column-level SELECT on `token` from authenticated.
-- Workspace members can still see approval rows (status, client info) via the
-- existing RLS SELECT policy, but the secret token is no longer readable —
-- only service_role server code (RPC `get_approval_by_token`, admin insert
-- return path) can read it.
REVOKE SELECT ON TABLE public.approval_requests FROM authenticated;
GRANT SELECT (
  id, job_id, workspace_id, created_by, status,
  client_name, client_email, client_comment,
  decided_at, created_at
) ON TABLE public.approval_requests TO authenticated;
