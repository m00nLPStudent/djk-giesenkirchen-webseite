-- B15.24H2 - Role contract database preflight (READ ONLY)
-- Execute manually in the Supabase SQL Editor. Each numbered statement returns
-- one independent result set. This file intentionally performs no mutations.

-- RESULTSET 01 - ROLE INVENTORY
SELECT
  '01_ROLE_INVENTORY' AS section,
  role_row.id AS role_id,
  role_row.key AS role_key,
  role_row.name AS display_name,
  role_row.is_active
FROM public.admin_roles AS role_row
WHERE role_row.key IN (
  'superadmin', 'vorstand', 'fussball-vorstand',
  'tischtennis-vorstand', 'kassierer', 'webmaster'
)
ORDER BY role_row.key;

-- RESULTSET 02 - BOARD PERMISSION INVENTORY
SELECT
  '02_BOARD_PERMISSION_INVENTORY' AS section,
  permission_row.id AS permission_id,
  permission_row.key AS permission_key,
  permission_row.name AS permission_name,
  permission_row.description,
  permission_row.category
FROM public.admin_permissions AS permission_row
WHERE permission_row.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')
ORDER BY permission_row.key;

-- RESULTSET 03 - BOARD ROLE-PERMISSION LIVE MATRIX
WITH target_roles(role_key, expected_view, expected_create, expected_edit, expected_delete) AS MATERIALIZED (
  VALUES
    ('superadmin', true, true, true, true),
    ('vorstand', true, true, true, true),
    ('fussball-vorstand', true, false, true, false),
    ('tischtennis-vorstand', true, false, true, false),
    ('kassierer', false, false, false, false),
    ('webmaster', false, false, false, false)
), live AS MATERIALIZED (
  SELECT role_row.key AS role_key, permission_row.key AS permission_key
  FROM public.admin_roles AS role_row
  JOIN public.admin_role_permissions AS link ON link.role_id = role_row.id
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE permission_row.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')
)
SELECT
  '03_BOARD_ROLE_PERMISSION_LIVE_MATRIX' AS section,
  target.role_key,
  EXISTS (SELECT 1 FROM public.admin_roles r WHERE r.key = target.role_key) AS role_exists,
  EXISTS (SELECT 1 FROM live WHERE live.role_key = target.role_key AND live.permission_key = 'board.view') AS board_view,
  EXISTS (SELECT 1 FROM live WHERE live.role_key = target.role_key AND live.permission_key = 'board.create') AS board_create,
  EXISTS (SELECT 1 FROM live WHERE live.role_key = target.role_key AND live.permission_key = 'board.edit') AS board_edit,
  EXISTS (SELECT 1 FROM live WHERE live.role_key = target.role_key AND live.permission_key = 'board.delete') AS board_delete,
  target.expected_view,
  target.expected_create,
  target.expected_edit,
  target.expected_delete
FROM target_roles AS target
ORDER BY target.role_key;

