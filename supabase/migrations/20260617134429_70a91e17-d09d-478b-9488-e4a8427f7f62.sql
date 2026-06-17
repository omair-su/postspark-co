-- 1) Approval tokens: revoke column-level SELECT from end-user roles.
--    The token is returned only by createApprovalRequest (server-generated)
--    and by the get_approval_by_token SECURITY DEFINER RPC.
REVOKE SELECT (token) ON public.approval_requests FROM anon, authenticated;

-- 2) repurpose_jobs.input_text: revoke from anon so the public RLS policy
--    cannot expose user source content. Authenticated owners still read it
--    via the user_id/workspace policies (column grants are additive with RLS).
REVOKE SELECT (input_text) ON public.repurpose_jobs FROM anon;
