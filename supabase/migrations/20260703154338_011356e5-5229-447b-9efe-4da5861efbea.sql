-- Restrict anon from reading input_text on public repurpose_jobs rows
REVOKE SELECT (input_text) ON public.repurpose_jobs FROM anon;

-- Prevent workspace admins from harvesting other invitees' single-use tokens
REVOKE SELECT (token) ON public.workspace_invites FROM anon, authenticated;