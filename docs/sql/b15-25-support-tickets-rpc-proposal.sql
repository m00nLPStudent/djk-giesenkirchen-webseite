-- B15.25 Support Tickets V1 - atomic server-only RPC proposal
-- MANUAL EXECUTION ONLY after explicit approval.
-- Adds three transactional RPCs and the single audit event value priority_changed.
-- Creates no ticket data and does not change table ACLs, RLS or policies.

BEGIN;

DO $guard$
DECLARE
  v_event_expression text;
  v_actual text[];
  v_grantable bigint;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'B15.25 RPC proposal must run as postgres';
  END IF;

  IF to_regrole('service_role') IS NULL
     OR to_regrole('anon') IS NULL
     OR to_regrole('authenticated') IS NULL THEN
    RAISE EXCEPTION 'B15.25 RPC proposal requires the verified Supabase roles';
  END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_roles r ON r.oid = c.relowner
      WHERE n.nspname = 'public'
        AND c.relname IN ('support_tickets', 'support_ticket_messages', 'support_ticket_events')
        AND c.relkind = 'r' AND r.rolname = 'postgres'
        AND c.relrowsecurity AND NOT c.relforcerowsecurity) <> 3 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal ticket table owner/RLS baseline differs';
  END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('support_tickets', 'support_ticket_messages', 'support_ticket_events')) <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal unexpected ticket policy baseline';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_support_ticket_atomic',
        'append_support_ticket_reply_atomic',
        'mutate_support_ticket_admin_atomic'
      )
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC proposal planned function already exists';
  END IF;

  SELECT pg_catalog.regexp_replace(
           pg_catalog.lower(pg_catalog.pg_get_expr(con.conbin, con.conrelid, true)),
           '[[:space:]]+|::text|[()]', '', 'g'
         )
  INTO v_event_expression
  FROM pg_catalog.pg_constraint con
  WHERE con.conrelid = 'public.support_ticket_events'::regclass
    AND con.conname = 'support_ticket_events_type_check'
    AND con.contype = 'c' AND con.convalidated;

  IF v_event_expression IS DISTINCT FROM
     'event_type=anyarray[''created'',''reply_created'',''status_changed'',''assigned'',''closed'',''reopened'']' THEN
    RAISE EXCEPTION 'B15.25 RPC proposal event constraint baseline differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_profiles'
      AND column_name = 'id' AND udt_name = 'uuid'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_profiles'
      AND column_name = 'is_active' AND udt_name = 'bool'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams'
      AND column_name = 'department_id' AND udt_name = 'uuid'
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC proposal identity/scope column baseline differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
    JOIN pg_catalog.pg_namespace pn ON pn.oid = p.pronamespace
    WHERE n.nspname = 'public' AND c.relname = 'support_ticket_messages'
      AND t.tgname = 'support_ticket_messages_touch_parent'
      AND NOT t.tgisinternal AND t.tgenabled <> 'D'
      AND pn.nspname = 'public' AND p.proname = 'touch_support_ticket_from_message'
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC proposal message touch trigger baseline differs';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
         count(*) FILTER (WHERE acl.is_grantable)
  INTO v_actual, v_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public' AND c.relname = 'support_tickets' AND r.rolname = 'service_role';
  IF v_actual <> ARRAY['INSERT','SELECT','UPDATE']::text[] OR v_grantable <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal support_tickets ACL baseline differs';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
         count(*) FILTER (WHERE acl.is_grantable)
  INTO v_actual, v_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public' AND c.relname = 'support_ticket_messages' AND r.rolname = 'service_role';
  IF v_actual <> ARRAY['INSERT','SELECT']::text[] OR v_grantable <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal support_ticket_messages ACL baseline differs';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
         count(*) FILTER (WHERE acl.is_grantable)
  INTO v_actual, v_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public' AND c.relname = 'support_ticket_events' AND r.rolname = 'service_role';
  IF v_actual <> ARRAY['INSERT','SELECT']::text[] OR v_grantable <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal support_ticket_events ACL baseline differs';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
         count(*) FILTER (WHERE acl.is_grantable)
  INTO v_actual, v_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public' AND c.relname = 'support_ticket_number_seq' AND r.rolname = 'service_role';
  IF v_actual <> ARRAY['SELECT','USAGE']::text[] OR v_grantable <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal ticket sequence ACL baseline differs';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
    LEFT JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
    WHERE n.nspname = 'public'
      AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events','support_ticket_number_seq')
      AND (acl.grantee = 0 OR r.rolname IN ('anon','authenticated'))
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC proposal browser relation privilege baseline differs';
  END IF;

  IF (SELECT count(*) FROM public.support_tickets) <> 0
     OR (SELECT count(*) FROM public.support_ticket_messages) <> 0
     OR (SELECT count(*) FROM public.support_ticket_events) <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal data baseline differs from verified 0/0/0 state';
  END IF;