-- RESULTSET 04 - BOARD PERMISSION DIFFERENCES
WITH expected(role_key, permission_key, expected_value) AS MATERIALIZED (
  VALUES
    ('superadmin', 'board.view', true), ('superadmin', 'board.create', true), ('superadmin', 'board.edit', true), ('superadmin', 'board.delete', true),
    ('vorstand', 'board.view', true), ('vorstand', 'board.create', true), ('vorstand', 'board.edit', true), ('vorstand', 'board.delete', true),
    ('fussball-vorstand', 'board.view', true), ('fussball-vorstand', 'board.create', false), ('fussball-vorstand', 'board.edit', true), ('fussball-vorstand', 'board.delete', false),
    ('tischtennis-vorstand', 'board.view', true), ('tischtennis-vorstand', 'board.create', false), ('tischtennis-vorstand', 'board.edit', true), ('tischtennis-vorstand', 'board.delete', false),
    ('kassierer', 'board.view', false), ('kassierer', 'board.create', false), ('kassierer', 'board.edit', false), ('kassierer', 'board.delete', false),
    ('webmaster', 'board.view', false), ('webmaster', 'board.create', false), ('webmaster', 'board.edit', false), ('webmaster', 'board.delete', false)
), evaluated AS MATERIALIZED (
  SELECT expected.*,
    EXISTS (
      SELECT 1
      FROM public.admin_roles AS role_row
      JOIN public.admin_role_permissions AS link ON link.role_id = role_row.id
      JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
      WHERE role_row.key = expected.role_key AND permission_row.key = expected.permission_key
    ) AS live_value
  FROM expected
)
SELECT
  '04_BOARD_PERMISSION_DIFFERENCES' AS section,
  role_key,
  permission_key,
  live_value,
  expected_value,
  CASE
    WHEN live_value = expected_value THEN 'MATCH'
    WHEN expected_value THEN 'MISSING'
    ELSE 'EXCESS'
  END AS status
FROM evaluated
ORDER BY role_key, permission_key;

-- RESULTSET 05 - SETTINGS / HISTORICAL BOARD RELATIONS
WITH target_permissions(permission_key) AS MATERIALIZED (
  VALUES ('settings.view'), ('settings.edit'), ('board.view'), ('board.edit'), ('board.create'), ('board.delete')
)
SELECT
  '05_SETTINGS_HISTORICAL_BOARD_RELATIONS' AS section,
  role_row.id AS role_id,
  role_row.key AS role_key,
  target.permission_key,
  permission_row.id AS permission_id,
  permission_row.id IS NOT NULL AS permission_exists,
  link.role_id IS NOT NULL AS assigned
FROM public.admin_roles AS role_row
CROSS JOIN target_permissions AS target
LEFT JOIN public.admin_permissions AS permission_row ON permission_row.key = target.permission_key
LEFT JOIN public.admin_role_permissions AS link
  ON link.role_id = role_row.id AND link.permission_id = permission_row.id
ORDER BY role_row.key, target.permission_key;

-- RESULTSET 06 - ADMIN_ROLE_PERMISSIONS STRUCTURE AND INTEGRITY
WITH relation AS MATERIALIZED (
  SELECT class_row.oid
  FROM pg_catalog.pg_class AS class_row
  JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
  WHERE namespace_row.nspname = 'public' AND class_row.relname = 'admin_role_permissions'
), metadata AS MATERIALIZED (
  SELECT
    'COLUMN'::text AS object_type,
    column_row.ordinal_position AS sort_position,
    column_row.column_name AS object_name,
    format('%s%s; nullable=%s; default=%s', column_row.data_type,
      CASE WHEN column_row.udt_name = 'uuid' THEN '' ELSE format(' (%s)', column_row.udt_name) END,
      column_row.is_nullable, COALESCE(column_row.column_default, '<none>')) AS definition
  FROM information_schema.columns AS column_row
  WHERE column_row.table_schema = 'public' AND column_row.table_name = 'admin_role_permissions'
  UNION ALL
  SELECT 'CONSTRAINT', 1000,
    constraint_row.conname,
    pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
  FROM pg_catalog.pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = (SELECT oid FROM relation)
  UNION ALL
  SELECT 'INDEX', 2000, index_row.indexname, index_row.indexdef
  FROM pg_catalog.pg_indexes AS index_row
  WHERE index_row.schemaname = 'public' AND index_row.tablename = 'admin_role_permissions'
  UNION ALL
  SELECT 'DATA_CHECK', 3001, 'duplicate_role_permission_pairs', count(*)::text
  FROM (
    SELECT role_id, permission_id FROM public.admin_role_permissions
    GROUP BY role_id, permission_id HAVING count(*) > 1
  ) AS duplicates
  UNION ALL
  SELECT 'DATA_CHECK', 3002, 'orphan_role_references', count(*)::text
  FROM public.admin_role_permissions AS link
  LEFT JOIN public.admin_roles AS role_row ON role_row.id = link.role_id
  WHERE role_row.id IS NULL
  UNION ALL
  SELECT 'DATA_CHECK', 3003, 'orphan_permission_references', count(*)::text
  FROM public.admin_role_permissions AS link
  LEFT JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE permission_row.id IS NULL
)
SELECT '06_ADMIN_ROLE_PERMISSIONS_STRUCTURE' AS section, object_type, object_name, definition
FROM metadata
ORDER BY sort_position, object_type, object_name;

