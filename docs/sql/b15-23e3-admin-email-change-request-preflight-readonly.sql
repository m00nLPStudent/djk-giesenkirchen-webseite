-- B15.23E3.1 read-only preflight. Do not modify data or schema.
-- Run manually and review every result before considering the separate proposal.
BEGIN TRANSACTION READ ONLY;

-- 1. Name conflicts and relevant relation/RLS state.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  obj_description(c.oid, 'pg_class') AS relation_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'auth')
  AND c.relname IN (
    'admin_email_change_requests',
    'admin_profiles',
    'admin_user_roles',
    'admin_roles',
    'notification_audit',
    'users'
  )
ORDER BY n.nspname, c.relname;

-- 2. Existing columns for a conflicting table and relevant FK targets.
SELECT
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE (table_schema = 'public' AND table_name IN (
    'admin_email_change_requests',
    'admin_profiles',
    'admin_user_roles',
    'admin_roles',
    'notification_audit'
  ))
  OR (table_schema = 'auth' AND table_name = 'users')
ORDER BY table_schema, table_name, ordinal_position;

-- 3. Constraints and FK/delete patterns. No row values are returned.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  con.conname AS constraint_name,
  con.contype,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'auth')
  AND c.relname IN (
    'admin_email_change_requests',
    'admin_profiles',
    'admin_user_roles',
    'notification_deliveries'
  )
ORDER BY n.nspname, c.relname, con.conname;

-- 4. Index and partial-uniqueness patterns.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_email_change_requests',
    'admin_profiles',
    'notification_deliveries'
  )
ORDER BY tablename, indexname;

-- 5. Existing policies around server-only operational tables.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_email_change_requests',
    'admin_profiles',
    'notification_deliveries',
    'notification_audit'
  )
ORDER BY tablename, policyname;

-- 6. Direct table and column grants for browser/service roles.
SELECT grantee, table_name, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'admin_email_change_requests',
    'admin_profiles',
    'notification_deliveries',
    'notification_audit'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'admin_email_change_requests',
    'admin_profiles',
    'notification_deliveries',
    'notification_audit'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

-- 7. Effective privileges, guarded when the proposed table does not exist.
SELECT
  role_name,
  privilege_name,
  CASE
    WHEN to_regclass('public.admin_email_change_requests') IS NULL THEN false
    ELSE has_table_privilege(
      role_name,
      'public.admin_email_change_requests',
      privilege_name
    )
  END AS effective_privilege
FROM (VALUES ('anon'::text), ('authenticated'), ('service_role')) roles(role_name)
CROSS JOIN (VALUES
  ('SELECT'::text), ('INSERT'), ('UPDATE'), ('DELETE'),
  ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
) privileges(privilege_name)
ORDER BY role_name, privilege_name;

-- 8. Shared updated_at helpers and their safe configuration.
WITH eligible_routines AS MATERIALIZED (
  SELECT p.*
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND p.proname ILIKE '%updated_at%'
)
SELECT
  p.oid::regprocedure::text AS signature,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS owner,
  p.proconfig,
  pg_get_functiondef(p.oid) AS definition
FROM eligible_routines p
ORDER BY p.oid::regprocedure::text;

-- 9. Existing updated_at and state/claim triggers.
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (
    trigger_name ILIKE '%updated_at%'
    OR trigger_name ILIKE '%claim%'
    OR event_object_table = 'admin_email_change_requests'
  )
ORDER BY event_object_table, trigger_name, event_manipulation;

-- 10. Audit shape and event-type capacity; no audit payload values are returned.
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_audit'
ORDER BY ordinal_position;

SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = to_regclass('public.notification_audit')
ORDER BY conname;

-- 11. Aggregated current identity consistency only; no UUIDs or addresses.
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (
    SELECT count(*)
    FROM auth.users u
    JOIN public.admin_profiles p ON p.id = u.id
  ) AS id_matches,
  (
    SELECT count(*)
    FROM auth.users u
    JOIN public.admin_profiles p ON p.id = u.id
    WHERE lower(btrim(coalesce(u.email, '')))
      IS DISTINCT FROM lower(btrim(coalesce(p.email, '')))
  ) AS normalized_email_mismatches;

-- 12. Catalog estimate only, so the preflight remains valid before table creation.
-- If the relation already exists, stop and inspect it separately before any proposal.
SELECT
  to_regclass('public.admin_email_change_requests') AS existing_relation,
  coalesce(c.reltuples::bigint, 0) AS estimated_existing_rows
FROM (VALUES (1)) guard(dummy)
LEFT JOIN pg_class c
  ON c.oid = to_regclass('public.admin_email_change_requests');

ROLLBACK;