END;
$guard$;

ALTER TABLE public.support_ticket_events
  DROP CONSTRAINT support_ticket_events_type_check;

ALTER TABLE public.support_ticket_events
  ADD CONSTRAINT support_ticket_events_type_check CHECK (
    event_type IN (
      'created',
      'reply_created',
      'status_changed',
      'assigned',
      'closed',
      'reopened',
      'priority_changed'
    )
  );

CREATE FUNCTION public.create_support_ticket_atomic(
  p_actor_profile_id uuid,
  p_subject text,
  p_category text,
  p_message_body text,
  p_area_key text,
  p_department_id uuid,
  p_team_id uuid
)
RETURNS TABLE(ticket_id uuid, ticket_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_ticket_id uuid;
  v_ticket_number text;
  v_team_department_id uuid;
BEGIN
  IF p_actor_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admin_profiles p
    WHERE p.id = p_actor_profile_id AND p.is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Active ticket actor is required' USING ERRCODE = '23503';
  END IF;

  IF p_subject IS NULL OR p_subject <> pg_catalog.btrim(p_subject)
     OR pg_catalog.char_length(p_subject) NOT BETWEEN 3 AND 200 THEN
    RAISE EXCEPTION 'Invalid ticket subject' USING ERRCODE = '23514';
  END IF;

  IF p_message_body IS NULL OR p_message_body <> pg_catalog.btrim(p_message_body)
     OR pg_catalog.char_length(p_message_body) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Invalid ticket message' USING ERRCODE = '23514';
  END IF;

  IF p_category IS NULL OR p_category NOT IN ('problem','question','improvement','other') THEN
    RAISE EXCEPTION 'Invalid ticket category' USING ERRCODE = '23514';
  END IF;

  IF p_area_key IS NULL OR p_area_key <> pg_catalog.btrim(p_area_key)
     OR pg_catalog.char_length(p_area_key) NOT BETWEEN 1 AND 80
     OR p_area_key !~ '^[a-z][a-z0-9_:-]*$' THEN
    RAISE EXCEPTION 'Invalid ticket area' USING ERRCODE = '23514';
  END IF;

  IF p_department_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.departments d WHERE d.id = p_department_id
  ) THEN
    RAISE EXCEPTION 'Unknown ticket department' USING ERRCODE = '23503';
  END IF;

  IF p_team_id IS NOT NULL THEN
    SELECT t.department_id INTO v_team_department_id
    FROM public.teams t WHERE t.id = p_team_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown ticket team' USING ERRCODE = '23503';
    END IF;
    IF p_department_id IS NOT NULL
       AND v_team_department_id IS DISTINCT FROM p_department_id THEN
      RAISE EXCEPTION 'Ticket team and department do not match' USING ERRCODE = '23514';
    END IF;
  END IF;

  INSERT INTO public.support_tickets (
    created_by_profile_id, category, area_key, department_id, team_id,
    subject, status, priority
  ) VALUES (
    p_actor_profile_id, p_category, p_area_key, p_department_id, p_team_id,
    p_subject, 'open', 'normal'
  )
  RETURNING support_tickets.id, support_tickets.ticket_number
  INTO v_ticket_id, v_ticket_number;

  INSERT INTO public.support_ticket_messages (ticket_id, author_profile_id, body)
  VALUES (v_ticket_id, p_actor_profile_id, p_message_body);

  INSERT INTO public.support_ticket_events (ticket_id, event_type, actor_profile_id, metadata)
  VALUES (v_ticket_id, 'created', p_actor_profile_id, '{}'::jsonb);

  RETURN QUERY SELECT v_ticket_id, v_ticket_number;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid) FROM anon;
REVOKE ALL ON FUNCTION public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid) TO service_role;

