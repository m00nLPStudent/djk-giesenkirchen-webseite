-- B15.25 Support Tickets V1 - atomic server-only RPC rollback
-- MANUAL EXECUTION ONLY after explicit approval.
-- Removes exactly the three RPCs and restores the original six-value event contract.
-- Ticket data is never deleted; priority_changed data blocks this rollback fail-closed.

BEGIN;

DO $guard$
DECLARE
  v_event_expression text;
  v_function_oid oid;
  v_service_execute bigint;
  v_browser_execute bigint;
  v_grantable bigint;
  v_actual text[];
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'B15.25 RPC rollback must run as postgres';
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
     'event_type=anyarray[''created'',''reply_created'',''status_changed'',''assigned'',''closed'',''reopened'',''priority_changed'']' THEN
    RAISE EXCEPTION 'B15.25 RPC rollback extended event constraint baseline differs';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.support_ticket_events WHERE event_type = 'priority_changed'
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC rollback blocked by existing priority_changed events';
  END IF;

  FOREACH v_function_oid IN ARRAY ARRAY[
    to_regprocedure('public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid)')::oid,
    to_regprocedure('public.append_support_ticket_reply_atomic(uuid,uuid,text)')::oid,
    to_regprocedure('public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean)')::oid
  ] LOOP
    IF v_function_oid IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      JOIN pg_catalog.pg_roles r ON r.oid=p.proowner
      JOIN pg_catalog.pg_language l ON l.oid=p.prolang
      WHERE p.oid=v_function_oid AND n.nspname='public'
        AND r.rolname='postgres' AND l.lanname='plpgsql'
        AND p.prosecdef AND p.proconfig=ARRAY['search_path=pg_catalog']::text[]
    ) THEN
      RAISE EXCEPTION 'B15.25 RPC rollback function metadata baseline differs';
    END IF;

    SELECT count(*) FILTER (WHERE r.rolname='service_role' AND acl.privilege_type='EXECUTE'),
           count(*) FILTER (WHERE (acl.grantee=0 OR r.rolname IN ('anon','authenticated'))
                             AND acl.privilege_type='EXECUTE'),
           count(*) FILTER (WHERE acl.is_grantable AND acl.privilege_type='EXECUTE')
    INTO v_service_execute, v_browser_execute, v_grantable
    FROM pg_catalog.pg_proc p
    CROSS JOIN LATERAL pg_catalog.aclexplode(p.proacl) acl
    LEFT JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
    WHERE p.oid=v_function_oid;
    IF v_service_execute<>1 OR v_browser_execute<>0 OR v_grantable<>0 THEN
      RAISE EXCEPTION 'B15.25 RPC rollback function ACL baseline differs';
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public'
        AND p.proname IN ('create_support_ticket_atomic','append_support_ticket_reply_atomic','mutate_support_ticket_admin_atomic')) <> 3 THEN
    RAISE EXCEPTION 'B15.25 RPC rollback unexpected support RPC overload';
  END IF;

  IF pg_catalog.pg_get_function_result(
       'public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid)'::regprocedure
     ) <> 'TABLE(ticket_id uuid, ticket_number text)'
     OR pg_catalog.pg_get_function_result(
       'public.append_support_ticket_reply_atomic(uuid,uuid,text)'::regprocedure
     ) <> 'TABLE(message_id uuid, message_created_at timestamp with time zone)'
     OR pg_catalog.pg_get_function_result(
       'public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean)'::regprocedure
     ) <> 'TABLE(ticket_id uuid, resulting_status text, resulting_priority text, resulting_assigned_to_profile_id uuid)' THEN
    RAISE EXCEPTION 'B15.25 RPC rollback return contract baseline differs';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_tickets' AND r.rolname='service_role';
  IF v_actual<>ARRAY['INSERT','SELECT','UPDATE']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback support_tickets ACL differs'; END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_messages' AND r.rolname='service_role';
  IF v_actual<>ARRAY['INSERT','SELECT']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback support_ticket_messages ACL differs'; END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_events' AND r.rolname='service_role';
  IF v_actual<>ARRAY['INSERT','SELECT']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback support_ticket_events ACL differs'; END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_number_seq' AND r.rolname='service_role';
  IF v_actual<>ARRAY['SELECT','USAGE']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback sequence ACL differs'; END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events')
        AND c.relrowsecurity AND NOT c.relforcerowsecurity)<>3
     OR (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public'
         AND tablename IN ('support_tickets','support_ticket_messages','support_ticket_events'))<>0 THEN
    RAISE EXCEPTION 'B15.25 RPC rollback RLS/policy baseline differs';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
    LEFT JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
    WHERE n.nspname='public'
      AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events','support_ticket_number_seq')
      AND (acl.grantee=0 OR r.rolname IN ('anon','authenticated'))
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC rollback browser relation ACL differs';
  END IF;
