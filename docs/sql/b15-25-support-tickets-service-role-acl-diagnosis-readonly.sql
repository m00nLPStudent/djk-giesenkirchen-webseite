-- B15.25 Support Tickets V1 - service_role ACL diagnosis (READ-ONLY)
-- Execute once in the Supabase SQL Editor with "No limit" and export the
-- single result set as CSV. This statement does not modify roles or ACLs.

WITH RECURSIVE
target_relations(object_name, object_type) AS (
  VALUES
    ('support_tickets'::text, 'table'::text),
    ('support_ticket_messages'::text, 'table'::text),
    ('support_ticket_events'::text, 'table'::text),
    ('support_ticket_number_seq'::text, 'sequence'::text)
),
expected_relation_privileges(object_name, privilege_type) AS (
  VALUES
    ('support_tickets'::text, 'SELECT'::text),
    ('support_tickets'::text, 'INSERT'::text),
    ('support_tickets'::text, 'UPDATE'::text),
    ('support_ticket_messages'::text, 'SELECT'::text),
    ('support_ticket_messages'::text, 'INSERT'::text),
    ('support_ticket_events'::text, 'SELECT'::text),
    ('support_ticket_events'::text, 'INSERT'::text),
    ('support_ticket_number_seq'::text, 'USAGE'::text),
    ('support_ticket_number_seq'::text, 'SELECT'::text)
),
tested_relation_privileges(object_type, privilege_type) AS (
  VALUES
    ('table'::text, 'SELECT'::text),
    ('table'::text, 'INSERT'::text),
    ('table'::text, 'UPDATE'::text),
    ('table'::text, 'DELETE'::text),
    ('table'::text, 'TRUNCATE'::text),
    ('table'::text, 'REFERENCES'::text),
    ('table'::text, 'TRIGGER'::text),
    ('table'::text, 'MAINTAIN'::text),
    ('sequence'::text, 'USAGE'::text),
    ('sequence'::text, 'SELECT'::text),
    ('sequence'::text, 'UPDATE'::text)
),
relevant_grantees(role_name) AS (
  VALUES
    ('PUBLIC'::text),
    ('anon'::text),
    ('authenticated'::text),
    ('service_role'::text)
),
all_blocks(result_block, result_order) AS (
  VALUES
    ('STACL.01_PROPOSAL_CONTRACT'::text, 10),
    ('STACL.02_EXPLICIT_OBJECT_ACL'::text, 20),
    ('STACL.03_OWNERSHIP'::text, 30),
    ('STACL.04_SERVICE_ROLE_ATTRIBUTES'::text, 40),
    ('STACL.05_ROLE_MEMBERSHIPS'::text, 50),
    ('STACL.06_EFFECTIVE_PRIVILEGES'::text, 60),
    ('STACL.07_DEFAULT_ACL'::text, 70),
    ('STACL.08_PRIVILEGE_COMPARISON'::text, 80),
    ('STACL.09_SUMMARY'::text, 90)
),
relation_objects AS MATERIALIZED (
  SELECT relation_row.oid, relation_row.relname AS object_name,
    target.object_type, relation_row.relowner AS owner_oid,
    owner_role.rolname AS owner_name, relation_row.relacl,
    relation_row.relacl IS NULL AS raw_acl_is_null
  FROM target_relations target
  LEFT JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.nspname = 'public'
  LEFT JOIN pg_catalog.pg_class relation_row
    ON relation_row.relnamespace = namespace_row.oid
   AND relation_row.relname = target.object_name
  LEFT JOIN pg_catalog.pg_roles owner_role
    ON owner_role.oid = relation_row.relowner
),
function_object AS MATERIALIZED (
  SELECT procedure_row.oid, procedure_row.proname AS object_name,
    'function'::text AS object_type,
    procedure_row.proowner AS owner_oid, owner_role.rolname AS owner_name,
    procedure_row.proacl, procedure_row.proacl IS NULL AS raw_acl_is_null,
    pg_catalog.pg_get_function_identity_arguments(procedure_row.oid) AS identity_arguments
  FROM pg_catalog.pg_proc procedure_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = procedure_row.pronamespace
  JOIN pg_catalog.pg_roles owner_role
    ON owner_role.oid = procedure_row.proowner
  WHERE namespace_row.nspname = 'public'
    AND procedure_row.proname = 'touch_support_ticket_from_message'
    AND pg_catalog.pg_get_function_identity_arguments(procedure_row.oid) = ''
),
relation_explicit_acl AS MATERIALIZED (
  SELECT object_row.object_name, object_row.object_type,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee,
    grantor_role.rolname AS grantor,
    acl.privilege_type, acl.is_grantable
  FROM relation_objects object_row
  CROSS JOIN LATERAL pg_catalog.aclexplode(object_row.relacl) acl
  LEFT JOIN pg_catalog.pg_roles grantee_role ON grantee_role.oid = acl.grantee
  LEFT JOIN pg_catalog.pg_roles grantor_role ON grantor_role.oid = acl.grantor
),
function_explicit_acl AS MATERIALIZED (
  SELECT function_row.object_name, function_row.object_type,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee,
    grantor_role.rolname AS grantor,
    acl.privilege_type, acl.is_grantable
  FROM function_object function_row
  CROSS JOIN LATERAL pg_catalog.aclexplode(function_row.proacl) acl
  LEFT JOIN pg_catalog.pg_roles grantee_role ON grantee_role.oid = acl.grantee
  LEFT JOIN pg_catalog.pg_roles grantor_role ON grantor_role.oid = acl.grantor
),
all_explicit_acl AS MATERIALIZED (
  SELECT * FROM relation_explicit_acl
  UNION ALL
  SELECT * FROM function_explicit_acl
),
object_ownership AS MATERIALIZED (
  SELECT object_name, object_type, owner_oid, owner_name, raw_acl_is_null
  FROM relation_objects
  UNION ALL
  SELECT object_name, object_type, owner_oid, owner_name, raw_acl_is_null
  FROM function_object
),
service_role_attributes AS MATERIALIZED (
  SELECT role_row.oid, role_row.rolname, role_row.rolinherit,
    role_row.rolsuper, role_row.rolbypassrls, role_row.rolcanlogin
  FROM pg_catalog.pg_roles role_row
  WHERE role_row.rolname = 'service_role'
),
membership_tree(member_oid, inherited_role_oid, depth, membership_path) AS (
  SELECT membership.member, membership.roleid, 1,
    ARRAY[membership.member, membership.roleid]::oid[]
  FROM pg_catalog.pg_auth_members membership
  JOIN service_role_attributes service_role
    ON service_role.oid = membership.member

  UNION ALL

  SELECT tree.member_oid, membership.roleid, tree.depth + 1,
    tree.membership_path || membership.roleid
  FROM membership_tree tree
  JOIN pg_catalog.pg_auth_members membership
    ON membership.member = tree.inherited_role_oid
  WHERE NOT membership.roleid = ANY(tree.membership_path)
),
membership_inventory AS MATERIALIZED (
  SELECT tree.depth, member_role.rolname AS member_role,
    inherited_role.rolname AS inherited_role,
    inherited_role.rolinherit AS inherited_role_inherit,
    inherited_role.rolsuper AS inherited_role_superuser,
    inherited_role.rolbypassrls AS inherited_role_bypassrls,
    EXISTS (
      SELECT 1 FROM all_explicit_acl acl
      WHERE acl.grantee = inherited_role.rolname
    ) AS inherited_role_has_target_acl,
    EXISTS (
      SELECT 1 FROM object_ownership ownership
      WHERE ownership.owner_oid = inherited_role.oid
    ) AS inherited_role_owns_target_object
  FROM membership_tree tree
  JOIN pg_catalog.pg_roles member_role ON member_role.oid = tree.member_oid
  JOIN pg_catalog.pg_roles inherited_role ON inherited_role.oid = tree.inherited_role_oid
),
effective_relation_privileges AS MATERIALIZED (
  SELECT target.object_name, target.object_type, tested.privilege_type,
    CASE
      WHEN target.object_type = 'table'
       AND tested.privilege_type = 'MAINTAIN'
       AND current_setting('server_version_num')::integer < 170000
        THEN NULL::boolean
      WHEN target.object_type = 'table'
        THEN pg_catalog.has_table_privilege(
          'service_role', 'public.' || pg_catalog.quote_ident(target.object_name), tested.privilege_type
        )
      ELSE pg_catalog.has_sequence_privilege(
        'service_role', 'public.' || pg_catalog.quote_ident(target.object_name), tested.privilege_type
      )
    END AS has_effective_privilege,
    EXISTS (
      SELECT 1 FROM expected_relation_privileges expected
      WHERE expected.object_name = target.object_name
        AND expected.privilege_type = tested.privilege_type
    ) AS expected_by_proposal,
    current_setting('server_version_num')::integer >= 170000
      OR tested.privilege_type <> 'MAINTAIN' AS privilege_supported
  FROM target_relations target
  JOIN tested_relation_privileges tested
    ON tested.object_type = target.object_type
),
effective_function_privilege AS MATERIALIZED (
  SELECT function_row.object_name, 'function'::text AS object_type,
    'EXECUTE'::text AS privilege_type,
    pg_catalog.has_function_privilege('service_role', function_row.oid, 'EXECUTE') AS has_effective_privilege,
    true AS expected_by_proposal,
    true AS privilege_supported
  FROM function_object function_row
),
all_effective_privileges AS MATERIALIZED (
  SELECT * FROM effective_relation_privileges
  UNION ALL
  SELECT * FROM effective_function_privilege
),
default_acl_inventory AS MATERIALIZED (
  SELECT owner_role.rolname AS default_acl_owner,
    CASE
      WHEN default_acl.defaclnamespace = 0 THEN NULL
      ELSE namespace_row.nspname
    END AS schema_name,
    CASE default_acl.defaclobjtype
      WHEN 'r' THEN 'table'
      WHEN 'S' THEN 'sequence'
      WHEN 'f' THEN 'function'
      ELSE default_acl.defaclobjtype::text
    END AS object_type,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee,
    grantor_role.rolname AS grantor,
    acl.privilege_type, acl.is_grantable,
    EXISTS (
      SELECT 1 FROM object_ownership ownership
      WHERE ownership.owner_oid = default_acl.defaclrole
        AND ownership.object_type = CASE default_acl.defaclobjtype
          WHEN 'r' THEN 'table'
          WHEN 'S' THEN 'sequence'
          WHEN 'f' THEN 'function'
          ELSE default_acl.defaclobjtype::text
        END
    ) AS owner_and_object_type_match,
    default_acl.defaclnamespace = 0
      OR namespace_row.nspname = 'public' AS schema_applies
  FROM pg_catalog.pg_default_acl default_acl
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = default_acl.defaclrole
  LEFT JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = default_acl.defaclnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(default_acl.defaclacl) acl
  LEFT JOIN pg_catalog.pg_roles grantee_role ON grantee_role.oid = acl.grantee
  LEFT JOIN pg_catalog.pg_roles grantor_role ON grantor_role.oid = acl.grantor
  WHERE default_acl.defaclobjtype IN ('r', 'S', 'f')
    AND (
      acl.grantee = 0
      OR grantee_role.rolname IN (
        SELECT role_name FROM relevant_grantees WHERE role_name <> 'PUBLIC'
        UNION
        SELECT inherited_role FROM membership_inventory
      )
    )
    AND (default_acl.defaclnamespace = 0 OR namespace_row.nspname = 'public')
),
explicit_acl_comparison AS MATERIALIZED (
  SELECT target.object_name, target.object_type,
    coalesce(
      (SELECT pg_catalog.array_agg(DISTINCT acl.privilege_type ORDER BY acl.privilege_type)
       FROM all_explicit_acl acl
       WHERE acl.object_name = target.object_name AND acl.grantee = 'service_role'),
      ARRAY[]::text[]
    ) AS actual_service_role_privileges,
    CASE
      WHEN target.object_type = 'function' THEN ARRAY['EXECUTE']::text[]
      ELSE coalesce(
        (SELECT pg_catalog.array_agg(expected.privilege_type ORDER BY expected.privilege_type)
         FROM expected_relation_privileges expected
         WHERE expected.object_name = target.object_name),
        ARRAY[]::text[]
      )
    END AS expected_service_role_privileges
  FROM (
    SELECT object_name, object_type FROM target_relations
    UNION ALL
    SELECT object_name, object_type FROM function_object
  ) target
),
effective_excess AS MATERIALIZED (
  SELECT object_name, object_type, privilege_type
  FROM all_effective_privileges
  WHERE privilege_supported IS TRUE
    AND has_effective_privilege IS TRUE
    AND expected_by_proposal IS FALSE
),
explicit_excess AS MATERIALIZED (
  SELECT acl.object_name, acl.object_type, acl.privilege_type
  FROM all_explicit_acl acl
  WHERE acl.grantee = 'service_role'
    AND NOT EXISTS (
      SELECT 1 FROM expected_relation_privileges expected
      WHERE expected.object_name = acl.object_name
        AND expected.privilege_type = acl.privilege_type
    )
    AND NOT (acl.object_type = 'function' AND acl.privilege_type = 'EXECUTE')
),
summary AS MATERIALIZED (
  SELECT
    true AS proposal_contains_only_expected_service_role_grants,
    coalesce((SELECT actual_service_role_privileges = expected_service_role_privileges
      FROM explicit_acl_comparison WHERE object_name = 'support_tickets'), false)
      AS tickets_explicit_acl_matches_expected,
    coalesce((SELECT actual_service_role_privileges = expected_service_role_privileges
      FROM explicit_acl_comparison WHERE object_name = 'support_ticket_messages'), false)
      AS messages_explicit_acl_matches_expected,
    coalesce((SELECT actual_service_role_privileges = expected_service_role_privileges
      FROM explicit_acl_comparison WHERE object_name = 'support_ticket_events'), false)
      AS events_explicit_acl_matches_expected,
    coalesce((SELECT actual_service_role_privileges = expected_service_role_privileges
      FROM explicit_acl_comparison WHERE object_name = 'support_ticket_number_seq'), false)
      AS sequence_explicit_acl_matches_expected,
    coalesce((SELECT actual_service_role_privileges = expected_service_role_privileges
      FROM explicit_acl_comparison WHERE object_name = 'touch_support_ticket_from_message'), false)
      AS function_explicit_acl_matches_expected,
    EXISTS (SELECT 1 FROM object_ownership WHERE owner_name = 'service_role')
      AS service_role_is_object_owner,
    coalesce((SELECT rolsuper FROM service_role_attributes), false)
      AS service_role_is_superuser,
    coalesce((SELECT rolbypassrls FROM service_role_attributes), false)
      AS service_role_bypassrls,
    EXISTS (
      SELECT 1 FROM membership_inventory
      WHERE inherited_role_has_target_acl OR inherited_role_owns_target_object
    ) AS relevant_role_membership_exists,
    EXISTS (
      SELECT 1 FROM default_acl_inventory
      WHERE owner_and_object_type_match AND schema_applies
        AND grantee IN ('service_role')
    ) AS relevant_default_acl_exists,
    EXISTS (SELECT 1 FROM effective_excess WHERE object_name = 'support_tickets')
      AS tickets_effective_privileges_exceed_expected,
    EXISTS (SELECT 1 FROM effective_excess WHERE object_name = 'support_ticket_messages')
      AS messages_effective_privileges_exceed_expected,
    EXISTS (SELECT 1 FROM effective_excess WHERE object_name = 'support_ticket_events')
      AS events_effective_privileges_exceed_expected,
    EXISTS (SELECT 1 FROM effective_excess WHERE object_name = 'support_ticket_number_seq')
      AS sequence_effective_privileges_exceed_expected,
    EXISTS (SELECT 1 FROM explicit_excess)
      AS additional_privileges_explained_by_explicit_acl,
    EXISTS (
      SELECT 1 FROM effective_excess excess
      JOIN object_ownership ownership
        ON ownership.object_name = excess.object_name
       AND ownership.owner_name = 'service_role'
    ) AS additional_privileges_explained_by_ownership,
    EXISTS (
      SELECT 1
      FROM effective_excess excess
      JOIN all_explicit_acl acl
        ON acl.object_name = excess.object_name
       AND acl.privilege_type = excess.privilege_type
      JOIN membership_inventory membership
        ON membership.inherited_role = acl.grantee
      UNION ALL
      SELECT 1
      FROM effective_excess excess
      JOIN object_ownership ownership
        ON ownership.object_name = excess.object_name
      JOIN membership_inventory membership
        ON membership.inherited_role = ownership.owner_name
    )
      AS additional_privileges_explained_by_role_membership,
    EXISTS (
      SELECT 1 FROM default_acl_inventory default_acl
      JOIN explicit_excess excess
        ON excess.object_type = default_acl.object_type
       AND excess.privilege_type = default_acl.privilege_type
      WHERE default_acl.grantee = 'service_role'
        AND default_acl.owner_and_object_type_match
        AND default_acl.schema_applies
    ) AS additional_privileges_explained_by_default_acl,
    (
      NOT EXISTS (SELECT 1 FROM explicit_excess)
      AND EXISTS (SELECT 1 FROM effective_excess)
      AND (
        EXISTS (SELECT 1 FROM object_ownership WHERE owner_name = 'service_role')
        OR EXISTS (
          SELECT 1 FROM membership_inventory
          WHERE inherited_role_has_target_acl OR inherited_role_owns_target_object
        )
        OR coalesce((SELECT rolsuper FROM service_role_attributes), false)
      )
    ) AS postcheck_false_negative_likely
),
rows AS (
  SELECT 'STACL.01_PROPOSAL_CONTRACT'::text AS result_block, 10 AS result_order,
    row_number() OVER (ORDER BY object_name, privilege_type)::bigint AS row_order,
    'expected_explicit_grant'::text AS row_type,
    jsonb_build_object('object_name', object_name,
      'grantee', 'service_role', 'privilege_type', privilege_type) AS data
  FROM expected_relation_privileges
  UNION ALL
  SELECT 'STACL.01_PROPOSAL_CONTRACT', 10, 100::bigint,
    'expected_explicit_grant',
    jsonb_build_object('object_name', 'touch_support_ticket_from_message',
      'grantee', 'service_role', 'privilege_type', 'EXECUTE')

  UNION ALL
  SELECT 'STACL.02_EXPLICIT_OBJECT_ACL', 20,
    row_number() OVER (ORDER BY object_type, object_name, grantee, privilege_type)::bigint,
    'explicit_grant',
    jsonb_build_object('object_type', object_type, 'object_name', object_name,
      'grantee', grantee, 'grantor', grantor,
      'privilege_type', privilege_type, 'is_grantable', is_grantable)
  FROM all_explicit_acl
  WHERE grantee IN (SELECT role_name FROM relevant_grantees)
     OR grantee IN (SELECT inherited_role FROM membership_inventory)

  UNION ALL
  SELECT 'STACL.03_OWNERSHIP', 30,
    row_number() OVER (ORDER BY object_type, object_name)::bigint,
    'owner',
    jsonb_build_object('object_type', object_type, 'object_name', object_name,
      'owner', owner_name, 'service_role_is_owner', owner_name = 'service_role',
      'raw_acl_is_null', raw_acl_is_null)
  FROM object_ownership

  UNION ALL
  SELECT 'STACL.04_SERVICE_ROLE_ATTRIBUTES', 40, 1::bigint,
    'role_attributes',
    jsonb_build_object('role_name', rolname, 'inherit', rolinherit,
      'superuser', rolsuper, 'bypass_rls', rolbypassrls,
      'can_login', rolcanlogin)
  FROM service_role_attributes

  UNION ALL
  SELECT 'STACL.05_ROLE_MEMBERSHIPS', 50,
    row_number() OVER (ORDER BY depth, inherited_role)::bigint,
    'inherited_role',
    jsonb_build_object('member_role', member_role,
      'inherited_role', inherited_role, 'depth', depth,
      'inherited_role_inherit', inherited_role_inherit,
      'inherited_role_superuser', inherited_role_superuser,
      'inherited_role_bypassrls', inherited_role_bypassrls,
      'has_target_acl', inherited_role_has_target_acl,
      'owns_target_object', inherited_role_owns_target_object)
  FROM membership_inventory

  UNION ALL
  SELECT 'STACL.06_EFFECTIVE_PRIVILEGES', 60,
    row_number() OVER (ORDER BY object_type, object_name, privilege_type)::bigint,
    'effective_privilege',
    jsonb_build_object('object_type', object_type, 'object_name', object_name,
      'role_name', 'service_role', 'privilege_type', privilege_type,
      'privilege_supported', privilege_supported,
      'has_effective_privilege', has_effective_privilege,
      'expected_by_proposal', expected_by_proposal,
      'exceeds_expected', privilege_supported AND coalesce(has_effective_privilege, false) AND NOT expected_by_proposal)
  FROM all_effective_privileges

  UNION ALL
  SELECT 'STACL.07_DEFAULT_ACL', 70,
    row_number() OVER (ORDER BY default_acl_owner, schema_name NULLS FIRST,
      object_type, grantee, privilege_type)::bigint,
    'default_grant',
    jsonb_build_object('default_acl_owner', default_acl_owner,
      'schema_name', schema_name, 'object_type', object_type,
      'grantee', grantee, 'grantor', grantor,
      'privilege_type', privilege_type, 'is_grantable', is_grantable,
      'owner_and_object_type_match', owner_and_object_type_match,
      'schema_applies', schema_applies)
  FROM default_acl_inventory

  UNION ALL
  SELECT 'STACL.08_PRIVILEGE_COMPARISON', 80,
    row_number() OVER (ORDER BY object_type, object_name)::bigint,
    CASE WHEN actual_service_role_privileges = expected_service_role_privileges
      THEN 'explicit_acl_match' ELSE 'explicit_acl_mismatch' END,
    jsonb_build_object('object_type', object_type, 'object_name', object_name,
      'expected_service_role_privileges', expected_service_role_privileges,
      'actual_explicit_service_role_privileges', actual_service_role_privileges,
      'matches', actual_service_role_privileges = expected_service_role_privileges)
  FROM explicit_acl_comparison

  UNION ALL
  SELECT 'STACL.09_SUMMARY', 90, 1::bigint, 'summary', to_jsonb(summary)
  FROM summary
),
rows_with_markers AS (
  SELECT result_block, result_order, row_order, row_type, data FROM rows
  UNION ALL
  SELECT block.result_block, block.result_order, 1::bigint,
    'empty'::text,
    jsonb_build_object('checked', true, 'result', 'no_rows',
      'message', 'Pruefung ausgefuehrt, keine passenden Zeilen gefunden.')
  FROM all_blocks block
  WHERE NOT EXISTS (
    SELECT 1 FROM rows existing WHERE existing.result_block = block.result_block
  )
)
SELECT result_block, result_order, row_order, row_type, data
FROM rows_with_markers
ORDER BY result_order, row_order;