-- RESULTSET 07 - BOARD FUNCTION INVENTORY
WITH target_names(function_name) AS MATERIALIZED (
  VALUES
    ('current_admin_has_permission'),
    ('current_admin_has_non_table_tennis_permission'),
    ('current_admin_permission_allows_department'),
    ('current_admin_can_create_or_delete_board_member'),
    ('current_admin_can_edit_board_member')
), safe_functions AS MATERIALIZED (
  SELECT procedure_row.*
  FROM pg_catalog.pg_proc AS procedure_row
  JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = procedure_row.pronamespace
  WHERE namespace_row.nspname = 'public'
    AND procedure_row.prokind IN ('f', 'p')
    AND procedure_row.proname IN (SELECT function_name FROM target_names)
)
SELECT
  '07_BOARD_FUNCTION_INVENTORY' AS section,
  target.function_name AS expected_name,
  function_row.oid,
  CASE WHEN function_row.oid IS NULL THEN NULL ELSE 'public' END AS function_schema,
  function_row.proname AS actual_name,
  pg_catalog.pg_get_function_identity_arguments(function_row.oid) AS identity_arguments,
  pg_catalog.pg_get_function_result(function_row.oid) AS result_type,
  pg_catalog.pg_get_userbyid(function_row.proowner) AS owner,
  function_row.prosecdef AS security_definer,
  function_row.provolatile AS volatility,
  function_row.proparallel AS parallel_safety,
  function_row.proconfig,
  function_row.proacl,
  CASE WHEN function_row.oid IS NULL THEN NULL ELSE EXISTS (
    SELECT 1
    FROM pg_catalog.aclexplode(COALESCE(function_row.proacl, pg_catalog.acldefault('f', function_row.proowner))) AS acl
    WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
  ) END AS public_execute,
  CASE WHEN function_row.oid IS NULL THEN NULL ELSE has_function_privilege('anon', function_row.oid, 'EXECUTE') END AS anon_execute,
  CASE WHEN function_row.oid IS NULL THEN NULL ELSE has_function_privilege('authenticated', function_row.oid, 'EXECUTE') END AS authenticated_execute,
  CASE WHEN function_row.oid IS NULL THEN NULL ELSE has_function_privilege('service_role', function_row.oid, 'EXECUTE') END AS service_role_execute,
  pg_catalog.pg_get_functiondef(function_row.oid) AS function_definition
FROM target_names AS target
LEFT JOIN safe_functions AS function_row ON function_row.proname = target.function_name
ORDER BY target.function_name, identity_arguments;

-- RESULTSET 08 - BOARD POLICIES
SELECT
  '08_BOARD_POLICIES' AS section,
  policy_row.policyname AS policy_name,
  policy_row.cmd AS command,
  policy_row.permissive,
  policy_row.roles,
  policy_row.qual AS using_expression,
  policy_row.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS policy_row
WHERE policy_row.schemaname = 'public' AND policy_row.tablename = 'board_members'
ORDER BY policy_row.cmd, policy_row.policyname;

-- RESULTSET 09 - BOARD AND AUTHORIZATION RLS STATUS
SELECT
  '09_BOARD_RLS_STATUS' AS section,
  namespace_row.nspname AS table_schema,
  class_row.relname AS table_name,
  class_row.relrowsecurity AS rls_enabled,
  class_row.relforcerowsecurity AS force_rls,
  pg_catalog.pg_get_userbyid(class_row.relowner) AS owner,
  class_row.relacl AS table_acl
