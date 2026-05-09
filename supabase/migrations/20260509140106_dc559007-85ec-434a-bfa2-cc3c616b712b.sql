DROP POLICY IF EXISTS "user updates own member row" ON public.workspace_members;

CREATE POLICY "members update own non-role fields"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (
    SELECT wm.role FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "owners admins update any member"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']))
WITH CHECK (public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']));

DROP POLICY IF EXISTS "creator delete approval" ON public.approval_requests;

CREATE POLICY "creator or admin delete approval"
ON public.approval_requests
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR (workspace_id IS NOT NULL AND public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']))
);

CREATE POLICY "update images"
ON public.generated_images
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']))
)
WITH CHECK (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']))
);