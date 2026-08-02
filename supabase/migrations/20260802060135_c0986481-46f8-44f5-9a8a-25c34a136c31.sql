DROP POLICY IF EXISTS "Users manage own account permissions" ON public.account_permissions;

CREATE POLICY "Users view own account permissions"
ON public.account_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.account_permissions FROM authenticated;
GRANT SELECT ON public.account_permissions TO authenticated;
GRANT ALL ON public.account_permissions TO service_role;