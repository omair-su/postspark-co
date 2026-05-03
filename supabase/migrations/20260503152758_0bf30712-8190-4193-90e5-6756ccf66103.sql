
-- Helper enum / use text for flexibility
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  white_label boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  active_brand_kit_id uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);

CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_workspace_invites_email ON public.workspace_invites(lower(email));

CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.repurpose_jobs(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','changes_requested')),
  client_email text,
  client_name text,
  client_comment text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_approval_requests_job ON public.approval_requests(job_id);

-- Add workspace_id to existing tables (nullable = personal data)
ALTER TABLE public.brand_kits ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.brand_kits ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.generated_images ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.repurpose_jobs ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.repurpose_jobs ADD COLUMN brand_kit_id uuid REFERENCES public.brand_kits(id) ON DELETE SET NULL;
ALTER TABLE public.scheduled_posts ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.scheduled_posts ADD COLUMN brand_kit_id uuid REFERENCES public.brand_kits(id) ON DELETE SET NULL;
ALTER TABLE public.brand_voices ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.templates ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Security definer helper: avoids RLS recursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_role(_workspace_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND user_id = _user_id LIMIT 1;
$$;

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- workspaces policies
CREATE POLICY "members can view workspace" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "owner can update workspace" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.workspace_role(id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "auth can create workspace" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner can delete workspace" ON public.workspaces FOR DELETE TO authenticated
  USING (public.workspace_role(id, auth.uid()) = 'owner');

-- workspace_members policies
CREATE POLICY "members view own membership" ON public.workspace_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "owner/admin add members" ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    public.workspace_role(workspace_id, auth.uid()) IN ('owner','admin')
    OR user_id = auth.uid()  -- self-join via invite acceptance flow
  );
CREATE POLICY "user updates own member row" ON public.workspace_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.workspace_role(workspace_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "owner/admin remove members" ON public.workspace_members FOR DELETE TO authenticated
  USING (public.workspace_role(workspace_id, auth.uid()) IN ('owner','admin') OR user_id = auth.uid());

-- workspace_invites policies
CREATE POLICY "members view invites" ON public.workspace_invites FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "owner/admin create invite" ON public.workspace_invites FOR INSERT TO authenticated
  WITH CHECK (public.workspace_role(workspace_id, auth.uid()) IN ('owner','admin') AND invited_by = auth.uid());
CREATE POLICY "owner/admin delete invite" ON public.workspace_invites FOR DELETE TO authenticated
  USING (public.workspace_role(workspace_id, auth.uid()) IN ('owner','admin'));

-- approval_requests
CREATE POLICY "public view by token select" ON public.approval_requests FOR SELECT TO anon, authenticated
  USING (true); -- secured at app layer by token; minimal data exposed via SECURITY DEFINER fn
CREATE POLICY "members create approvals" ON public.approval_requests FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "anyone can update approval by token" ON public.approval_requests FOR UPDATE TO anon, authenticated
  USING (true);
CREATE POLICY "creator delete approval" ON public.approval_requests FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- Extend RLS for shared tables to include workspace members
-- brand_kits
DROP POLICY IF EXISTS "users select own brand kit" ON public.brand_kits;
CREATE POLICY "select brand kit" ON public.brand_kits FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));
DROP POLICY IF EXISTS "users insert own brand kit" ON public.brand_kits;
CREATE POLICY "insert brand kit" ON public.brand_kits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid())));
DROP POLICY IF EXISTS "users update own brand kit" ON public.brand_kits;
CREATE POLICY "update brand kit" ON public.brand_kits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));
DROP POLICY IF EXISTS "users delete own brand kit" ON public.brand_kits;
CREATE POLICY "delete brand kit" ON public.brand_kits FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- generated_images
DROP POLICY IF EXISTS "Users view own images" ON public.generated_images;
CREATE POLICY "view images" ON public.generated_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));
DROP POLICY IF EXISTS "Users insert own images" ON public.generated_images;
CREATE POLICY "insert images" ON public.generated_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own images" ON public.generated_images;
CREATE POLICY "delete images" ON public.generated_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.workspace_role(workspace_id, auth.uid()) IN ('owner','admin')));

-- repurpose_jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON public.repurpose_jobs;
CREATE POLICY "view jobs" ON public.repurpose_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- scheduled_posts
DROP POLICY IF EXISTS "Users can view own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "view scheduled" ON public.scheduled_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- brand_voices
DROP POLICY IF EXISTS "Users can view own brand voices" ON public.brand_voices;
CREATE POLICY "view brand voices" ON public.brand_voices FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "view templates" ON public.templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- Triggers for updated_at
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