END;
$guard$;

DROP FUNCTION public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean);
DROP FUNCTION public.append_support_ticket_reply_atomic(uuid,uuid,text);
DROP FUNCTION public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid);

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
      'reopened'
    )
  );

DO $verify$
DECLARE
  v_event_expression text;
  v_actual text[];
BEGIN
  IF to_regprocedure('public.create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid)') IS NOT NULL
     OR to_regprocedure('public.append_support_ticket_reply_atomic(uuid,uuid,text)') IS NOT NULL
     OR to_regprocedure('public.mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean)') IS NOT NULL THEN
    RAISE EXCEPTION 'B15.25 RPC rollback function removal verification failed';
  END IF;

  SELECT pg_catalog.regexp_replace(
           pg_catalog.lower(pg_catalog.pg_get_expr(con.conbin, con.conrelid, true)),
           '[[:space:]]+|::text|[()]', '', 'g'
         )
  INTO v_event_expression
  FROM pg_catalog.pg_constraint con
  WHERE con.conrelid='public.support_ticket_events'::regclass
    AND con.conname='support_ticket_events_type_check'
    AND con.contype='c' AND con.convalidated;
  IF v_event_expression IS DISTINCT FROM
     'event_type=anyarray[''created'',''reply_created'',''status_changed'',''assigned'',''closed'',''reopened'']' THEN
    RAISE EXCEPTION 'B15.25 RPC rollback original event constraint verification failed';
  END IF;

  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_tickets' AND r.rolname='service_role';
  IF v_actual<>ARRAY['INSERT','SELECT','UPDATE']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback changed support_tickets ACL'; END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_messages' AND r.rolname='service_role';
  IF v_actual<>ARRAY['INSERT','SELECT']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback changed support_ticket_messages ACL'; END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_events' AND r.rolname='service_role';
  IF v_actual<>ARRAY['INSERT','SELECT']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback changed support_ticket_events ACL'; END IF;
  SELECT coalesce(array_agg(acl.privilege_type ORDER BY acl.privilege_type),ARRAY[]::text[])
  INTO v_actual FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
  WHERE n.nspname='public' AND c.relname='support_ticket_number_seq' AND r.rolname='service_role';
  IF v_actual<>ARRAY['SELECT','USAGE']::text[] THEN RAISE EXCEPTION 'B15.25 RPC rollback changed sequence ACL'; END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events')
        AND c.relrowsecurity AND NOT c.relforcerowsecurity)<>3
     OR (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public'
         AND tablename IN ('support_tickets','support_ticket_messages','support_ticket_events'))<>0 THEN
    RAISE EXCEPTION 'B15.25 RPC rollback changed RLS/policy contract';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
    LEFT JOIN pg_catalog.pg_roles r ON r.oid=acl.grantee
    WHERE n.nspname='public'
      AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events','support_ticket_number_seq')
      AND (acl.grantee=0 OR r.rolname IN ('anon','authenticated'))
  ) THEN
    RAISE EXCEPTION 'B15.25 RPC rollback changed browser relation ACL';
  END IF;
END;
$verify$;

COMMIT;
