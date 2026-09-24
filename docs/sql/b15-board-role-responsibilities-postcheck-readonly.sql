-- B15 / Version 1.0.6 preparation
-- Board-role responsibilities postcheck. READ-ONLY ONLY.

-- BRRPC.01_RELATION_AND_RLS
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls_enabled,
  pg_get_userbyid(c.relowner) AS owner_name
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'board_role_responsibilities';

-- BRRPC.02_COLUMNS
SELECT column_name, ordinal_position, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'board_role_responsibilities'
ORDER BY ordinal_position;

-- BRRPC.03_CONSTRAINTS
SELECT con.conname AS constraint_name, con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition, con.convalidated AS is_validated
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
WHERE n.nspname = 'public' AND tbl.relname = 'board_role_responsibilities'
ORDER BY con.conname;

-- BRRPC.04_INDEXES
SELECT indexname AS index_name, indexdef AS index_definition
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities'
ORDER BY indexname;

-- BRRPC.05_POLICIES
SELECT policyname AS policy_name, permissive, roles, cmd,
  qual AS using_expression, with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities'
ORDER BY policyname;

-- BRRPC.06_TABLE_GRANTS
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'board_role_responsibilities'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- BRRPC.07_EFFECTIVE_PRIVILEGES
SELECT role_name,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'SELECT') AS can_select,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'INSERT') AS can_insert,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'UPDATE') AS can_update,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'DELETE') AS can_delete,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'TRUNCATE') AS can_truncate,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'REFERENCES') AS can_reference,
  has_table_privilege(role_name, 'public.board_role_responsibilities', 'TRIGGER') AS can_trigger
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) roles(role_name)
ORDER BY role_name;

-- BRRPC.08_PERMISSION_CONTRACT
SELECT p.key AS permission_key, p.name AS permission_name, p.category,
  count(DISTINCT arp.role_id) AS assigned_role_count
FROM public.admin_permissions p
LEFT JOIN public.admin_role_permissions arp ON arp.permission_id = p.id
WHERE p.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')
GROUP BY p.id, p.key, p.name, p.category
ORDER BY p.key;

-- BRRPC.09_SCOPE_AND_DATA_SUMMARY
-- Aggregate only; no responsibility texts or person data are returned.
SELECT organization_scope,
  count(*) AS configuration_count,
  count(*) FILTER (WHERE department_id IS NULL) AS without_department_count,
  count(*) FILTER (WHERE department_id IS NOT NULL) AS with_department_count
FROM public.board_role_responsibilities
GROUP BY organization_scope
ORDER BY organization_scope;

-- BRRPC.10_PUBLIC_POLICY_CONTRACT
SELECT
  policyname,
  cmd = 'SELECT' AS select_only,
  roles @> ARRAY['anon', 'authenticated']::name[] AS public_roles_present,
  qual ~* 'board_members' AS resolves_public_board_members,
  qual ~* 'is_active' AS active_only,
  qual ~* 'organization_scope' AS scope_correlated,
  qual ~* 'department_id' AS department_correlated,
  qual ~* 'role_id' AS role_correlated
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities';

-- BRRPC.11_BOARD_CORE_UNCHANGED
SELECT
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'board_members') AS board_members_column_count,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'board_roles') AS board_roles_column_count,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'departments') AS departments_column_count,
  (SELECT count(*) FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'board_members') AS board_members_policy_count,
  (SELECT count(*) FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'board_roles') AS board_roles_policy_count,
  (SELECT count(*) FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'departments') AS departments_policy_count;

-- BRRPC.12_FINAL_ASSERTIONS
WITH relation_state AS MATERIALIZED (
  SELECT c.relrowsecurity, c.relforcerowsecurity, pg_get_userbyid(c.relowner) AS owner_name
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'board_role_responsibilities' AND c.relkind = 'r'
), constraint_state AS MATERIALIZED (
  SELECT array_agg(con.conname ORDER BY con.conname) AS names
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
  WHERE n.nspname = 'public' AND tbl.relname = 'board_role_responsibilities'
), index_state AS MATERIALIZED (
  SELECT array_agg(indexname ORDER BY indexname) AS names
  FROM pg_catalog.pg_indexes
  WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities'
)
SELECT
  to_regclass('public.board_role_responsibilities') IS NOT NULL AS relation_exists,
  (SELECT relrowsecurity AND NOT relforcerowsecurity AND owner_name = 'postgres' FROM relation_state) AS rls_owner_ok,
  (SELECT count(*) = 6 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'board_role_responsibilities') AS columns_ok,
  (SELECT names @> ARRAY[
    'board_role_responsibilities_pkey',
    'board_role_responsibilities_scope_values_check',
    'board_role_responsibilities_scope_department_check',
    'board_role_responsibilities_values_check',
    'board_role_responsibilities_department_id_fkey',
    'board_role_responsibilities_role_id_fkey'
  ]::name[] FROM constraint_state) AS constraints_ok,
  (SELECT names @> ARRAY[
    'board_role_responsibilities_pkey',
    'board_role_responsibilities_club_role_uidx',
    'board_role_responsibilities_department_role_uidx'
  ]::name[] FROM index_state) AS indexes_ok,
  (SELECT count(*) = 1 FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities'
     AND policyname = 'board_role_responsibilities_public_read_active' AND cmd = 'SELECT') AS policies_ok,
  has_table_privilege('anon', 'public.board_role_responsibilities', 'SELECT')
    AND NOT has_table_privilege('anon', 'public.board_role_responsibilities', 'INSERT,UPDATE,DELETE') AS anon_ok,
  has_table_privilege('authenticated', 'public.board_role_responsibilities', 'SELECT')
    AND NOT has_table_privilege('authenticated', 'public.board_role_responsibilities', 'INSERT,UPDATE,DELETE') AS authenticated_ok,
  has_table_privilege('service_role', 'public.board_role_responsibilities', 'SELECT,INSERT,UPDATE,DELETE') AS service_role_ok,
  (SELECT count(*) = 4 FROM public.admin_permissions
   WHERE key IN ('board.view', 'board.create', 'board.edit', 'board.delete')) AS board_permissions_ok,
  (SELECT count(*) = 0 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name IN ('board_members', 'board_roles')
     AND column_name ~* '(responsib|zust.nd|aufgabe|task|duty)') AS core_columns_unchanged,
  (SELECT count(*) = 16 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'board_members')
    AND (SELECT count(*) = 8 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'board_roles')
    AND (SELECT count(*) = 7 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'departments') AS core_column_counts_ok;