FROM pg_catalog.pg_class AS class_row
JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
WHERE namespace_row.nspname = 'public'
  AND class_row.relkind IN ('r', 'p')
  AND class_row.relname IN ('board_members', 'admin_roles', 'admin_permissions', 'admin_role_permissions', 'admin_profiles')
ORDER BY class_row.relname;

-- RESULTSET 10 - OWN-CARD DATA CONTRACT
WITH target_relation AS MATERIALIZED (
  SELECT class_row.oid
  FROM pg_catalog.pg_class AS class_row
  JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
  WHERE namespace_row.nspname = 'public' AND class_row.relname = 'board_members'
), target_attribute AS MATERIALIZED (
  SELECT attribute_row.attnum
  FROM pg_catalog.pg_attribute AS attribute_row
  WHERE attribute_row.attrelid = (SELECT oid FROM target_relation)
    AND attribute_row.attname = 'admin_profile_id' AND NOT attribute_row.attisdropped
), fk AS MATERIALIZED (
  SELECT constraint_row.conname,
    pg_catalog.pg_get_constraintdef(constraint_row.oid, true) AS definition,
    constraint_row.confdeltype, constraint_row.confupdtype
  FROM pg_catalog.pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = (SELECT oid FROM target_relation)
    AND constraint_row.contype = 'f'
    AND (SELECT attnum FROM target_attribute) = ANY(constraint_row.conkey)
), unique_contract AS MATERIALIZED (
  SELECT index_row.indexrelid::regclass::text AS index_name,
    pg_catalog.pg_get_indexdef(index_row.indexrelid) AS definition,
    index_row.indisunique
  FROM pg_catalog.pg_index AS index_row
  WHERE index_row.indrelid = (SELECT oid FROM target_relation)
    AND (SELECT attnum FROM target_attribute) = ANY(index_row.indkey)
)
SELECT
  '10_OWN_CARD_DATA_CONTRACT' AS section,
  count(*) AS board_members_total,
  count(*) FILTER (WHERE member.admin_profile_id IS NOT NULL) AS with_admin_profile_id,
  count(*) FILTER (WHERE member.admin_profile_id IS NULL) AS without_admin_profile_id,
  count(DISTINCT member.admin_profile_id) AS distinct_admin_profile_ids,
  (SELECT count(*) FROM (
    SELECT admin_profile_id FROM public.board_members WHERE admin_profile_id IS NOT NULL
    GROUP BY admin_profile_id HAVING count(*) > 1
  ) AS duplicate_groups) AS duplicate_admin_profile_ids,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('admin_profile_id', duplicate_row.admin_profile_id, 'count', duplicate_row.duplicate_count)
      ORDER BY duplicate_row.admin_profile_id)
    FROM (
      SELECT admin_profile_id, count(*) AS duplicate_count
      FROM public.board_members
      WHERE admin_profile_id IS NOT NULL
      GROUP BY admin_profile_id
      HAVING count(*) > 1
    ) AS duplicate_row), '[]'::jsonb) AS duplicate_details,
  count(*) FILTER (WHERE member.admin_profile_id IS NOT NULL AND profile.id IS NULL) AS invalid_profile_references,
  COALESCE((SELECT jsonb_agg(to_jsonb(fk) ORDER BY fk.conname) FROM fk), '[]'::jsonb) AS foreign_keys,
  EXISTS (SELECT 1 FROM unique_contract WHERE indisunique) AS unique_constraint_or_index_present,
  EXISTS (SELECT 1 FROM unique_contract) AS index_present,
  COALESCE((SELECT jsonb_agg(to_jsonb(unique_contract) ORDER BY index_name) FROM unique_contract), '[]'::jsonb) AS relevant_indexes
