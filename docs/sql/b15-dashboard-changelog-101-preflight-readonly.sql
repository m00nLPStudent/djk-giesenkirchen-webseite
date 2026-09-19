-- Dashboard-Changelog 1.0.1: read-only live preflight.
--
-- Execute this file manually in the Supabase SQL Editor before preparing any
-- proposal. Every statement is diagnostic SELECT only. No function discovered
-- by this preflight is executed.

-- DC101P.01_RELATION
SELECT
  'DC101P.01_RELATION' AS section,
  to_regclass('public.admin_profiles') IS NOT NULL AS admin_profiles_exists,
  c.oid::regclass::text AS relation,
  c.relkind,
  c.relrowsecurity,
  c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) AS owner
FROM (VALUES ('public'::text, 'admin_profiles'::text)) expected(schema_name, relation_name)
LEFT JOIN pg_namespace n ON n.nspname = expected.schema_name
LEFT JOIN pg_class c
  ON c.relnamespace = n.oid
 AND c.relname = expected.relation_name;

-- DC101P.02_COLUMNS
SELECT
  'DC101P.02_COLUMNS' AS section,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  c.is_identity,
  c.identity_generation,
  c.is_generated,
  c.generation_expression
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'admin_profiles'
ORDER BY c.ordinal_position;

-- DC101P.03_EXISTING_ACKNOWLEDGEMENT_STRUCTURES
-- Metadata only: no values from candidate columns are selected.
SELECT
  'DC101P.03_EXISTING_ACKNOWLEDGEMENT_STRUCTURES' AS section,
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    c.column_name ~* '(changelog|release|acknowledg|dashboard.*version|version.*dashboard)'
    OR c.table_name ~* '(changelog|release|acknowledg)'
  )
ORDER BY c.table_name, c.ordinal_position;

-- DC101P.04_CONSTRAINTS
SELECT
  'DC101P.04_CONSTRAINTS' AS section,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname = 'admin_profiles'
ORDER BY con.contype, con.conname;

-- DC101P.05_KEY_COLUMNS
SELECT
  'DC101P.05_KEY_COLUMNS' AS section,
  tc.constraint_name,
  tc.constraint_type,
  kcu.ordinal_position,
  kcu.column_name,
  ccu.table_schema AS referenced_table_schema,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_schema = tc.constraint_schema
 AND kcu.constraint_name = tc.constraint_name
 AND kcu.table_schema = tc.table_schema
 AND kcu.table_name = tc.table_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_schema = tc.constraint_schema
 AND ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'admin_profiles'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- DC101P.06_POLICIES
SELECT
  'DC101P.06_POLICIES' AS section,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual AS using_expression,
  p.with_check
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename = 'admin_profiles'
ORDER BY p.cmd, p.policyname;

-- DC101P.07_TABLE_GRANTS
SELECT
  'DC101P.07_TABLE_GRANTS' AS section,
  g.grantor,
  g.grantee,
  g.privilege_type,
  g.is_grantable,
  g.with_hierarchy
FROM information_schema.role_table_grants g
WHERE g.table_schema = 'public'
  AND g.table_name = 'admin_profiles'
ORDER BY g.grantee, g.privilege_type;

-- DC101P.08_COLUMN_GRANTS
SELECT
  'DC101P.08_COLUMN_GRANTS' AS section,
  g.grantor,
  g.grantee,
  g.column_name,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_column_grants g
WHERE g.table_schema = 'public'
  AND g.table_name = 'admin_profiles'
ORDER BY g.grantee, g.column_name, g.privilege_type;

-- DC101P.09_EFFECTIVE_TABLE_PRIVILEGES
WITH roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
), privileges(privilege_name) AS (
  VALUES
    ('SELECT'::text),
    ('INSERT'::text),
    ('UPDATE'::text),
    ('DELETE'::text),
    ('TRUNCATE'::text),
    ('REFERENCES'::text),
    ('TRIGGER'::text)
)
SELECT
  'DC101P.09_EFFECTIVE_TABLE_PRIVILEGES' AS section,
  r.role_name,
  p.privilege_name,
  has_table_privilege(
    r.role_name,
    'public.admin_profiles',
    p.privilege_name
  ) AS effective_privilege
FROM roles r
CROSS JOIN privileges p
ORDER BY r.role_name, p.privilege_name;

-- DC101P.09A_EFFECTIVE_COLUMN_PRIVILEGES
-- This also detects column-level browser writes when table-level UPDATE is
-- absent. Only column metadata and privilege booleans are returned.
WITH roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
), privileges(privilege_name) AS (
  VALUES ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text)
), profile_columns AS (
  SELECT c.column_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'admin_profiles'
)
SELECT
  'DC101P.09A_EFFECTIVE_COLUMN_PRIVILEGES' AS section,
  r.role_name,
  c.column_name,
  p.privilege_name,
  has_column_privilege(
    r.role_name,
    'public.admin_profiles',
    c.column_name,
    p.privilege_name
  ) AS effective_privilege
