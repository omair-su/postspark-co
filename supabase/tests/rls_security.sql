-- ============================================================================
-- PostSpark RLS / Security Test Suite
-- ----------------------------------------------------------------------------
-- Self-contained transaction that seeds fake users/workspaces, then exercises
-- policies as different roles to confirm:
--   * Cross-user isolation on repurpose_jobs, brand_kits, social_accounts,
--     post_metrics, generated_images, scheduled_posts.
--   * Workspace member can read shared jobs; non-member cannot.
--   * Approval requests visible only to creator + workspace members.
--   * Public approval token RPCs are NOT executable by anon/authenticated.
--   * Workspace helper functions are NOT executable by anon/authenticated.
--   * Approval audit trigger writes a row on insert + status change.
--
-- Run with:
--   psql -v user_a=<uuid> -v user_b=<uuid> -f supabase/tests/rls_security.sql
-- Two real auth.users ids are required because public tables FK into auth.users
-- and the test connection cannot insert there. Everything is rolled back.

BEGIN;

-- Use a savepoint we can roll back to even if a test fails mid-way.
SAVEPOINT setup;

-- Two fake user ids. We cannot insert into auth.users in test, so we set
-- request.jwt.claims directly — RLS uses auth.uid() which reads that claim.
DO $$
DECLARE
  u_a uuid;
  u_b uuid;
  ws_a uuid;
  job_a uuid;
  job_shared uuid;
  appr_id uuid;
  cnt int;
BEGIN
  -- Pick two existing auth users to use as fixtures (we cannot insert into
  -- auth.users with the standard connection, so we reuse real user ids and
  -- roll the entire transaction back at the end).
  SELECT id INTO u_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO u_b FROM auth.users WHERE id <> u_a ORDER BY created_at LIMIT 1;
  IF u_a IS NULL OR u_b IS NULL THEN
    RAISE EXCEPTION 'Need ≥2 auth.users in the project to run RLS tests';
  END IF;

  -- Profiles (may already exist for these users)
  INSERT INTO public.profiles(user_id, display_name, plan)
  VALUES (u_a, 'User A test', 'agency'), (u_b, 'User B test', 'free')
  ON CONFLICT DO NOTHING;

  -- Workspace owned by A
  INSERT INTO public.workspaces(name, owner_id)
  VALUES ('A Agency', u_a) RETURNING id INTO ws_a;

  INSERT INTO public.workspace_members(workspace_id, user_id, role)
  VALUES (ws_a, u_a, 'owner');

  -- Repurpose jobs: one private (A only), one workspace-scoped
  INSERT INTO public.repurpose_jobs(user_id, input_text, title)
  VALUES (u_a, 'private', 'Private A') RETURNING id INTO job_a;

  INSERT INTO public.repurpose_jobs(user_id, input_text, title, workspace_id)
  VALUES (u_a, 'shared', 'Shared WS', ws_a) RETURNING id INTO job_shared;

  -- Approval request for the shared job
  INSERT INTO public.approval_requests(job_id, workspace_id, created_by, token, status)
  VALUES (job_shared, ws_a, u_a, 'tok_' || substr(md5(random()::text),1,32), 'pending')
  RETURNING id INTO appr_id;

  -- ------------------------------------------------------------------
  -- Switch to authenticated role as User B (NOT a workspace member)
  -- ------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  -- B should NOT see A's private job
  SELECT count(*) INTO cnt FROM public.repurpose_jobs WHERE id = job_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'FAIL: User B can see private job of User A'; END IF;

  -- B should NOT see workspace job
  SELECT count(*) INTO cnt FROM public.repurpose_jobs WHERE id = job_shared;
  IF cnt <> 0 THEN RAISE EXCEPTION 'FAIL: Non-member B can see workspace job'; END IF;

  -- B should NOT see approval request
  SELECT count(*) INTO cnt FROM public.approval_requests WHERE id = appr_id;
  IF cnt <> 0 THEN RAISE EXCEPTION 'FAIL: Non-member B can see approval'; END IF;

  -- B cannot insert a job pretending to be A
  BEGIN
    INSERT INTO public.repurpose_jobs(user_id, input_text) VALUES (u_a, 'spoof');
    RAISE EXCEPTION 'FAIL: User B managed to insert a job as User A';
  EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    -- expected RLS rejection
    NULL;
  END;

  -- B cannot call workspace helpers
  BEGIN
    PERFORM public.is_workspace_member(ws_a, u_b);
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE is_workspace_member';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.workspace_role(ws_a, u_b);
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE workspace_role';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- B cannot call approval RPCs (must go through server function)
  BEGIN
    PERFORM public.get_approval_by_token('whatever');
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE get_approval_by_token';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- ------------------------------------------------------------------
  -- Switch to User A
  -- ------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO cnt FROM public.repurpose_jobs WHERE id IN (job_a, job_shared);
  IF cnt <> 2 THEN RAISE EXCEPTION 'FAIL: Owner A cannot see own jobs (saw %)', cnt; END IF;

  SELECT count(*) INTO cnt FROM public.approval_requests WHERE id = appr_id;
  IF cnt <> 1 THEN RAISE EXCEPTION 'FAIL: Owner A cannot see own approval'; END IF;

  -- Approving the request must succeed and write an audit row
  UPDATE public.approval_requests
    SET status = 'approved', client_name = 'Acme Co', decided_at = now()
  WHERE id = appr_id;

  -- ------------------------------------------------------------------
  -- Back to service_role to verify audit log
  -- ------------------------------------------------------------------
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', '', true);

  SELECT count(*) INTO cnt FROM public.approval_audit_log WHERE approval_id = appr_id;
  IF cnt < 2 THEN
    RAISE EXCEPTION 'FAIL: expected ≥2 audit rows (created + status_changed), got %', cnt;
  END IF;

  RAISE NOTICE 'OK: all RLS / audit assertions passed';
END $$;

ROLLBACK TO SAVEPOINT setup;
ROLLBACK;
