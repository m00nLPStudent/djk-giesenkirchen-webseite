-- B15.23E3.2 read-only postcheck. Run manually only after the proposal committed.
-- This script does not modify schema, grants, policies, or rows.
BEGIN TRANSACTION READ ONLY;

-- 1. Relation and RLS contract.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  obj_description(c.oid, 'pg_class') AS relation_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'admin_email_change_requests';

-- 2. Exact columns, types, nullability, and defaults.
SELECT
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_email_change_requests'
ORDER BY ordinal_position;

-- 3. PK, FK/delete behavior, UNIQUE, and CHECK constraints.
SELECT
  con.conname AS constraint_name,
  con.contype,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
WHERE con.conrelid = to_regclass('public.admin_email_change_requests')
ORDER BY con.conname;

-- 4. Indexes, including token uniqueness and one-active-request predicate.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'admin_email_change_requests'
ORDER BY indexname;

-- 5. No client policy is expected.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_email_change_requests'
ORDER BY policyname;

-- 6. Direct table and column grants. Expected: service_role table CRUD only.
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'admin_email_change_requests'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

SELECT grantee, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name = 'admin_email_change_requests'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, column_name, privilege_type;

-- 7. Effective login-role privileges. anon/authenticated must all be false.
-- PUBLIC is a pseudo-role rather than a login role and is checked above via grants.
SELECT
  role_name,
  privilege_name,
  has_table_privilege(
    role_name,
    'public.admin_email_change_requests',
    privilege_name
  ) AS effective_privilege
FROM (VALUES ('anon'::text), ('authenticated'), ('service_role')) roles(role_name)
CROSS JOIN (VALUES
  ('SELECT'::text), ('INSERT'), ('UPDATE'), ('DELETE'),
  ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
) privileges(privilege_name)
ORDER BY role_name, privilege_name;

-- 8. Expected shared updated_at trigger only.
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'admin_email_change_requests'
ORDER BY trigger_name, event_manipulation;

-- 9. A new table must initially contain no requests.
SELECT count(*) AS initial_row_count
FROM public.admin_email_change_requests;

ROLLBACK;
