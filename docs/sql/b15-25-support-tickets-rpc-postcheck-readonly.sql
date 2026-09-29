-- B15.25 Support Tickets V1 - atomic RPC postcheck (READ ONLY)
-- Run exactly once in the Supabase SQL Editor with "No limit" and export
-- the single result set as one CSV file. This statement never invokes an RPC.

WITH
expected_rpcs(function_name, input_type_signature, return_type) AS (
  VALUES
    ('create_support_ticket_atomic'::text, 'uuid,text,text,text,text,uuid,uuid'::text,
     'TABLE(ticket_id uuid, ticket_number text)'::text),
    ('append_support_ticket_reply_atomic', 'uuid,uuid,text',
     'TABLE(message_id uuid, message_created_at timestamp with time zone)'),
    ('mutate_support_ticket_admin_atomic', 'uuid,uuid,text,text,uuid,boolean',
     'TABLE(ticket_id uuid, resulting_status text, resulting_priority text, resulting_assigned_to_profile_id uuid)')
),
expected_columns(table_name, column_name) AS (
  VALUES
    ('support_tickets','id'), ('support_tickets','ticket_number'),
    ('support_tickets','created_by_profile_id'), ('support_tickets','category'),
    ('support_tickets','area_key'), ('support_tickets','department_id'),
    ('support_tickets','team_id'), ('support_tickets','subject'),
    ('support_tickets','status'), ('support_tickets','priority'),
    ('support_tickets','assigned_to_profile_id'), ('support_tickets','created_at'),
    ('support_tickets','updated_at'), ('support_tickets','last_activity_at'),
    ('support_tickets','closed_at'), ('support_tickets','closed_by_profile_id'),
    ('support_ticket_messages','id'), ('support_ticket_messages','ticket_id'),
    ('support_ticket_messages','author_profile_id'), ('support_ticket_messages','body'),
    ('support_ticket_messages','created_at'),
    ('support_ticket_events','id'), ('support_ticket_events','ticket_id'),
    ('support_ticket_events','event_type'), ('support_ticket_events','actor_profile_id'),
    ('support_ticket_events','metadata'), ('support_ticket_events','created_at')
),
expected_constraints(table_name, constraint_name) AS (
  VALUES
    ('support_tickets','support_tickets_pkey'),
    ('support_tickets','support_tickets_ticket_number_key'),
    ('support_tickets','support_tickets_created_by_profile_fkey'),
    ('support_tickets','support_tickets_department_fkey'),
    ('support_tickets','support_tickets_team_fkey'),
    ('support_tickets','support_tickets_assigned_to_profile_fkey'),
    ('support_tickets','support_tickets_closed_by_profile_fkey'),
    ('support_tickets','support_tickets_ticket_number_check'),
    ('support_tickets','support_tickets_category_check'),
    ('support_tickets','support_tickets_area_key_check'),
    ('support_tickets','support_tickets_subject_check'),
    ('support_tickets','support_tickets_status_check'),
    ('support_tickets','support_tickets_priority_check'),
    ('support_tickets','support_tickets_activity_time_check'),
    ('support_tickets','support_tickets_closed_state_check'),
    ('support_tickets','support_tickets_closed_time_check'),
    ('support_ticket_messages','support_ticket_messages_pkey'),
    ('support_ticket_messages','support_ticket_messages_ticket_fkey'),
    ('support_ticket_messages','support_ticket_messages_author_profile_fkey'),
    ('support_ticket_messages','support_ticket_messages_body_check'),
    ('support_ticket_events','support_ticket_events_pkey'),
    ('support_ticket_events','support_ticket_events_ticket_fkey'),
    ('support_ticket_events','support_ticket_events_actor_profile_fkey'),
    ('support_ticket_events','support_ticket_events_type_check'),
    ('support_ticket_events','support_ticket_events_metadata_object_check'),
    ('support_ticket_events','support_ticket_events_metadata_size_check'),
    ('support_ticket_events','support_ticket_events_no_message_content_check')
),
all_blocks(result_block, result_order) AS (
  VALUES
    ('RPCPC.01_SUMMARY'::text, 10),
    ('RPCPC.02_EVENT_CONSTRAINT'::text, 20),
    ('RPCPC.03_RPC_INVENTORY'::text, 30),
    ('RPCPC.04_RPC_SIGNATURES_RETURNS'::text, 40),
    ('RPCPC.05_RPC_SECURITY'::text, 50),
    ('RPCPC.06_RPC_ACLS'::text, 60),
    ('RPCPC.07_CREATE_RPC_CONTRACT'::text, 70),
    ('RPCPC.08_REPLY_RPC_CONTRACT'::text, 80),
    ('RPCPC.09_ADMIN_RPC_CONTRACT'::text, 90),
    ('RPCPC.10_MESSAGE_TRIGGER'::text, 100),
    ('RPCPC.11_RELATION_ACLS'::text, 110),
    ('RPCPC.12_BROWSER_ACCESS'::text, 120),
    ('RPCPC.13_RLS_POLICIES'::text, 130),
    ('RPCPC.14_SERVICE_ROLE'::text, 140),
    ('RPCPC.15_TICKET_SEQUENCE'::text, 150),
    ('RPCPC.16_TABLE_CONTRACT'::text, 160),
    ('RPCPC.17_DATA_COUNTS'::text, 170),
    ('RPCPC.18_UNEXPECTED_SUPPORT_RPCS'::text, 180),
    ('RPCPC.19_CONTRACT_TOTALS'::text, 190)
),
rpc_catalog AS MATERIALIZED (
  SELECT p.oid, n.nspname AS schema_name, p.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    (
      SELECT pg_catalog.string_agg(
        pg_catalog.format_type(input_type_oid, NULL), ',' ORDER BY ordinal_position
      )
      FROM pg_catalog.unnest(p.proargtypes::oid[])
        WITH ORDINALITY AS input_arg(input_type_oid, ordinal_position)
    ) AS input_type_signature,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    owner_role.rolname AS owner_name, lang.lanname AS language_name,
    p.prosecdef AS security_definer, p.proconfig,
    pg_catalog.pg_get_functiondef(p.oid) AS function_definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  JOIN pg_catalog.pg_language lang ON lang.oid = p.prolang
  WHERE n.nspname = 'public'
    AND p.proname IN (SELECT function_name FROM expected_rpcs)
),
rpc_body AS MATERIALIZED (
  SELECT function_name,
    pg_catalog.regexp_replace(pg_catalog.lower(function_definition), '[[:space:]]+', '', 'g') AS body
  FROM rpc_catalog
),
rpc_acl AS MATERIALIZED (
  SELECT r.oid, r.function_name,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee,
    acl.privilege_type, acl.is_grantable
  FROM rpc_catalog r
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce((SELECT p.proacl FROM pg_catalog.pg_proc p WHERE p.oid = r.oid),
             pg_catalog.acldefault('f', (SELECT p.proowner FROM pg_catalog.pg_proc p WHERE p.oid = r.oid)))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
),
rpc_acl_facts AS MATERIALIZED (
  SELECT e.function_name,
    count(*) FILTER (WHERE a.oid IS NOT NULL AND a.grantee = 'service_role' AND a.privilege_type = 'EXECUTE') = 1
      AS service_role_execute,
    count(*) FILTER (WHERE a.oid IS NOT NULL AND a.grantee = 'PUBLIC' AND a.privilege_type = 'EXECUTE') = 0
      AS public_execute_absent,
    count(*) FILTER (WHERE a.oid IS NOT NULL AND a.grantee = 'anon' AND a.privilege_type = 'EXECUTE') = 0
      AS anon_execute_absent,
    count(*) FILTER (WHERE a.oid IS NOT NULL AND a.grantee = 'authenticated' AND a.privilege_type = 'EXECUTE') = 0
      AS authenticated_execute_absent,
    count(*) FILTER (WHERE a.oid IS NOT NULL AND a.privilege_type = 'EXECUTE' AND a.is_grantable) = 0
      AS execute_grant_option_absent,
    count(*) FILTER (WHERE a.oid IS NOT NULL AND a.privilege_type = 'EXECUTE'
                        AND a.grantee NOT IN ('postgres','service_role')) = 0
      AS unexpected_execute_absent,
    coalesce(pg_catalog.has_function_privilege('service_role', r.oid, 'EXECUTE'), false)
      AS service_role_effective_execute,
    coalesce(pg_catalog.has_function_privilege('anon', r.oid, 'EXECUTE'), false) = false
      AS anon_effective_execute_absent,
    coalesce(pg_catalog.has_function_privilege('authenticated', r.oid, 'EXECUTE'), false) = false
      AS authenticated_effective_execute_absent
  FROM expected_rpcs e
  LEFT JOIN rpc_catalog r ON r.function_name = e.function_name
    AND r.input_type_signature = e.input_type_signature
  LEFT JOIN rpc_acl a ON a.oid = r.oid
  GROUP BY e.function_name, r.oid
),
event_constraint AS MATERIALIZED (
  SELECT con.conname, con.contype, con.convalidated,
    pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
    pg_catalog.regexp_replace(
      pg_catalog.lower(pg_catalog.pg_get_expr(con.conbin, con.conrelid, true)),
      '[[:space:]]+|::text|[()]', '', 'g'
    ) AS normalized_expression
  FROM pg_catalog.pg_constraint con
  WHERE con.conrelid = 'public.support_ticket_events'::regclass
    AND con.conname = 'support_ticket_events_type_check'
),
event_facts AS MATERIALIZED (
  SELECT count(*) = 1
    AND bool_and(conname = 'support_ticket_events_type_check')
    AND bool_and(contype = 'c') AND bool_and(convalidated)
    AND bool_and(normalized_expression =
      'event_type=anyarray[''created'',''reply_created'',''status_changed'',''assigned'',''closed'',''reopened'',''priority_changed'']')
      AS event_contract_ok
  FROM event_constraint
),
rpc_shape_facts AS MATERIALIZED (
  SELECT
    (SELECT count(*) FROM rpc_catalog) = 3 AS all_three_rpcs_exist,
    NOT EXISTS (
      SELECT function_name, input_type_signature FROM rpc_catalog
      EXCEPT SELECT function_name, input_type_signature FROM expected_rpcs
    ) AND NOT EXISTS (
      SELECT function_name, input_type_signature FROM expected_rpcs
      EXCEPT SELECT function_name, input_type_signature FROM rpc_catalog
    ) AS rpc_signatures_ok,
    NOT EXISTS (
      SELECT function_name, input_type_signature, return_type FROM rpc_catalog
      EXCEPT SELECT function_name, input_type_signature, return_type FROM expected_rpcs
    ) AND NOT EXISTS (
      SELECT function_name, input_type_signature, return_type FROM expected_rpcs
      EXCEPT SELECT function_name, input_type_signature, return_type FROM rpc_catalog
    ) AS rpc_return_contracts_ok,
    (SELECT count(*) = 3 AND bool_and(owner_name = 'postgres') FROM rpc_catalog)
      AS rpc_owner_contract_ok,
    (SELECT count(*) = 3 AND bool_and(language_name = 'plpgsql') FROM rpc_catalog)
      AS rpc_language_contract_ok,
    (SELECT count(*) = 3 AND bool_and(security_definer) FROM rpc_catalog)
      AS rpc_security_definer_contract_ok,
    (SELECT count(*) = 3 AND bool_and(proconfig = ARRAY['search_path=pg_catalog']::text[])
     FROM rpc_catalog) AS rpc_search_path_contract_ok
),
body_facts AS MATERIALIZED (
  SELECT
    coalesce((SELECT
      body LIKE '%frompublic.admin_profilespwherep.id=p_actor_profile_idandp.is_activeistrue%'
      AND body LIKE '%p_categorynotin(''problem'',''question'',''improvement'',''other'')%'
      AND body LIKE '%frompublic.departmentsdwhere%'
      AND body LIKE '%frompublic.teamstwhere%'
      AND body LIKE '%v_team_department_idisdistinctfromp_department_id%'
      AND body LIKE '%insertintopublic.support_tickets%'
      AND body LIKE '%''open'',''normal''%'
      AND body LIKE '%insertintopublic.support_ticket_messages%'
      AND body LIKE '%insertintopublic.support_ticket_events%'
      AND body LIKE '%''created''%'
      FROM rpc_body WHERE function_name = 'create_support_ticket_atomic'), false)
      AS create_rpc_body_contract_ok,
    coalesce((SELECT
      body LIKE '%frompublic.admin_profilespwherep.id=p_actor_profile_idandp.is_activeistrue%'
      AND body LIKE '%p_message_body<>pg_catalog.btrim(p_message_body)%'
      AND body LIKE '%frompublic.support_ticketst%forupdate;%'
      AND body LIKE '%ifv_ticket_status=''completed''then%'
      AND body LIKE '%completedsupportticketmustbereopenedbeforereplying%'
      AND body LIKE '%ifv_ticket_statusnotin(''open'',''in_progress'',''waiting_for_response'')then%'
      AND body NOT LIKE '%updatepublic.support_tickets%'
      AND body LIKE '%insertintopublic.support_ticket_messages%'
      AND body LIKE '%insertintopublic.support_ticket_events%'
      AND body LIKE '%''reply_created''%'
      FROM rpc_body WHERE function_name = 'append_support_ticket_reply_atomic'), false)
      AS reply_rpc_body_contract_ok,
    coalesce((SELECT
      body LIKE '%frompublic.admin_profilespwherep.id=p_actor_profile_idandp.is_activeistrue%'
      AND body LIKE '%frompublic.support_ticketst%forupdate;%'
      AND body LIKE '%p_new_statusnotin(''open'',''in_progress'',''waiting_for_response'',''completed'')%'
      AND body LIKE '%p_new_prioritynotin(''low'',''normal'',''high'',''urgent'')%'
      AND body LIKE '%v_status_changed:=%'
      AND body LIKE '%v_priority_changed:=%'
      AND body LIKE '%v_assignment_changed:=%'
      AND body LIKE '%whenv_status=''completed''then''closed''%'
      AND body LIKE '%whenv_old_status=''completed''then''reopened''%'
      AND body LIKE '%else''status_changed''%'
      AND body LIKE '%''priority_changed''%'
      AND body LIKE '%''assigned''%'
      AND body LIKE '%closed_at=case%'
      AND body LIKE '%closed_by_profile_id=case%'
      AND body LIKE '%ifv_status_changedthen%'
      AND body LIKE '%ifv_priority_changedthen%'
      AND body LIKE '%ifv_assignment_changedthen%'
      FROM rpc_body WHERE function_name = 'mutate_support_ticket_admin_atomic'), false)
      AS admin_rpc_body_contract_ok
),
trigger_facts AS MATERIALIZED (
  SELECT count(*) = 1
    AND bool_and(t.tgenabled <> 'D')
    AND bool_and(p.proname = 'touch_support_ticket_from_message')
    AND bool_and(pn.nspname = 'public')
    AND bool_and(owner_role.rolname = 'postgres')
    AND bool_and(p.prosecdef)
    AND bool_and(p.proconfig = ARRAY['search_path=pg_catalog']::text[])
      AS message_touch_contract_ok
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
  JOIN pg_catalog.pg_namespace pn ON pn.oid = p.pronamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE n.nspname = 'public' AND c.relname = 'support_ticket_messages'
    AND t.tgname = 'support_ticket_messages_touch_parent' AND NOT t.tgisinternal
),
relation_acl AS MATERIALIZED (
  SELECT c.relname AS relation_name,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee,
    acl.privilege_type, acl.is_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events','support_ticket_number_seq')
),
relation_acl_facts AS MATERIALIZED (
  SELECT
    (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
     FROM relation_acl WHERE relation_name='support_tickets' AND grantee='service_role')
      = ARRAY['INSERT','SELECT','UPDATE']::text[]
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_messages' AND grantee='service_role')
      = ARRAY['INSERT','SELECT']::text[]
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_events' AND grantee='service_role')
      = ARRAY['INSERT','SELECT']::text[]
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_number_seq' AND grantee='service_role')
      = ARRAY['SELECT','USAGE']::text[]
    AND NOT EXISTS (SELECT 1 FROM relation_acl WHERE grantee='service_role' AND is_grantable)
      AS service_role_relation_acl_contract_ok,
    NOT EXISTS (
      SELECT 1 FROM relation_acl WHERE grantee IN ('PUBLIC','anon','authenticated')
    ) AS browser_relation_access_absent
),
rls_facts AS MATERIALIZED (
  SELECT
    (SELECT count(*)=3 AND bool_and(c.relrowsecurity) AND bool_and(NOT c.relforcerowsecurity)
     FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public'
       AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events')
       AND c.relkind='r') AS rls_contract_ok,
    (SELECT count(*)=0 FROM pg_catalog.pg_policies
     WHERE schemaname='public'
       AND tablename IN ('support_tickets','support_ticket_messages','support_ticket_events'))
      AS policy_contract_ok
),
service_role_facts AS MATERIALIZED (
  SELECT count(*)=1 AND bool_and(rolbypassrls) AS service_role_exists_with_bypassrls
  FROM pg_catalog.pg_roles WHERE rolname='service_role'
),
sequence_facts AS MATERIALIZED (
  SELECT
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_catalog.pg_roles r ON r.oid=c.relowner
      WHERE n.nspname='public' AND c.relname='support_ticket_number_seq'
        AND c.relkind='S' AND r.rolname='postgres'
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='support_tickets'
        AND column_name='ticket_number'
        AND coalesce(column_default,'') LIKE '%support_ticket_number_seq%'
    )
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_number_seq' AND grantee='service_role')
        = ARRAY['SELECT','USAGE']::text[]
      AS ticket_number_contract_ok
),
table_facts AS MATERIALIZED (
  SELECT
    NOT EXISTS (
      SELECT table_name,column_name FROM expected_columns
      EXCEPT SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'
    ) AND NOT EXISTS (
      SELECT table_name,column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name IN ('support_tickets','support_ticket_messages','support_ticket_events')
      EXCEPT SELECT table_name,column_name FROM expected_columns
    ) AS column_contract_ok,
    NOT EXISTS (
      SELECT table_name,constraint_name FROM expected_constraints
      EXCEPT
      SELECT c.relname,con.conname FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class c ON c.oid=con.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
    ) AND NOT EXISTS (
      SELECT c.relname,con.conname FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class c ON c.oid=con.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN ('support_tickets','support_ticket_messages','support_ticket_events')
      EXCEPT SELECT table_name,constraint_name FROM expected_constraints
    ) AS constraint_contract_ok
),
data_facts AS MATERIALIZED (
  SELECT
    (SELECT count(*) FROM public.support_tickets)::bigint AS ticket_count,
    (SELECT count(*) FROM public.support_ticket_messages)::bigint AS message_count,
    (SELECT count(*) FROM public.support_ticket_events)::bigint AS event_count
),
unexpected_functions AS MATERIALIZED (
  SELECT n.nspname AS schema_name,p.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname ~* 'support_ticket'
    AND p.proname NOT IN (
      'touch_support_ticket_from_message','create_support_ticket_atomic',
      'append_support_ticket_reply_atomic','mutate_support_ticket_admin_atomic'
    )
),
summary AS MATERIALIZED (
  SELECT ef.event_contract_ok, sf.all_three_rpcs_exist, sf.rpc_signatures_ok,
    sf.rpc_return_contracts_ok, sf.rpc_owner_contract_ok,
    sf.rpc_language_contract_ok, sf.rpc_security_definer_contract_ok,
    sf.rpc_search_path_contract_ok,
    (SELECT count(*)=3 AND bool_and(
       service_role_execute AND public_execute_absent AND anon_execute_absent
       AND authenticated_execute_absent AND execute_grant_option_absent
       AND unexpected_execute_absent
       AND service_role_effective_execute AND anon_effective_execute_absent
       AND authenticated_effective_execute_absent
     ) FROM rpc_acl_facts) AS function_acl_contract_ok,
    bf.create_rpc_body_contract_ok,bf.reply_rpc_body_contract_ok,
    bf.admin_rpc_body_contract_ok,tf.message_touch_contract_ok,
    af.service_role_relation_acl_contract_ok,af.browser_relation_access_absent,
    rf.rls_contract_ok,rf.policy_contract_ok,
    (srf.service_role_exists_with_bypassrls
      AND af.service_role_relation_acl_contract_ok
      AND (SELECT count(*)=3 AND bool_and(service_role_effective_execute) FROM rpc_acl_facts))
      AS service_role_contract_ok,
    seq.ticket_number_contract_ok,tbf.column_contract_ok,tbf.constraint_contract_ok,
    df.ticket_count,df.message_count,df.event_count,
    (df.ticket_count=0 AND df.message_count=0 AND df.event_count=0) AS data_baseline_ok,
    (SELECT count(*) FROM unexpected_functions)::bigint AS unexpected_support_rpc_count
  FROM event_facts ef CROSS JOIN rpc_shape_facts sf CROSS JOIN body_facts bf
  CROSS JOIN trigger_facts tf CROSS JOIN relation_acl_facts af CROSS JOIN rls_facts rf
  CROSS JOIN service_role_facts srf CROSS JOIN sequence_facts seq CROSS JOIN table_facts tbf
  CROSS JOIN data_facts df
),
actual_rows AS (
  SELECT 'RPCPC.01_SUMMARY'::text result_block,10 result_order,1::bigint row_order,'summary'::text row_type,
    to_jsonb(s) || jsonb_build_object('rpc_extension_postcheck_ok',
      s.event_contract_ok AND s.all_three_rpcs_exist AND s.rpc_signatures_ok
      AND s.rpc_return_contracts_ok AND s.rpc_owner_contract_ok AND s.rpc_language_contract_ok
      AND s.rpc_security_definer_contract_ok AND s.rpc_search_path_contract_ok
      AND s.function_acl_contract_ok AND s.create_rpc_body_contract_ok
      AND s.reply_rpc_body_contract_ok AND s.admin_rpc_body_contract_ok
      AND s.message_touch_contract_ok AND s.service_role_relation_acl_contract_ok
      AND s.browser_relation_access_absent AND s.rls_contract_ok AND s.policy_contract_ok
      AND s.service_role_contract_ok AND s.ticket_number_contract_ok
      AND s.column_contract_ok AND s.constraint_contract_ok AND s.data_baseline_ok
      AND s.unexpected_support_rpc_count=0) data FROM summary s
  UNION ALL
  SELECT 'RPCPC.02_EVENT_CONSTRAINT',20,1,'constraint',jsonb_build_object(
    'event_contract_ok',ef.event_contract_ok,'name',ec.conname,'type',ec.contype,
    'validated',ec.convalidated,'definition',ec.definition)
  FROM event_facts ef LEFT JOIN event_constraint ec ON true
  UNION ALL
  SELECT 'RPCPC.03_RPC_INVENTORY',30,row_number()OVER(ORDER BY function_name,identity_arguments),'function',
    jsonb_build_object('schema',schema_name,'name',function_name,'identity_arguments',identity_arguments,
      'input_type_signature',input_type_signature,
      'return_type',return_type,'owner',owner_name,'language',language_name) FROM rpc_catalog
  UNION ALL
  SELECT 'RPCPC.04_RPC_SIGNATURES_RETURNS',40,1,'contract',jsonb_build_object(
    'all_three_rpcs_exist',all_three_rpcs_exist,'rpc_signatures_ok',rpc_signatures_ok,
    'rpc_return_contracts_ok',rpc_return_contracts_ok) FROM rpc_shape_facts
  UNION ALL
  SELECT 'RPCPC.05_RPC_SECURITY',50,row_number()OVER(ORDER BY function_name),'function_security',
    jsonb_build_object('name',function_name,'owner',owner_name,'language',language_name,
      'security_definer',security_definer,'config',to_jsonb(proconfig)) FROM rpc_catalog
  UNION ALL
  SELECT 'RPCPC.06_RPC_ACLS',60,row_number()OVER(ORDER BY function_name),'function_acl',
    jsonb_build_object('name',function_name,'service_role_execute',service_role_execute,
      'public_execute_absent',public_execute_absent,'anon_execute_absent',anon_execute_absent,
      'authenticated_execute_absent',authenticated_execute_absent,
      'execute_grant_option_absent',execute_grant_option_absent,
      'unexpected_execute_absent',unexpected_execute_absent,
      'service_role_effective_execute',service_role_effective_execute) FROM rpc_acl_facts
  UNION ALL
  SELECT 'RPCPC.07_CREATE_RPC_CONTRACT',70,1,'contract',jsonb_build_object(
    'create_rpc_body_contract_ok',create_rpc_body_contract_ok) FROM body_facts
  UNION ALL
  SELECT 'RPCPC.08_REPLY_RPC_CONTRACT',80,1,'contract',jsonb_build_object(
    'reply_rpc_body_contract_ok',reply_rpc_body_contract_ok,
    'completed_rejected',reply_rpc_body_contract_ok,
    'allowed_states',jsonb_build_array('open','in_progress','waiting_for_response')) FROM body_facts
  UNION ALL
  SELECT 'RPCPC.09_ADMIN_RPC_CONTRACT',90,1,'contract',jsonb_build_object(
    'admin_rpc_body_contract_ok',admin_rpc_body_contract_ok) FROM body_facts
  UNION ALL
  SELECT 'RPCPC.10_MESSAGE_TRIGGER',100,1,'contract',jsonb_build_object(
    'message_touch_contract_ok',message_touch_contract_ok) FROM trigger_facts
  UNION ALL
  SELECT 'RPCPC.11_RELATION_ACLS',110,row_number()OVER(ORDER BY relation_name,grantee,privilege_type),'acl',
    jsonb_build_object('relation',relation_name,'grantee',grantee,'privilege',privilege_type,
      'grantable',is_grantable) FROM relation_acl WHERE grantee='service_role'
  UNION ALL
  SELECT 'RPCPC.12_BROWSER_ACCESS',120,row_number()OVER(ORDER BY relation_name,grantee,privilege_type),'unexpected_acl',
    jsonb_build_object('relation',relation_name,'grantee',grantee,'privilege',privilege_type)
    FROM relation_acl WHERE grantee IN ('PUBLIC','anon','authenticated')
  UNION ALL
  SELECT 'RPCPC.13_RLS_POLICIES',130,1,'contract',jsonb_build_object(
    'rls_contract_ok',rls_contract_ok,'policy_contract_ok',policy_contract_ok) FROM rls_facts
  UNION ALL
  SELECT 'RPCPC.14_SERVICE_ROLE',140,1,'contract',jsonb_build_object(
    'exists_with_bypassrls',service_role_exists_with_bypassrls,
    'service_role_contract_ok',(SELECT service_role_contract_ok FROM summary)) FROM service_role_facts
  UNION ALL
  SELECT 'RPCPC.15_TICKET_SEQUENCE',150,1,'contract',jsonb_build_object(
    'ticket_number_contract_ok',ticket_number_contract_ok) FROM sequence_facts
  UNION ALL
  SELECT 'RPCPC.16_TABLE_CONTRACT',160,1,'contract',jsonb_build_object(
    'column_contract_ok',column_contract_ok,'constraint_contract_ok',constraint_contract_ok) FROM table_facts
  UNION ALL
  SELECT 'RPCPC.17_DATA_COUNTS',170,1,'aggregate',jsonb_build_object(
    'ticket_count',ticket_count,'message_count',message_count,'event_count',event_count,
    'data_baseline_ok',ticket_count=0 AND message_count=0 AND event_count=0) FROM data_facts
  UNION ALL
  SELECT 'RPCPC.18_UNEXPECTED_SUPPORT_RPCS',180,row_number()OVER(ORDER BY function_name,identity_arguments),'unexpected_function',
    jsonb_build_object('schema',schema_name,'name',function_name,'identity_arguments',identity_arguments,
      'return_type',return_type) FROM unexpected_functions
  UNION ALL
  SELECT 'RPCPC.19_CONTRACT_TOTALS',190,1,'contract',jsonb_build_object(
    'expected_rpc_count',3,'actual_rpc_count',(SELECT count(*) FROM rpc_catalog),
    'unexpected_support_rpc_count',unexpected_support_rpc_count,
    'expected_event_value_count',7) FROM summary
),
final_rows AS (
  SELECT result_block,result_order,row_order,row_type,data FROM actual_rows
  UNION ALL
  SELECT b.result_block,b.result_order,1::bigint,'empty',
    jsonb_build_object('empty',true,'message','No matching rows found')
  FROM all_blocks b WHERE NOT EXISTS(
    SELECT 1 FROM actual_rows r WHERE r.result_block=b.result_block
  )
)
SELECT result_block,result_order,row_order,row_type,data
FROM final_rows
ORDER BY result_order,row_order;
