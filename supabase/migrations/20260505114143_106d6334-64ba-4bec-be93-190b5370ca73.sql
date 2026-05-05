DROP POLICY IF EXISTS "members update approvals" ON public.approval_requests;

CREATE POLICY "creator or admin update approvals"
ON public.approval_requests
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR (
    workspace_id IS NOT NULL
    AND workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin'])
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR (
    workspace_id IS NOT NULL
    AND workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin'])
  )
);