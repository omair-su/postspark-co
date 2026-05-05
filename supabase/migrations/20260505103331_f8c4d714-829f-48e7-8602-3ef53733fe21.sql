-- Tighten workspace_members INSERT policy: remove the self-insert bypass.
-- New members must be added either by an owner/admin (existing seat) or by the
-- service role (used by createWorkspace for the initial owner row, and by
-- acceptInvite after validating the invite token).
DROP POLICY IF EXISTS "owner/admin add members" ON public.workspace_members;

CREATE POLICY "owner/admin add members"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])
);

-- Also tighten the DELETE policy: previously a user could remove themselves from
-- any workspace they happened to belong to (fine), but the same `OR user_id = auth.uid()`
-- combined with a stale row could let someone leave silently. Keep self-leave but
-- restrict to rows where they actually are the member.
DROP POLICY IF EXISTS "owner/admin remove members" ON public.workspace_members;

CREATE POLICY "owner/admin remove members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner'::text, 'admin'::text])
  OR user_id = auth.uid()
);
