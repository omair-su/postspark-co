
-- analytics_events: server-only writes via supabaseAdmin
CREATE POLICY "Service role manages analytics_events"
ON public.analytics_events FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- demo_uses: server-only writes via supabaseAdmin
CREATE POLICY "Service role manages demo_uses"
ON public.demo_uses FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- workspace_invites: hide token column from regular users
REVOKE SELECT (token) ON public.workspace_invites FROM authenticated;
REVOKE SELECT (token) ON public.workspace_invites FROM anon;
