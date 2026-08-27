-- B15.23B read-only security preflight. Execute manually in Supabase SQL Editor.
-- Structural and privilege metadata only; no person rows or personal values.

-- 1. RLS, FORCE RLS, owner and table kind.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  pg_get_userbyid(c.relowner) AS owner,
  c.relkind
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('coaches', 'board_members', 'club_contacts')
ORDER BY c.relname;

-- 2. Exact policies, including historical PUBLIC/app_metadata policies.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('coaches', 'board_members', 'club_contacts')
ORDER BY tablename, policyname;

-- 3. Explicit table grants, including grants inherited through PUBLIC.
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('coaches', 'board_members', 'club_contacts')
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 4. Effective table privileges for real database roles. PUBLIC grants are
-- inherited and therefore included in these effective results.
WITH roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
), privileges(privilege_name) AS (
  VALUES ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text),
         ('DELETE'::text), ('TRUNCATE'::text), ('REFERENCES'::text),
         ('TRIGGER'::text)
), target_tables(table_name) AS (
  VALUES ('coaches'::text), ('board_members'::text), ('club_contacts'::text)
)
SELECT
  target_tables.table_name,
  roles.role_name,
  privileges.privilege_name,
  has_table_privilege(
    roles.role_name,
    format('public.%I', target_tables.table_name),
    privileges.privilege_name
  ) AS has_effective_privilege
FROM target_tables
CROSS JOIN roles
CROSS JOIN privileges
ORDER BY target_tables.table_name, roles.role_name, privileges.privilege_name;

-- 5. Explicit column grants, including PUBLIC.
SELECT
  grantee,
  table_schema,
  table_name,
  column_name,
  privilege_type,
  is_grantable
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('coaches', 'board_members', 'club_contacts')
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

-- 6. Effective per-column SELECT/INSERT/UPDATE/REFERENCES privileges.
WITH roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
), privileges(privilege_name) AS (
  VALUES ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text), ('REFERENCES'::text)
), target_columns AS MATERIALIZED (
  SELECT table_name, column_name, ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('coaches', 'board_members', 'club_contacts')
)
SELECT
  target_columns.table_name,
  target_columns.column_name,
  roles.role_name,
  privileges.privilege_name,
  has_column_privilege(
    roles.role_name,
    format('public.%I', target_columns.table_name),
    target_columns.column_name,
    privileges.privilege_name
  ) AS has_effective_privilege
FROM target_columns
CROSS JOIN roles
CROSS JOIN privileges
ORDER BY target_columns.table_name, target_columns.ordinal_position,
         roles.role_name, privileges.privilege_name;

-- 7. Triggers and the function they invoke.
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('coaches', 'board_members', 'club_contacts')
ORDER BY event_object_table, trigger_name, event_manipulation;

-- 8. Normal functions/procedures whose definitions reference a target table
-- and appear capable of mutation. MATERIALIZED filtering excludes aggregates
-- and window functions before pg_get_functiondef is evaluated.
WITH callable_routines AS MATERIALIZED (
  SELECT
    p.oid,
    p.prokind,
    p.prosecdef,
    p.proconfig,
    p.proowner,
    n.nspname
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT
    r.*,
    pg_get_functiondef(r.oid) AS function_definition
  FROM callable_routines r
)
SELECT
  d.oid::regprocedure::text AS routine_signature,
  CASE d.prokind WHEN 'p' THEN 'procedure' ELSE 'function' END AS routine_kind,
  d.prosecdef AS security_definer,
  d.proconfig,
  pg_get_userbyid(d.proowner) AS owner,
  concat_ws(', ',
    CASE WHEN d.function_definition ~* '\mcoaches\M' THEN 'coaches' END,
    CASE WHEN d.function_definition ~* '\mboard_members\M' THEN 'board_members' END,
    CASE WHEN d.function_definition ~* '\mclub_contacts\M' THEN 'club_contacts' END
  ) AS referenced_target_tables,
  d.function_definition
FROM routine_definitions d
WHERE d.function_definition ~* '\m(coaches|board_members|club_contacts)\M'
  AND d.function_definition ~* '\m(insert|update|delete|truncate)\M'
ORDER BY d.oid::regprocedure::text;

-- 9. Effective EXECUTE for relevant normal functions/procedures. PUBLIC is
-- shown as an explicit ACL/default-ACL fact; effective checks cover API roles.
WITH callable_routines AS MATERIALIZED (
  SELECT p.oid, p.prokind
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT r.oid, r.prokind, pg_get_functiondef(r.oid) AS function_definition
  FROM callable_routines r
), relevant_routines AS MATERIALIZED (
  SELECT d.oid, d.prokind
  FROM routine_definitions d
  WHERE d.function_definition ~* '\m(coaches|board_members|club_contacts)\M'
    AND d.function_definition ~* '\m(insert|update|delete|truncate)\M'
), roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
)
SELECT
  rr.oid::regprocedure::text AS routine_signature,
  CASE rr.prokind WHEN 'p' THEN 'procedure' ELSE 'function' END AS routine_kind,
  roles.role_name,
  has_function_privilege(roles.role_name, rr.oid, 'EXECUTE') AS has_effective_execute,
  has_function_privilege('public', rr.oid, 'EXECUTE') AS public_execute_baseline
FROM relevant_routines rr
CROSS JOIN roles
ORDER BY rr.oid::regprocedure::text, roles.role_name;

-- 10. Raw routine ACLs make explicit PUBLIC grants/revokes auditable without
-- relying only on effective role checks.
WITH callable_routines AS MATERIALIZED (
  SELECT p.oid, p.proacl
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT r.oid, r.proacl, pg_get_functiondef(r.oid) AS function_definition
  FROM callable_routines r
)
SELECT
  d.oid::regprocedure::text AS routine_signature,
  d.proacl
FROM routine_definitions d
WHERE d.function_definition ~* '\m(coaches|board_members|club_contacts)\M'
  AND d.function_definition ~* '\m(insert|update|delete|truncate)\M'
ORDER BY d.oid::regprocedure::text;
