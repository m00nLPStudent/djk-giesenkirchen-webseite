-- B15.25 Support Tickets V1 - focused RPC postcheck diagnosis (READ ONLY)
-- Run manually once in the Supabase SQL Editor with "No limit".
-- This single statement inspects metadata only and never invokes an RPC.

WITH
expected(function_name, input_type_signature, expected_return_type) AS (
  VALUES
    ('create_support_ticket_atomic'::text, 'uuid,text,text,text,text,uuid,uuid'::text,
     'TABLE(ticket_id uuid, ticket_number text)'::text),
    ('append_support_ticket_reply_atomic', 'uuid,uuid,text',
     'TABLE(message_id uuid, message_created_at timestamp with time zone)'),
    ('mutate_support_ticket_admin_atomic', 'uuid,uuid,text,text,uuid,boolean',
     'TABLE(ticket_id uuid, resulting_status text, resulting_priority text, resulting_assigned_to_profile_id uuid)')
),
all_blocks(result_block, result_order) AS (
  VALUES
    ('RPCDIAG.01_SUMMARY'::text, 10),
    ('RPCDIAG.02_SIGNATURES'::text, 20),
    ('RPCDIAG.03_ARGUMENT_METADATA'::text, 30),
    ('RPCDIAG.04_RETURN_METADATA'::text, 40),
    ('RPCDIAG.05_RAW_FUNCTION_ACL'::text, 50),
    ('RPCDIAG.06_EFFECTIVE_EXECUTE'::text, 60),
    ('RPCDIAG.07_SERVICE_ROLE'::text, 70),
    ('RPCDIAG.08_RELATION_ACL_CONTROL'::text, 80),
    ('RPCDIAG.09_POSTCHECK_LOGIC'::text, 90)
),
live_functions AS MATERIALIZED (
  SELECT p.oid, n.nspname AS schema_name, p.proname AS function_name,
    p.pronargs, p.pronargdefaults, p.proargtypes,
    p.proallargtypes, p.proargmodes, p.proargnames,
    p.prorettype, p.proretset, p.proacl,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    pg_catalog.pg_get_function_arguments(p.oid) AS function_arguments,
    pg_catalog.pg_get_function_result(p.oid) AS function_result,
    p.oid::regprocedure::text AS exact_regprocedure,
    (
      SELECT pg_catalog.string_agg(
        pg_catalog.format_type(input_type_oid, NULL), ',' ORDER BY ordinal_position
      )
      FROM pg_catalog.unnest(p.proargtypes::oid[])
        WITH ORDINALITY AS input_arg(input_type_oid, ordinal_position)
    ) AS input_type_signature
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (SELECT function_name FROM expected)
),
argument_rows AS MATERIALIZED (
  SELECT f.oid, f.function_name, argument.ordinal_position,
    argument.argument_type_oid,
    pg_catalog.format_type(argument.argument_type_oid, NULL) AS formatted_type,
    CASE
      WHEN f.proargmodes IS NULL THEN 'i'
      ELSE f.proargmodes[argument.ordinal_position]::text
    END AS argument_mode,
    CASE
      WHEN f.proargnames IS NULL THEN NULL
      ELSE f.proargnames[argument.ordinal_position]
    END AS argument_name
  FROM live_functions f
  CROSS JOIN LATERAL pg_catalog.unnest(
    coalesce(f.proallargtypes, f.proargtypes::oid[])
  ) WITH ORDINALITY AS argument(argument_type_oid, ordinal_position)
),
signature_facts AS MATERIALIZED (
  SELECT e.function_name, e.input_type_signature AS expected_input_types,
    f.input_type_signature AS live_input_types,
    f.identity_arguments AS live_identity_arguments,
    f.function_arguments AS live_function_arguments,
    f.oid,
    f.input_type_signature = e.input_type_signature AS pure_type_signature_matches,
    f.identity_arguments = e.input_type_signature AS old_identity_string_comparison_matches,
    f.oid IS NOT NULL AS function_exists
  FROM expected e
  LEFT JOIN live_functions f ON f.function_name = e.function_name
),
return_facts AS MATERIALIZED (
  SELECT e.function_name, e.expected_return_type,
    f.function_result AS live_return_type, f.prorettype, f.proretset,
    f.function_result = e.expected_return_type AS return_type_matches,
    f.input_type_signature = e.input_type_signature AS joined_by_pure_types,
    f.identity_arguments = e.input_type_signature AS old_join_would_match
  FROM expected e
  LEFT JOIN live_functions f ON f.function_name = e.function_name
),
acl_rows AS MATERIALIZED (
  SELECT f.oid, f.function_name, f.exact_regprocedure,
    acl.grantee AS grantee_oid,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee_name,
    acl.privilege_type, acl.is_grantable
  FROM live_functions f
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(f.proacl, pg_catalog.acldefault('f',
      (SELECT p.proowner FROM pg_catalog.pg_proc p WHERE p.oid = f.oid)))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee_role ON grantee_role.oid = acl.grantee
),
execute_facts AS MATERIALIZED (
  SELECT e.function_name, f.oid, f.exact_regprocedure,
    coalesce(pg_catalog.has_function_privilege('service_role', f.oid, 'EXECUTE'), false)
      AS service_role_effective_execute,
    coalesce(pg_catalog.has_function_privilege('anon', f.oid, 'EXECUTE'), false)
      AS anon_effective_execute,
    coalesce(pg_catalog.has_function_privilege('authenticated', f.oid, 'EXECUTE'), false)
      AS authenticated_effective_execute,
    EXISTS (
      SELECT 1 FROM acl_rows a WHERE a.oid = f.oid
        AND a.grantee_oid = 0 AND a.privilege_type = 'EXECUTE'
    ) AS public_execute_in_acl,
    EXISTS (
      SELECT 1 FROM acl_rows a WHERE a.oid = f.oid
        AND a.grantee_name = 'service_role' AND a.privilege_type = 'EXECUTE'
        AND NOT a.is_grantable
    ) AS service_role_execute_in_acl,
    NOT EXISTS (
      SELECT 1 FROM acl_rows a WHERE a.oid = f.oid
        AND a.privilege_type = 'EXECUTE' AND a.is_grantable
    ) AS execute_grant_option_absent,
    NOT EXISTS (
      SELECT 1 FROM acl_rows a WHERE a.oid = f.oid
        AND a.privilege_type = 'EXECUTE'
        AND a.grantee_name NOT IN ('postgres','service_role')
    ) AS unexpected_execute_grantee_absent
  FROM expected e
  LEFT JOIN live_functions f ON f.function_name = e.function_name
),
service_role_state AS MATERIALIZED (
  SELECT count(*) = 1 AS role_exists,
    coalesce(bool_and(rolbypassrls), false) AS bypass_rls
  FROM pg_catalog.pg_roles WHERE rolname = 'service_role'
),
relation_acl AS MATERIALIZED (
  SELECT c.relname AS relation_name,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee_name,
    acl.privilege_type, acl.is_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) acl
  LEFT JOIN pg_catalog.pg_roles grantee_role ON grantee_role.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'support_tickets','support_ticket_messages',
      'support_ticket_events','support_ticket_number_seq'
    )
),
relation_acl_facts AS MATERIALIZED (
  SELECT
    (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
     FROM relation_acl WHERE relation_name='support_tickets' AND grantee_name='service_role')
      = ARRAY['INSERT','SELECT','UPDATE']::text[]
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_messages' AND grantee_name='service_role')
      = ARRAY['INSERT','SELECT']::text[]
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_events' AND grantee_name='service_role')
      = ARRAY['INSERT','SELECT']::text[]
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])
         FROM relation_acl WHERE relation_name='support_ticket_number_seq' AND grantee_name='service_role')
      = ARRAY['SELECT','USAGE']::text[]
    AND NOT EXISTS (SELECT 1 FROM relation_acl WHERE grantee_name='service_role' AND is_grantable)
      AS service_role_relation_acl_ok,
    NOT EXISTS (
      SELECT 1 FROM relation_acl WHERE grantee_name IN ('PUBLIC','anon','authenticated')
    ) AS browser_relation_acl_absent
),
contract_summary AS MATERIALIZED (
  SELECT
    (SELECT count(*) = 3 AND bool_and(function_exists AND pure_type_signature_matches)
     FROM signature_facts) AS live_rpc_signatures_actually_match,
    (SELECT count(*) = 3 AND bool_and(return_type_matches)
     FROM return_facts) AS live_rpc_returns_actually_match,
    coalesce((SELECT service_role_effective_execute FROM execute_facts
              WHERE function_name = 'create_support_ticket_atomic'), false)
      AS live_service_role_execute_create,
    coalesce((SELECT service_role_effective_execute FROM execute_facts
              WHERE function_name = 'append_support_ticket_reply_atomic'), false)
      AS live_service_role_execute_reply,
    coalesce((SELECT service_role_effective_execute FROM execute_facts
              WHERE function_name = 'mutate_support_ticket_admin_atomic'), false)
      AS live_service_role_execute_admin,
    (SELECT count(*) = 3 AND bool_and(
       service_role_effective_execute AND service_role_execute_in_acl
       AND NOT public_execute_in_acl AND NOT anon_effective_execute
       AND NOT authenticated_effective_execute AND execute_grant_option_absent
       AND unexpected_execute_grantee_absent
     ) FROM execute_facts) AS live_function_acl_contract_actually_ok,
    sr.role_exists, sr.bypass_rls,
    raf.service_role_relation_acl_ok, raf.browser_relation_acl_absent,
    (SELECT count(*) = 3 AND bool_and(old_identity_string_comparison_matches)
     FROM signature_facts) AS old_signature_comparison_would_pass,
    (SELECT count(*) = 3 AND bool_and(old_join_would_match)
     FROM return_facts) AS old_return_join_would_find_rows
  FROM service_role_state sr CROSS JOIN relation_acl_facts raf
),
final_summary AS MATERIALIZED (
  SELECT s.*,
    (s.role_exists AND s.bypass_rls
      AND s.live_function_acl_contract_actually_ok
      AND s.live_service_role_execute_create
      AND s.live_service_role_execute_reply
      AND s.live_service_role_execute_admin)
      AND s.service_role_relation_acl_ok
      AND s.browser_relation_acl_absent
      AS live_service_role_contract_actually_ok,
    (s.live_rpc_signatures_actually_match
      AND s.live_rpc_returns_actually_match
      AND s.live_function_acl_contract_actually_ok
      AND s.live_service_role_execute_create
      AND s.live_service_role_execute_reply
      AND s.live_service_role_execute_admin
      AND s.role_exists AND s.bypass_rls
      AND s.service_role_relation_acl_ok AND s.browser_relation_acl_absent
      AND NOT s.old_signature_comparison_would_pass
      AND NOT s.old_return_join_would_find_rows)
      AS postcheck_false_negative_detected
  FROM contract_summary s
),
actual_rows AS (
  SELECT 'RPCDIAG.01_SUMMARY'::text AS result_block, 10 AS result_order,
    1::bigint AS row_order, 'summary'::text AS row_type, to_jsonb(s) AS data
  FROM final_summary s

  UNION ALL

  SELECT 'RPCDIAG.02_SIGNATURES', 20,
    row_number() OVER (ORDER BY function_name)::bigint, 'signature',
    jsonb_build_object(
      'function_name', function_name, 'oid', oid,
      'expected_pure_type_signature', expected_input_types,
      'live_pure_type_signature', live_input_types,
      'live_identity_arguments', live_identity_arguments,
      'live_function_arguments', live_function_arguments,
      'pure_type_signature_matches', pure_type_signature_matches,
      'old_identity_string_comparison_matches', old_identity_string_comparison_matches
    )
  FROM signature_facts

  UNION ALL

  SELECT 'RPCDIAG.03_ARGUMENT_METADATA', 30,
    row_number() OVER (ORDER BY f.function_name, a.ordinal_position)::bigint,
    'argument',
    jsonb_build_object(
      'function_name', f.function_name, 'oid', f.oid,
      'pronargs', f.pronargs, 'pronargdefaults', f.pronargdefaults,
      'proargtypes', f.proargtypes::text,
      'proallargtypes', to_jsonb(f.proallargtypes),
      'proargmodes', to_jsonb(f.proargmodes),
      'proargnames', to_jsonb(f.proargnames),
      'ordinal_position', a.ordinal_position,
      'argument_name', a.argument_name,
      'argument_mode', a.argument_mode,
      'argument_type_oid', a.argument_type_oid,
      'formatted_type', a.formatted_type
    )
  FROM live_functions f JOIN argument_rows a ON a.oid = f.oid

  UNION ALL

  SELECT 'RPCDIAG.04_RETURN_METADATA', 40,
    row_number() OVER (ORDER BY r.function_name, coalesce(a.ordinal_position,0))::bigint,
    CASE WHEN a.argument_mode IN ('o','t','b') THEN 'return_field' ELSE 'return_contract' END,
    jsonb_build_object(
      'function_name', r.function_name,
      'expected_return_type', r.expected_return_type,
      'live_return_type', r.live_return_type,
      'prorettype', r.prorettype,
      'prorettype_formatted', pg_catalog.format_type(r.prorettype, NULL),
      'proretset', r.proretset,
      'return_type_matches', r.return_type_matches,
      'old_join_would_match', r.old_join_would_match,
      'field_position', a.ordinal_position,
      'field_name', a.argument_name,
      'field_mode', a.argument_mode,
      'field_type', a.formatted_type
    )
  FROM return_facts r
  LEFT JOIN live_functions f ON f.function_name = r.function_name
  LEFT JOIN argument_rows a ON a.oid = f.oid AND a.argument_mode IN ('o','t','b')

  UNION ALL

  SELECT 'RPCDIAG.05_RAW_FUNCTION_ACL', 50,
    row_number() OVER (ORDER BY function_name, grantee_oid, privilege_type)::bigint,
    'acl',
    jsonb_build_object(
      'function_name', function_name, 'oid', oid,
      'exact_regprocedure', exact_regprocedure,
      'grantee_oid', grantee_oid, 'grantee_name', grantee_name,
      'privilege_type', privilege_type, 'is_grantable', is_grantable
    )
  FROM acl_rows

  UNION ALL

  SELECT 'RPCDIAG.06_EFFECTIVE_EXECUTE', 60,
    row_number() OVER (ORDER BY function_name)::bigint, 'execute_contract',
    jsonb_build_object(
      'function_name', function_name, 'oid', oid,
      'exact_regprocedure', exact_regprocedure,
      'service_role_effective_execute', service_role_effective_execute,
      'service_role_execute_in_acl', service_role_execute_in_acl,
      'public_execute_in_acl', public_execute_in_acl,
      'anon_effective_execute', anon_effective_execute,
      'authenticated_effective_execute', authenticated_effective_execute,
      'execute_grant_option_absent', execute_grant_option_absent,
      'unexpected_execute_grantee_absent', unexpected_execute_grantee_absent
    )
  FROM execute_facts

  UNION ALL

  SELECT 'RPCDIAG.07_SERVICE_ROLE', 70, 1, 'role',
    jsonb_build_object(
      'role_exists', role_exists, 'bypass_rls', bypass_rls,
      'live_service_role_contract_actually_ok', live_service_role_contract_actually_ok
    )
  FROM final_summary

  UNION ALL

  SELECT 'RPCDIAG.08_RELATION_ACL_CONTROL', 80,
    row_number() OVER (ORDER BY relation_name, grantee_name, privilege_type)::bigint,
    'relation_acl',
    jsonb_build_object(
      'relation_name', relation_name, 'grantee_name', grantee_name,
      'privilege_type', privilege_type, 'is_grantable', is_grantable
    )
  FROM relation_acl
  WHERE grantee_name IN ('PUBLIC','anon','authenticated','service_role')

  UNION ALL

  SELECT 'RPCDIAG.09_POSTCHECK_LOGIC', 90, 1, 'diagnosis',
    jsonb_build_object(
      'old_expected_identity_argument_form', 'uuid, text, ...',
      'live_identity_argument_form', 'p_parameter_name uuid, p_other_parameter text, ...',
      'root_cause', 'pg_get_function_identity_arguments includes input parameter names for these functions',
      'signature_false_reason', 'named identity arguments were compared to bare type lists',
      'return_false_reason', 'return EXCEPT comparison also included the mismatching identity argument string',
      'acl_false_reason', 'ACL facts joined rpc_catalog through the same mismatching identity argument string, leaving the function oid null',
      'service_role_false_reason', 'service-role summary depended on the false ACL facts',
      'correct_comparison_source', 'proargtypes formatted with format_type in ordinal input order'
    )
),
final_rows AS (
  SELECT result_block, result_order, row_order, row_type, data FROM actual_rows
  UNION ALL
  SELECT b.result_block, b.result_order, 1::bigint, 'empty'::text,
    jsonb_build_object('empty', true, 'message', 'No matching rows found')
  FROM all_blocks b
  WHERE NOT EXISTS (
    SELECT 1 FROM actual_rows r WHERE r.result_block = b.result_block
  )
)
SELECT result_block, result_order, row_order, row_type, data
FROM final_rows
ORDER BY result_order, row_order;