FROM roles r
CROSS JOIN profile_columns c
CROSS JOIN privileges p
ORDER BY r.role_name, c.column_name, p.privilege_name;

-- DC101P.10_PROFILE_RELATED_FUNCTIONS
-- MATERIALIZED prefiltering prevents pg_get_functiondef from ever receiving
-- aggregate, window or other unsupported pg_proc entries.
WITH eligible_proc AS MATERIALIZED (
  SELECT
    p.oid,
    p.proname,
    p.prokind,
    p.prosecdef,
    p.proconfig,
    p.proowner,
    p.proacl,
    n.nspname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), defined_proc AS MATERIALIZED (
  SELECT
    p.*,
    pg_get_functiondef(p.oid) AS definition
  FROM eligible_proc p
), relevant_proc AS MATERIALIZED (
  SELECT p.*
  FROM defined_proc p
  WHERE p.proname IN (
    'touch_own_admin_profile_last_login',
    'update_own_dashboard_profile'
  )
     OR p.definition ~* '(public[.])?admin_profiles'
)
SELECT
  'DC101P.10_PROFILE_RELATED_FUNCTIONS' AS section,
  p.oid::regprocedure::text AS signature,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS return_type,
  CASE p.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure' END AS routine_kind,
  p.prosecdef AS security_definer,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security_mode,
  p.proconfig,
  pg_get_userbyid(p.proowner) AS owner,
  p.definition
FROM relevant_proc p
ORDER BY p.oid::regprocedure::text;

-- DC101P.11_FUNCTION_ACL
-- In PostgreSQL, PUBLIC is ACL grantee OID 0; it is not treated as a role name.
WITH eligible_proc AS MATERIALIZED (
  SELECT p.oid, p.proname, p.proowner, p.proacl, n.nspname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), defined_proc AS MATERIALIZED (
  SELECT p.*, pg_get_functiondef(p.oid) AS definition
  FROM eligible_proc p
), relevant_proc AS MATERIALIZED (
  SELECT p.*
  FROM defined_proc p
  WHERE p.proname IN (
    'touch_own_admin_profile_last_login',
    'update_own_dashboard_profile'
  )
     OR p.definition ~* '(public[.])?admin_profiles'
), exploded_acl AS (
  SELECT
    p.oid,
    acl.grantee,
    acl.grantor,
    acl.privilege_type,
    acl.is_grantable
  FROM relevant_proc p
  CROSS JOIN LATERAL aclexplode(
    COALESCE(p.proacl, acldefault('f', p.proowner))
  ) acl
)
SELECT
  'DC101P.11_FUNCTION_ACL' AS section,
  p.oid::regprocedure::text AS signature,
  CASE
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(acl.grantee)
  END AS grantee,
  pg_get_userbyid(acl.grantor) AS grantor,
  acl.privilege_type,
  acl.is_grantable
FROM relevant_proc p
JOIN exploded_acl acl ON acl.oid = p.oid
ORDER BY p.oid::regprocedure::text, grantee, acl.privilege_type;

-- DC101P.12_EFFECTIVE_FUNCTION_EXECUTE
WITH eligible_proc AS MATERIALIZED (
  SELECT p.oid, p.proname, n.nspname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), defined_proc AS MATERIALIZED (
  SELECT p.*, pg_get_functiondef(p.oid) AS definition
  FROM eligible_proc p
), relevant_proc AS MATERIALIZED (
  SELECT p.*
  FROM defined_proc p
  WHERE p.proname IN (
    'touch_own_admin_profile_last_login',
    'update_own_dashboard_profile'
  )
     OR p.definition ~* '(public[.])?admin_profiles'
), roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
)
SELECT
  'DC101P.12_EFFECTIVE_FUNCTION_EXECUTE' AS section,
  p.oid::regprocedure::text AS signature,
  r.role_name,
  has_function_privilege(r.role_name, p.oid, 'EXECUTE') AS effective_execute
FROM relevant_proc p
CROSS JOIN roles r
ORDER BY p.oid::regprocedure::text, r.role_name;

-- DC101P.13_TRIGGER_INVENTORY
SELECT
  'DC101P.13_TRIGGER_INVENTORY' AS section,
  t.tgname AS trigger_name,
  t.tgenabled,
  t.tgisinternal,
  t.tgfoid::regprocedure::text AS function_signature,
  pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
JOIN pg_class rel ON rel.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname = 'admin_profiles'
ORDER BY t.tgisinternal, t.tgname;

-- DC101P.14_AGGREGATED_PROFILE_COUNT
-- Aggregate only: no names, email addresses, phone numbers or user IDs leave
-- the database.
SELECT
  'DC101P.14_AGGREGATED_PROFILE_COUNT' AS section,
  count(*)::bigint AS admin_profile_count
FROM public.admin_profiles;