FROM public.board_members AS member
LEFT JOIN public.admin_profiles AS profile ON profile.id = member.admin_profile_id;

-- RESULTSET 11 - BOARD ORGANIZATION STATE
SELECT
  '11_BOARD_ORGANIZATION_STATE' AS section,
  count(*) AS total,
  count(*) FILTER (WHERE member.organization_scope = 'club') AS club_scope,
  count(*) FILTER (WHERE member.organization_scope = 'department') AS department_scope,
  count(*) FILTER (WHERE member.organization_scope = 'unassigned') AS unassigned_scope,
  count(*) FILTER (WHERE member.organization_scope IS NULL OR member.organization_scope NOT IN ('club', 'department', 'unassigned')) AS null_or_unexpected_scope,
  count(*) FILTER (WHERE member.department_id IS NOT NULL) AS with_department,
  count(DISTINCT member.department_id) FILTER (WHERE member.department_id IS NOT NULL) AS distinct_departments,
  count(*) FILTER (WHERE member.organization_scope = 'department' AND member.department_id IS NULL) AS department_scope_without_department,
  count(*) FILTER (WHERE member.organization_scope IN ('club', 'unassigned') AND member.department_id IS NOT NULL) AS non_department_scope_with_department,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'department_id', department_count.department_id,
      'department_slug', COALESCE(department.slug, '<missing>'),
      'member_count', department_count.member_count
    ) ORDER BY COALESCE(department.slug, '<missing>'), department_count.department_id)
    FROM (
      SELECT department_id, count(*) AS member_count
      FROM public.board_members
      WHERE department_id IS NOT NULL
      GROUP BY department_id
    ) AS department_count
    LEFT JOIN public.departments AS department ON department.id = department_count.department_id
  ), '[]'::jsonb) AS department_assignments
FROM public.board_members AS member;

-- RESULTSET 12 - BOARD COLUMN AND TABLE PRIVILEGES
WITH api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), target_columns(column_name) AS MATERIALIZED (
  VALUES ('admin_profile_id'), ('organization_scope'), ('department_id'), ('role_id'), ('is_active'), ('sort_order')
), privilege_names(privilege_name) AS MATERIALIZED (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE')
), column_checks AS MATERIALIZED (
  SELECT api.role_name, target.column_name, privilege.privilege_name,
    has_column_privilege(api.role_name, 'public.board_members', target.column_name, privilege.privilege_name) AS effective_privilege
  FROM api_roles AS api
  CROSS JOIN target_columns AS target
  CROSS JOIN privilege_names AS privilege
), table_checks AS MATERIALIZED (
  SELECT api.role_name, '<TABLE>'::text AS column_name, privilege.privilege_name,
    has_table_privilege(api.role_name, 'public.board_members', privilege.privilege_name) AS effective_privilege
  FROM api_roles AS api
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS privilege(privilege_name)
)
SELECT '12_BOARD_COLUMN_PRIVILEGES' AS section, role_name, column_name, privilege_name, effective_privilege
FROM (
  SELECT * FROM column_checks
  UNION ALL
  SELECT * FROM table_checks
) AS checks
ORDER BY role_name, column_name, privilege_name;

