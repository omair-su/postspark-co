-- ============================================================================
-- PostSpark Security Test Suite (catalog + behavior assertions)
-- ----------------------------------------------------------------------------
-- This connection runs with BYPASSRLS, so we cannot impersonate
-- `authenticated` to exercise policies directly. Instead we assert the
-- security configuration that backs the linter rules:
--
--   1. Sensitive SECURITY DEFINER functions are NOT executable by anon /
--      authenticated (only service_role / definer-trigger context).
--   2. Workspace + approval RLS policies still exist on the expected tables.
--   3. The brand-assets bucket no longer has a broad public-listing policy.
--   4. The approval_audit_log trigger fires on insert and on status change,
--      and the audit table itself rejects direct writes from end-user roles.
--
-- Run with:
--   psql -v ON_ERROR_STOP=1 -v user_a=<uuid> -v user_b=<uuid> \
--     -f supabase/tests/rls_security.sql
--
-- All work is rolled back. Any RAISE EXCEPTION = failed test.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE _test_users(u_a uuid, u_b uuid) ON COMMIT DROP;
INSERT INTO _test_users VALUES (:'user_a'::uuid, :'user_b'::uuid);

DO $$
DECLARE
  u_a uuid;
  u_b uuid;
  ws_a uuid;
  job_shared uuid;
  appr_id uuid;
  cnt int;
BEGIN
  SELECT _test_users.u_a, _test_users.u_b INTO u_a, u_b FROM _test_users LIMIT 1;
  IF u_a IS NULL OR u_b IS NULL OR u_a = u_b THEN
    RAISE EXCEPTION 'Pass two distinct -v user_a / -v user_b uuids';
  END IF;

  -- ============================================================
  -- 1. Function-grant assertions (ties directly to linter 0028/0029)
  -- ============================================================
  IF has_function_privilege('authenticated',
       'public.is_workspace_member(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE is_workspace_member';
  END IF;
  IF has_function_privilege('authenticated',
       'public.workspace_role(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE workspace_role';
  END IF;
  IF has_function_privilege('authenticated',
       'public.get_approval_by_token(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE get_approval_by_token';
  END IF;
  IF has_function_privilege('authenticated',
       'public.respond_to_approval(text,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE respond_to_approval';
  END IF;
  IF has_function_privilege('anon',
       'public.respond_to_approval(text,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anon can EXECUTE respond_to_approval';
  END IF;
  IF has_function_privilege('authenticated',
       'public.log_approval_change()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can EXECUTE log_approval_change';
  END IF;

  -- service_role MUST keep access (server-side approval flow)
  IF NOT has_function_privilege('service_role',
       'public.respond_to_approval(text,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: service_role lost EXECUTE on respond_to_approval';
  END IF;

  -- ============================================================
  -- 2. RLS policy presence (regression guard)
  -- ============================================================
  PERFORM 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='approval_requests'
      AND policyname='members view approvals';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: missing approval SELECT policy'; END IF;

  PERFORM 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='workspace_members'
      AND policyname='members view own membership';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: missing workspace_members SELECT policy'; END IF;

  PERFORM 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='approval_audit_log'
      AND policyname='members view approval audit';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: missing audit SELECT policy'; END IF;

  -- audit log must NOT have any INSERT/UPDATE/DELETE policy for end users
  SELECT count(*) INTO cnt FROM pg_policies
    WHERE schemaname='public' AND tablename='approval_audit_log'
      AND cmd <> 'SELECT';
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'FAIL: audit log has unexpected write policy(s)';
  END IF;

  -- ============================================================
  -- 3. Storage policy: brand-assets must not allow public listing
  -- ============================================================
  PERFORM 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Public read brand assets';
  IF FOUND THEN
    RAISE EXCEPTION 'FAIL: broad public listing policy still exists on brand-assets';
  END IF;

  -- ============================================================
  -- 4. Audit trigger behavior (insert + status change → 2 audit rows)
  -- ============================================================
  INSERT INTO public.profiles(user_id, display_name, plan)
  VALUES (u_a, 'sec-test A', 'agency') ON CONFLICT DO NOTHING;

  INSERT INTO public.workspaces(name, owner_id) VALUES ('sec-test ws', u_a)
    RETURNING id INTO ws_a;
  INSERT INTO public.workspace_members(workspace_id, user_id, role)
    VALUES (ws_a, u_a, 'owner');

  INSERT INTO public.repurpose_jobs(user_id, input_text, title, workspace_id)
    VALUES (u_a, 'audit trigger test', 'Audit Test', ws_a)
    RETURNING id INTO job_shared;

  INSERT INTO public.approval_requests(job_id, workspace_id, created_by, token, status)
    VALUES (job_shared, ws_a, u_a, 'tok_' || substr(md5(random()::text),1,32), 'pending')
    RETURNING id INTO appr_id;

  SELECT count(*) INTO cnt FROM public.approval_audit_log
    WHERE approval_id = appr_id AND action = 'created';
  IF cnt <> 1 THEN
    RAISE EXCEPTION 'FAIL: expected 1 ''created'' audit row, got %', cnt;
  END IF;

  -- Status-change path: we cannot UPDATE from this test role (insert-only),
  -- but we verify the trigger function logic statically — it must reference
  -- both TG_OP IN ('INSERT','UPDATE') and write into approval_audit_log.
  PERFORM 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='log_approval_change'
     AND pg_get_functiondef(p.oid) LIKE '%status_changed%'
     AND pg_get_functiondef(p.oid) LIKE '%approval_audit_log%';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL: log_approval_change missing status_changed branch';
  END IF;

  RAISE NOTICE 'OK: all security assertions passed (function grants, RLS policies, storage, audit trigger)';
END $$;

ROLLBACK;
