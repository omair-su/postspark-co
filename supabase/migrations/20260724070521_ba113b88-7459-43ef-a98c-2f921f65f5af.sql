
-- 1) Tighten role scope from public → authenticated (defense-in-depth)
DROP POLICY IF EXISTS "Users manage own social pages" ON public.social_pages;
CREATE POLICY "Users manage own social pages" ON public.social_pages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own publishing logs" ON public.publishing_logs;
CREATE POLICY "Users insert own publishing logs" ON public.publishing_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own publishing logs" ON public.publishing_logs;
CREATE POLICY "Users read own publishing logs" ON public.publishing_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own account permissions" ON public.account_permissions;
CREATE POLICY "Users manage own account permissions" ON public.account_permissions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Hardening workspace_members self-update: enforce role/workspace/user immutability via trigger
CREATE OR REPLACE FUNCTION public.prevent_workspace_members_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Immutable fields
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'workspace_id cannot be changed';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;

  -- Role change only allowed by workspace owner/admin (never by self acting as member)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = OLD.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin')
        AND wm.user_id <> OLD.user_id
    ) INTO is_admin;

    IF NOT COALESCE(is_admin, false)
       AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'Only workspace owners/admins can change member roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workspace_members_prevent_self_escalation ON public.workspace_members;
CREATE TRIGGER workspace_members_prevent_self_escalation
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_workspace_members_self_privilege_escalation();