CREATE FUNCTION public.append_support_ticket_reply_atomic(
  p_ticket_id uuid,
  p_actor_profile_id uuid,
  p_message_body text
)
RETURNS TABLE(message_id uuid, message_created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_message_id uuid;
  v_created_at timestamptz;
  v_ticket_status text;
BEGIN
  IF p_actor_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admin_profiles p
    WHERE p.id = p_actor_profile_id AND p.is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Active reply actor is required' USING ERRCODE = '23503';
  END IF;

  IF p_message_body IS NULL OR p_message_body <> pg_catalog.btrim(p_message_body)
     OR pg_catalog.char_length(p_message_body) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Invalid ticket message' USING ERRCODE = '23514';
  END IF;

  SELECT t.status INTO v_ticket_status
  FROM public.support_tickets t
  WHERE t.id = p_ticket_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown support ticket' USING ERRCODE = '23503';
  END IF;
  IF v_ticket_status = 'completed' THEN
    RAISE EXCEPTION 'Completed support ticket must be reopened before replying'
      USING ERRCODE = '23514';
  END IF;
  IF v_ticket_status NOT IN ('open','in_progress','waiting_for_response') THEN
    RAISE EXCEPTION 'Invalid support ticket state' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.support_ticket_messages (ticket_id, author_profile_id, body)
  VALUES (p_ticket_id, p_actor_profile_id, p_message_body)
  RETURNING id, created_at INTO v_message_id, v_created_at;

  INSERT INTO public.support_ticket_events (ticket_id, event_type, actor_profile_id, metadata)
  VALUES (p_ticket_id, 'reply_created', p_actor_profile_id, '{}'::jsonb);

  RETURN QUERY SELECT v_message_id, v_created_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.append_support_ticket_reply_atomic(uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.append_support_ticket_reply_atomic(uuid,uuid,text) FROM anon;
REVOKE ALL ON FUNCTION public.append_support_ticket_reply_atomic(uuid,uuid,text) FROM authenticated;
REVOKE ALL ON FUNCTION public.append_support_ticket_reply_atomic(uuid,uuid,text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.append_support_ticket_reply_atomic(uuid,uuid,text) TO service_role;

CREATE FUNCTION public.mutate_support_ticket_admin_atomic(
  p_ticket_id uuid,
  p_actor_profile_id uuid,
  p_new_status text,
  p_new_priority text,
  p_new_assigned_to_profile_id uuid,
  p_change_assignment boolean
)
RETURNS TABLE(
  ticket_id uuid,
  resulting_status text,
  resulting_priority text,
  resulting_assigned_to_profile_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_old_status text;
  v_old_priority text;
  v_old_assigned_to_profile_id uuid;
  v_status text;
  v_priority text;
  v_assigned_to_profile_id uuid;
  v_status_changed boolean;
  v_priority_changed boolean;
  v_assignment_changed boolean;
  v_changed_at timestamptz := pg_catalog.clock_timestamp();
  v_status_event text;
BEGIN
  IF p_actor_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admin_profiles p
    WHERE p.id = p_actor_profile_id AND p.is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Active administrative actor is required' USING ERRCODE = '23503';
  END IF;

  IF p_new_status IS NULL AND p_new_priority IS NULL
     AND coalesce(p_change_assignment, false) IS FALSE THEN
    RAISE EXCEPTION 'No administrative mutation requested' USING ERRCODE = '22023';
  END IF;
  IF p_new_status IS NOT NULL
     AND p_new_status NOT IN ('open','in_progress','waiting_for_response','completed') THEN
    RAISE EXCEPTION 'Invalid ticket status' USING ERRCODE = '23514';
  END IF;
  IF p_new_priority IS NOT NULL
     AND p_new_priority NOT IN ('low','normal','high','urgent') THEN
    RAISE EXCEPTION 'Invalid ticket priority' USING ERRCODE = '23514';
  END IF;
  IF coalesce(p_change_assignment, false) AND p_new_assigned_to_profile_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.admin_profiles p
       WHERE p.id = p_new_assigned_to_profile_id AND p.is_active IS TRUE
     ) THEN
    RAISE EXCEPTION 'Unknown or inactive ticket assignee' USING ERRCODE = '23503';
  END IF;

  SELECT t.status, t.priority, t.assigned_to_profile_id
  INTO v_old_status, v_old_priority, v_old_assigned_to_profile_id
  FROM public.support_tickets t
  WHERE t.id = p_ticket_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown support ticket' USING ERRCODE = '23503';
  END IF;

  v_status := coalesce(p_new_status, v_old_status);
  v_priority := coalesce(p_new_priority, v_old_priority);
  v_assigned_to_profile_id := CASE
    WHEN coalesce(p_change_assignment, false) THEN p_new_assigned_to_profile_id
    ELSE v_old_assigned_to_profile_id
  END;
  v_status_changed := v_status IS DISTINCT FROM v_old_status;
  v_priority_changed := v_priority IS DISTINCT FROM v_old_priority;
  v_assignment_changed := v_assigned_to_profile_id IS DISTINCT FROM v_old_assigned_to_profile_id;

  IF v_status_changed OR v_priority_changed OR v_assignment_changed THEN
    UPDATE public.support_tickets t
    SET status = v_status,
        priority = v_priority,
        assigned_to_profile_id = v_assigned_to_profile_id,
        closed_at = CASE
          WHEN v_status_changed AND v_status = 'completed' THEN v_changed_at
          WHEN v_status_changed AND v_status <> 'completed' THEN NULL
          ELSE t.closed_at
        END,
        closed_by_profile_id = CASE
          WHEN v_status_changed AND v_status = 'completed' THEN p_actor_profile_id
          WHEN v_status_changed AND v_status <> 'completed' THEN NULL
          ELSE t.closed_by_profile_id
        END
    WHERE t.id = p_ticket_id;
  END IF;

  IF v_status_changed THEN
    v_status_event := CASE
      WHEN v_status = 'completed' THEN 'closed'
      WHEN v_old_status = 'completed' THEN 'reopened'
      ELSE 'status_changed'
    END;
    INSERT INTO public.support_ticket_events (ticket_id, event_type, actor_profile_id, metadata)
    VALUES (
      p_ticket_id, v_status_event, p_actor_profile_id,
      pg_catalog.jsonb_build_object('old_status', v_old_status, 'new_status', v_status)
    );
  END IF;

  IF v_priority_changed THEN
    INSERT INTO public.support_ticket_events (ticket_id, event_type, actor_profile_id, metadata)
    VALUES (
      p_ticket_id, 'priority_changed', p_actor_profile_id,
      pg_catalog.jsonb_build_object('old_priority', v_old_priority, 'new_priority', v_priority)
    );
  END IF;

  IF v_assignment_changed THEN
    INSERT INTO public.support_ticket_events (ticket_id, event_type, actor_profile_id, metadata)
    VALUES (
      p_ticket_id, 'assigned', p_actor_profile_id,
      pg_catalog.jsonb_build_object(
        'was_assigned', v_old_assigned_to_profile_id IS NOT NULL,
        'is_assigned', v_assigned_to_profile_id IS NOT NULL
      )
    );
  END IF;

  RETURN QUERY SELECT p_ticket_id, v_status, v_priority, v_assigned_to_profile_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean) FROM anon;
REVOKE ALL ON FUNCTION public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean) TO service_role;

DO $verify$
DECLARE
  v_event_expression text;
  v_function_oid oid;
  v_service_execute bigint;
  v_browser_execute bigint;
  v_grantable bigint;
  v_actual text[];
  v_reply_definition_normalized text;
BEGIN
  SELECT pg_catalog.regexp_replace(
           pg_catalog.lower(pg_catalog.pg_get_expr(con.conbin, con.conrelid, true)),
           '[[:space:]]+|::text|[()]', '', 'g'
         )
  INTO v_event_expression
  FROM pg_catalog.pg_constraint con
  WHERE con.conrelid = 'public.support_ticket_events'::regclass
    AND con.conname = 'support_ticket_events_type_check'
    AND con.contype = 'c' AND con.convalidated;
  IF v_event_expression IS DISTINCT FROM
     'event_type=anyarray[''created'',''reply_created'',''status_changed'',''assigned'',''closed'',''reopened'',''priority_changed'']' THEN
    RAISE EXCEPTION 'B15.25 RPC proposal extended event constraint verification failed';
  END IF;

  FOREACH v_function_oid IN ARRAY ARRAY[
    to_regprocedure('public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid)')::oid,
    to_regprocedure('public.append_support_ticket_reply_atomic(uuid,uuid,text)')::oid,
    to_regprocedure('public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean)')::oid
  ] LOOP
    IF v_function_oid IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_catalog.pg_roles r ON r.oid = p.proowner
      JOIN pg_catalog.pg_language l ON l.oid = p.prolang
      WHERE p.oid = v_function_oid AND n.nspname = 'public'
        AND r.rolname = 'postgres' AND l.lanname = 'plpgsql'
        AND p.prosecdef AND p.proconfig = ARRAY['search_path=pg_catalog']::text[]
    ) THEN
      RAISE EXCEPTION 'B15.25 RPC proposal function metadata verification failed';
    END IF;

    SELECT count(*) FILTER (WHERE r.rolname = 'service_role' AND acl.privilege_type = 'EXECUTE'),
           count(*) FILTER (WHERE (acl.grantee = 0 OR r.rolname IN ('anon','authenticated'))
                             AND acl.privilege_type = 'EXECUTE'),
           count(*) FILTER (WHERE acl.is_grantable AND acl.privilege_type = 'EXECUTE')
    INTO v_service_execute, v_browser_execute, v_grantable
    FROM pg_catalog.pg_proc p
    CROSS JOIN LATERAL pg_catalog.aclexplode(p.proacl) acl
    LEFT JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
    WHERE p.oid = v_function_oid;
    IF v_service_execute <> 1 OR v_browser_execute <> 0 OR v_grantable <> 0 THEN
      RAISE EXCEPTION 'B15.25 RPC proposal function ACL verification failed';
    END IF;
  END LOOP;

  IF pg_catalog.pg_get_function_result(
       'public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid)'::regprocedure
     ) <> 'TABLE(ticket_id uuid, ticket_number text)'
     OR pg_catalog.pg_get_function_result(
       'public.append_support_ticket_reply_atomic(uuid,uuid,text)'::regprocedure
     ) <> 'TABLE(message_id uuid, message_created_at timestamp with time zone)'
     OR pg_catalog.pg_get_function_result(
       'public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean)'::regprocedure
     ) <> 'TABLE(ticket_id uuid, resulting_status text, resulting_priority text, resulting_assigned_to_profile_id uuid)' THEN
    RAISE EXCEPTION 'B15.25 RPC proposal return contract verification failed';
  END IF;

  SELECT pg_catalog.regexp_replace(
           pg_catalog.lower(pg_catalog.pg_get_functiondef(
             'public.append_support_ticket_reply_atomic(uuid,uuid,text)'::regprocedure
           )),
           '[[:space:]]+', '', 'g'
         )
  INTO v_reply_definition_normalized;
  IF pg_catalog.strpos(
       v_reply_definition_normalized,
       'ifv_ticket_status=''completed''then'
     ) = 0
     OR pg_catalog.strpos(
       v_reply_definition_normalized,
       'completedsupportticketmustbereopenedbeforereplying'
     ) = 0
     OR pg_catalog.strpos(
       v_reply_definition_normalized,
       'ifv_ticket_statusnotin(''open'',''in_progress'',''waiting_for_response'')then'
     ) = 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal completed reply guard verification failed';
  END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN ('create_support_ticket_atomic','append_support_ticket_reply_atomic','mutate_support_ticket_admin_atomic')) <> 3 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal unexpected support RPC overload';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname='public' AND c.relname='support_tickets' AND r.rolname='service_role';
  IF v_actual <> ARRAY['INSERT','SELECT','UPDATE']::text[] THEN
    RAISE EXCEPTION 'B15.25 RPC proposal changed support_tickets ACL';
  END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_messages' AND r.rolname='service_role';
  IF v_actual <> ARRAY['INSERT','SELECT']::text[] THEN
    RAISE EXCEPTION 'B15.25 RPC proposal changed support_ticket_messages ACL';
  END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_events' AND r.rolname='service_role';
  IF v_actual <> ARRAY['INSERT','SELECT']::text[] THEN
    RAISE EXCEPTION 'B15.25 RPC proposal changed support_ticket_events ACL';
  END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_number_seq' AND r.rolname='service_role';
  IF v_actual <> ARRAY['SELECT','USAGE']::text[] THEN
    RAISE EXCEPTION 'B15.25 RPC proposal changed sequence ACL';
  END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public'
        AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events')
        AND c.relrowsecurity AND NOT c.relforcerowsecurity) <> 3
     OR (SELECT count(*) FROM pg_catalog.pg_policies
         WHERE schemaname='public'
           AND tablename IN ('support_tickets','support_ticket_messages','support_ticket_events')) <> 0 THEN
    RAISE EXCEPTION 'B15.25 RPC proposal changed RLS/policy contract';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
    LEFT JOIN pg_catalog.pg_roles r ON r.oid = acl.grantee
    WHERE n.nspname = 'public'
      AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events','support_ticket_number_seq')
      AND (acl.grantee = 0 OR r.rolname IN ('anon','authenticated'))
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC proposal changed browser relation ACL';
  END IF;
END;
$verify$;

COMMIT;
