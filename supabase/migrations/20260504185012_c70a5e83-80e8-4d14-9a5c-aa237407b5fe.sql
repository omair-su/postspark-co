-- Fix scheduled_posts DELETE policy to allow workspace admins
DROP POLICY IF EXISTS "Users can delete own scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Delete own or workspace admin scheduled posts"
ON public.scheduled_posts FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']))
);

-- Fix brand_kits UPDATE: only owner OR workspace admin/owner can update
DROP POLICY IF EXISTS "update brand kit" ON public.brand_kits;
CREATE POLICY "update brand kit"
ON public.brand_kits FOR UPDATE TO authenticated
USING (
  (auth.uid() = user_id)
  OR (workspace_id IS NOT NULL AND public.workspace_role(workspace_id, auth.uid()) = ANY (ARRAY['owner','admin']))
);

-- Fix mutable search_path on email-queue helper functions
CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

-- Restrict EXECUTE on email-queue helpers to service_role only (these should not be callable by anon/authenticated)
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Also restrict approval token / response functions from being called by anon (only used by service-role from server routes)
REVOKE EXECUTE ON FUNCTION public.get_approval_by_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.respond_to_approval(text, text, text, text) FROM PUBLIC, anon, authenticated;