
-- 1. Brand kits: restrict workspace deletes to owner/admin
DROP POLICY IF EXISTS "delete brand kit" ON public.brand_kits;
CREATE POLICY "delete brand kit"
ON public.brand_kits
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id AND workspace_id IS NULL)
  OR (
    workspace_id IS NOT NULL
    AND public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin'])
  )
);

-- 2. Hide approval_requests.token from direct selects (still accessible via service role / RPCs)
REVOKE SELECT (token) ON public.approval_requests FROM authenticated, anon;

-- 3. Hide workspace_invites.token from direct selects + restrict invite list to owner/admin
REVOKE SELECT (token) ON public.workspace_invites FROM authenticated, anon;

DROP POLICY IF EXISTS "members view invites" ON public.workspace_invites;
CREATE POLICY "owner/admin view invites"
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (
  public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin'])
);

-- 4. Scheduled posts: prevent moving a row to a workspace the user is not a member of
DROP POLICY IF EXISTS "Users can update own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Users can update own scheduled posts"
ON public.scheduled_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    workspace_id IS NULL
    OR public.is_workspace_member(workspace_id, auth.uid())
  )
);