-- RESULTSET 13 - SYSTEM PERMISSION MATRIX
WITH target_permissions(permission_key) AS MATERIALIZED (
  VALUES ('users.view'), ('users.create'), ('users.edit'), ('users.delete'),
    ('roles.view'), ('roles.edit'), ('permissions.view'), ('permissions.edit'), ('system.view')
), target_roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('vorstand'), ('fussball-vorstand'), ('tischtennis-vorstand'), ('kassierer'), ('webmaster')
), included_roles AS MATERIALIZED (
  SELECT role_row.id, role_row.key
  FROM public.admin_roles AS role_row
  WHERE role_row.key IN (SELECT role_key FROM target_roles)
     OR EXISTS (
       SELECT 1 FROM public.admin_role_permissions AS link
       JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
       WHERE link.role_id = role_row.id AND permission_row.key IN (SELECT permission_key FROM target_permissions)
     )
), evaluated AS MATERIALIZED (
  SELECT role_row.id AS role_id, role_row.key AS role_key, target.permission_key,
    EXISTS (
      SELECT 1 FROM public.admin_role_permissions AS link
      JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
      WHERE link.role_id = role_row.id AND permission_row.key = target.permission_key
    ) AS live_value,
    role_row.key = 'superadmin' AS expected_value
  FROM included_roles AS role_row CROSS JOIN target_permissions AS target
)
SELECT
  '13_SYSTEM_PERMISSION_MATRIX' AS section,
  role_id, role_key, permission_key, live_value, expected_value,
  CASE WHEN live_value = expected_value THEN 'MATCH' WHEN expected_value THEN 'MISSING' ELSE 'EXCESS' END AS status
FROM evaluated
ORDER BY role_key, permission_key;

-- RESULTSET 14 - CONTRIBUTION PERMISSION MATRIX
WITH target_permissions(permission_key, is_mutation) AS MATERIALIZED (
  VALUES
    ('contributions.view', false), ('contributions.export', false),
    ('contributions.create', true), ('contributions.edit', true),
    ('contributions.record_payment', true), ('contributions.cancel_payment', true),
    ('contributions.defer', true), ('contributions.exempt', true), ('contributions.cancel', true)
), target_roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('vorstand'), ('fussball-vorstand'), ('tischtennis-vorstand'), ('kassierer'), ('webmaster')
), included_roles AS MATERIALIZED (
  SELECT role_row.id, role_row.key
  FROM public.admin_roles AS role_row
  WHERE role_row.key IN (SELECT role_key FROM target_roles)
     OR EXISTS (
       SELECT 1 FROM public.admin_role_permissions AS link
       JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
       JOIN target_permissions AS target ON target.permission_key = permission_row.key AND target.is_mutation
       WHERE link.role_id = role_row.id
     )
), evaluated AS MATERIALIZED (
  SELECT role_row.id AS role_id, role_row.key AS role_key, target.permission_key, target.is_mutation,
    EXISTS (
      SELECT 1 FROM public.admin_role_permissions AS link
      JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
      WHERE link.role_id = role_row.id AND permission_row.key = target.permission_key
    ) AS live_value,
    CASE
      WHEN role_row.key IN ('superadmin', 'kassierer') THEN true
      WHEN role_row.key = 'vorstand' AND target.permission_key IN ('contributions.view', 'contributions.export') THEN true
      ELSE false
    END AS expected_value
  FROM included_roles AS role_row CROSS JOIN target_permissions AS target
)
SELECT
  '14_CONTRIBUTION_PERMISSION_MATRIX' AS section,
  role_id, role_key, permission_key, is_mutation, live_value, expected_value,
  CASE WHEN live_value = expected_value THEN 'MATCH' WHEN expected_value THEN 'MISSING' ELSE 'EXCESS' END AS status
FROM evaluated
ORDER BY role_key, permission_key;

-- RESULTSET 15 - ROLE/PERMISSION ORPHAN AND DUPLICATE CHECK
SELECT
  '15_ROLE_PERMISSION_INTEGRITY' AS section,
  (SELECT count(*) FROM (
    SELECT role_id, permission_id FROM public.admin_role_permissions
    GROUP BY role_id, permission_id HAVING count(*) > 1
  ) AS duplicates) AS duplicate_role_permission_pairs,
  (SELECT count(*) FROM public.admin_role_permissions AS link
    LEFT JOIN public.admin_roles AS role_row ON role_row.id = link.role_id WHERE role_row.id IS NULL) AS orphan_role_permission_role_refs,
  (SELECT count(*) FROM public.admin_role_permissions AS link
    LEFT JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id WHERE permission_row.id IS NULL) AS orphan_role_permission_permission_refs,
  (SELECT count(*) FROM (
    SELECT key FROM public.admin_permissions GROUP BY key HAVING count(*) > 1
  ) AS duplicates) AS duplicate_permission_keys,
  (SELECT count(*) FROM (
    SELECT key FROM public.admin_roles GROUP BY key HAVING count(*) > 1
  ) AS duplicates) AS duplicate_role_keys;

-- RESULTSET 16 - BOARD FOREIGN KEYS / CONSTRAINTS
SELECT
  '16_BOARD_FOREIGN_KEYS_CONSTRAINTS' AS section,
  constraint_row.conname AS constraint_name,
  CASE constraint_row.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    WHEN 'x' THEN 'EXCLUSION'
    ELSE constraint_row.contype::text
  END AS constraint_type,
  pg_catalog.pg_get_constraintdef(constraint_row.oid, true) AS definition
FROM pg_catalog.pg_constraint AS constraint_row
JOIN pg_catalog.pg_class AS class_row ON class_row.oid = constraint_row.conrelid
JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
WHERE namespace_row.nspname = 'public' AND class_row.relname = 'board_members'
ORDER BY constraint_type, constraint_name;

-- RESULTSET 17 - FINAL BOOLEAN SUMMARY OF THE CURRENT LIVE STATE
WITH required_roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('vorstand'), ('fussball-vorstand'), ('tischtennis-vorstand'), ('kassierer'), ('webmaster')
), board_permissions(permission_key) AS MATERIALIZED (
  VALUES ('board.view'), ('board.create'), ('board.edit'), ('board.delete')
), expected_board(role_key, permission_key, expected_value) AS MATERIALIZED (
  VALUES
    ('superadmin', 'board.view', true), ('superadmin', 'board.create', true), ('superadmin', 'board.edit', true), ('superadmin', 'board.delete', true),
    ('vorstand', 'board.view', true), ('vorstand', 'board.create', true), ('vorstand', 'board.edit', true), ('vorstand', 'board.delete', true),
    ('fussball-vorstand', 'board.view', true), ('fussball-vorstand', 'board.create', false), ('fussball-vorstand', 'board.edit', true), ('fussball-vorstand', 'board.delete', false),
    ('tischtennis-vorstand', 'board.view', true), ('tischtennis-vorstand', 'board.create', false), ('tischtennis-vorstand', 'board.edit', true), ('tischtennis-vorstand', 'board.delete', false),
    ('kassierer', 'board.view', false), ('kassierer', 'board.create', false), ('kassierer', 'board.edit', false), ('kassierer', 'board.delete', false),
    ('webmaster', 'board.view', false), ('webmaster', 'board.create', false), ('webmaster', 'board.edit', false), ('webmaster', 'board.delete', false)
), board_evaluation AS MATERIALIZED (
  SELECT expected.*,
    EXISTS (
      SELECT 1 FROM public.admin_roles AS role_row
      JOIN public.admin_role_permissions AS link ON link.role_id = role_row.id
      JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
      WHERE role_row.key = expected.role_key AND permission_row.key = expected.permission_key
    ) AS live_value
  FROM expected_board AS expected
), system_keys(permission_key) AS MATERIALIZED (
  VALUES ('users.view'), ('users.create'), ('users.edit'), ('users.delete'), ('roles.view'), ('roles.edit'),
    ('permissions.view'), ('permissions.edit'), ('system.view')
), contribution_keys(permission_key) AS MATERIALIZED (
  VALUES ('contributions.view'), ('contributions.export'), ('contributions.create'), ('contributions.edit'),
    ('contributions.record_payment'), ('contributions.cancel_payment'), ('contributions.defer'),
    ('contributions.exempt'), ('contributions.cancel')
), contribution_evaluation AS MATERIALIZED (
  SELECT role_row.key AS role_key, target.permission_key,
    EXISTS (
      SELECT 1 FROM public.admin_role_permissions AS link
      JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
      WHERE link.role_id = role_row.id AND permission_row.key = target.permission_key
    ) AS live_value,
    CASE
      WHEN role_row.key IN ('superadmin', 'kassierer') THEN true
      WHEN role_row.key = 'vorstand' AND target.permission_key IN ('contributions.view', 'contributions.export') THEN true
      ELSE false
    END AS expected_value
  FROM public.admin_roles AS role_row CROSS JOIN contribution_keys AS target
  WHERE role_row.key IN (SELECT role_key FROM required_roles)
)
SELECT
  '17_FINAL_BOOLEAN_SUMMARY' AS section,
  (SELECT count(*) = 6 FROM public.admin_roles WHERE key IN (SELECT role_key FROM required_roles)) AS roles_found,
  (SELECT count(*) = 4 FROM public.admin_permissions WHERE key IN (SELECT permission_key FROM board_permissions)) AS board_permissions_found,
  (SELECT bool_and(live_value = expected_value) FROM board_evaluation) AS board_permission_matrix_complete,
  (SELECT count(*) = 5 FROM pg_catalog.pg_proc AS procedure_row
    JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = procedure_row.pronamespace
    WHERE namespace_row.nspname = 'public' AND procedure_row.prokind IN ('f', 'p')
      AND procedure_row.proname IN ('current_admin_has_permission', 'current_admin_has_non_table_tennis_permission',
        'current_admin_permission_allows_department', 'current_admin_can_create_or_delete_board_member',
        'current_admin_can_edit_board_member')) AS board_helpers_found,
  (SELECT class_row.relrowsecurity FROM pg_catalog.pg_class AS class_row
    JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
    WHERE namespace_row.nspname = 'public' AND class_row.relname = 'board_members') AS board_rls_enabled,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'board_members') AS board_policies_found,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint AS constraint_row
    JOIN pg_catalog.pg_class AS class_row ON class_row.oid = constraint_row.conrelid
    JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
    WHERE namespace_row.nspname = 'public' AND class_row.relname = 'board_members'
      AND constraint_row.contype = 'f'
      AND pg_catalog.pg_get_constraintdef(constraint_row.oid, true) ILIKE '%admin_profile_id%') AS own_card_fk_present,
  NOT EXISTS (SELECT 1 FROM public.board_members WHERE admin_profile_id IS NOT NULL
    GROUP BY admin_profile_id HAVING count(*) > 1) AS own_card_duplicates_zero,
  NOT EXISTS (SELECT 1 FROM public.board_members
    WHERE organization_scope IS NULL
       OR organization_scope NOT IN ('club', 'department', 'unassigned')
       OR (organization_scope = 'department' AND department_id IS NULL)
       OR (organization_scope IN ('club', 'unassigned') AND department_id IS NOT NULL)) AS board_scope_consistent,
  EXISTS (SELECT 1 FROM public.admin_roles AS role_row
    JOIN public.admin_role_permissions AS link ON link.role_id = role_row.id
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE role_row.key <> 'superadmin' AND permission_row.key IN (SELECT permission_key FROM system_keys)) AS system_non_superadmin_permissions_exist,
  (SELECT bool_and(live_value = expected_value) FROM contribution_evaluation) AS contribution_contract_matches,
  NOT EXISTS (SELECT 1 FROM public.admin_role_permissions GROUP BY role_id, permission_id HAVING count(*) > 1) AS role_permission_duplicates_zero,
  NOT EXISTS (SELECT 1 FROM public.admin_role_permissions AS link
    LEFT JOIN public.admin_roles AS role_row ON role_row.id = link.role_id
    LEFT JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE role_row.id IS NULL OR permission_row.id IS NULL) AS role_permission_orphans_zero;
