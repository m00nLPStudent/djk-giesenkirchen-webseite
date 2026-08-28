-- B15.23E5.3: sanitized READ-ONLY preflight for an auth.users email guard.
-- Manual execution only. Returns schema metadata and aggregate counts, never
-- user ids, email addresses, token values or other auth payloads.

BEGIN TRANSACTION READ ONLY;

-- 1. Managed relation, owner and RLS contract.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind,
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  current_user AS inspected_as
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
WHERE c.oid = pg_catalog.to_regclass('auth.users');

-- 2. Exact relevant column contract. Missing expected columns remain visible in
-- the final summary instead of being hidden by a hard cast or dynamic query.
WITH expected(column_name) AS (
  VALUES
    ('id'), ('email'), ('email_change'), ('email_change_token_new'),
    ('email_change_token_current'), ('email_change_sent_at'),
    ('email_change_confirm_status'), ('email_confirmed_at'), ('updated_at'),
    ('encrypted_password'), ('recovery_token'), ('recovery_sent_at'),
    ('confirmation_token'), ('confirmation_sent_at'),
    ('reauthentication_token'), ('reauthentication_sent_at'),
    ('raw_user_meta_data'), ('raw_app_meta_data'), ('phone')
)
SELECT
  e.column_name AS expected_column,
  a.attnum,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  a.attnotnull AS not_null,
  pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM expected AS e
LEFT JOIN pg_catalog.pg_attribute AS a
  ON a.attrelid = pg_catalog.to_regclass('auth.users')
 AND a.attname = e.column_name
 AND a.attnum > 0
 AND NOT a.attisdropped
LEFT JOIN pg_catalog.pg_attrdef AS d
  ON d.adrelid = a.attrelid AND d.adnum = a.attnum
ORDER BY e.column_name;

-- 3. Complete trigger inventory, including internal constraint triggers.
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_mode,
  t.tgisinternal AS is_internal,
  (t.tgtype & 2) <> 0 AS is_before,
  (t.tgtype & 4) <> 0 AS fires_on_insert,
  (t.tgtype & 8) <> 0 AS fires_on_delete,
  (t.tgtype & 16) <> 0 AS fires_on_update,
  t.tgfoid::pg_catalog.regprocedure::text AS function_signature,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
ORDER BY t.tgisinternal, t.tgname;

-- 4. Non-internal triggers separately so an existing project guard is obvious.
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_mode,
  t.tgfoid::pg_catalog.regprocedure::text AS function_signature,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 5. Trigger functions only. MATERIALIZED filtering guarantees that
-- pg_get_functiondef never receives an aggregate/window entry.
WITH trigger_functions AS MATERIALIZED (
  SELECT DISTINCT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
  WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
    AND p.prokind = 'f'
)
SELECT
  f.oid::pg_catalog.regprocedure::text AS function_signature,
  owner_role.rolname AS owner,
  f.prosecdef AS security_definer,
  f.proconfig,
  pg_catalog.pg_get_functiondef(f.oid) AS function_definition
FROM trigger_functions AS f
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = f.proowner
ORDER BY f.oid::pg_catalog.regprocedure::text;

WITH trigger_functions AS MATERIALIZED (
  SELECT DISTINCT p.oid
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
  WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
    AND p.prokind = 'f'
), inspected_roles(role_name) AS (
  VALUES ('postgres'), ('supabase_admin'), ('supabase_auth_admin'), ('service_role')
)
SELECT
  f.oid::pg_catalog.regprocedure::text AS function_signature,
  r.role_name,
  pg_catalog.has_function_privilege(r.role_name, f.oid, 'EXECUTE')
    AS effective_execute
FROM trigger_functions AS f
CROSS JOIN inspected_roles AS r
WHERE pg_catalog.to_regrole(r.role_name) IS NOT NULL
ORDER BY f.oid::pg_catalog.regprocedure::text, r.role_name;

-- 6. Direct grants on auth.users and effective privileges for relevant roles.
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY grantee, privilege_type;

SELECT
  role_name,
  privilege_name,
  pg_catalog.has_table_privilege(
    role_name, 'auth.users', privilege_name
  ) AS effective_privilege
FROM unnest(ARRAY[
  'postgres', 'supabase_admin', 'supabase_auth_admin',
  'service_role', 'authenticated', 'anon'
]) AS roles(role_name)
CROSS JOIN unnest(ARRAY[
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
]) AS privileges(privilege_name)
WHERE pg_catalog.to_regrole(role_name) IS NOT NULL
ORDER BY role_name, privilege_name;

-- 7. Schema usage/create and ownership context relevant to creating a trigger.
SELECT
  role_name,
  pg_catalog.has_schema_privilege(role_name, 'auth', 'USAGE') AS auth_usage,
  pg_catalog.has_schema_privilege(role_name, 'auth', 'CREATE') AS auth_create,
  pg_catalog.has_schema_privilege(role_name, 'public', 'USAGE') AS public_usage,
  pg_catalog.has_schema_privilege(role_name, 'public', 'CREATE') AS public_create
FROM unnest(ARRAY[
  'postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role'
]) AS roles(role_name)
WHERE pg_catalog.to_regrole(role_name) IS NOT NULL
ORDER BY role_name;

-- 8. Request-table owner, RLS and effective privileges. This determines whether
-- an invoker trigger can read the server-only workflow state.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
WHERE c.oid = pg_catalog.to_regclass('public.admin_email_change_requests');

SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'admin_email_change_requests'
ORDER BY grantee, privilege_type;

SELECT
  role_name,
  privilege_name,
  pg_catalog.has_table_privilege(
    role_name, 'public.admin_email_change_requests', privilege_name
  ) AS effective_privilege
FROM unnest(ARRAY[
  'postgres', 'supabase_admin', 'supabase_auth_admin',
  'service_role', 'authenticated', 'anon'
]) AS roles(role_name)
CROSS JOIN unnest(ARRAY[
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
]) AS privileges(privilege_name)
WHERE pg_catalog.to_regrole(role_name) IS NOT NULL
  AND pg_catalog.to_regclass('public.admin_email_change_requests') IS NOT NULL
ORDER BY role_name, privilege_name;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_email_change_requests'
ORDER BY policyname;

-- 9. Request columns, constraints and indexes needed by the forward/reverse
-- contract. Definitions contain no request data.
SELECT ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_email_change_requests'
ORDER BY ordinal_position;

SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  con.convalidated AS validated,
  pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
ORDER BY con.conname;

SELECT
  index_rel.relname AS index_name,
  idx.indisunique AS is_unique,
  idx.indisvalid AS is_valid,
  pg_catalog.pg_get_expr(idx.indpred, idx.indrelid) AS predicate,
  pg_catalog.pg_get_indexdef(idx.indexrelid) AS definition
FROM pg_catalog.pg_index AS idx
JOIN pg_catalog.pg_class AS index_rel ON index_rel.oid = idx.indexrelid
WHERE idx.indrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
ORDER BY index_rel.relname;

-- 10. Aggregate-only pending-state inventory. to_jsonb keeps this diagnostic
-- readable even if a later managed-schema version changes one expected column.
SELECT
  count(*) AS auth_user_count,
  count(*) FILTER (
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change', '') IS NOT NULL
  ) AS users_with_email_change,
  count(*) FILTER (
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_new', '') IS NOT NULL
  ) AS users_with_email_change_token_new,
  count(*) FILTER (
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_current', '') IS NOT NULL
  ) AS users_with_email_change_token_current,
  count(*) FILTER (
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change_sent_at', '') IS NOT NULL
  ) AS users_with_email_change_sent_at,
  count(*) FILTER (
    WHERE COALESCE(pg_catalog.to_jsonb(u)->>'email_change_confirm_status', '0') <> '0'
  ) AS users_with_nonzero_email_change_confirm_status,
  count(*) FILTER (
    WHERE
      (
        (NULLIF(pg_catalog.to_jsonb(u)->>'email_change', '') IS NOT NULL)::int
        + (NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_new', '') IS NOT NULL)::int
        + (NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_current', '') IS NOT NULL)::int
        + (NULLIF(pg_catalog.to_jsonb(u)->>'email_change_sent_at', '') IS NOT NULL)::int
        BETWEEN 1 AND 3
      )
      OR (
        NULLIF(pg_catalog.to_jsonb(u)->>'email_change', '') IS NULL
        AND NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_new', '') IS NULL
        AND NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_current', '') IS NULL
        AND NULLIF(pg_catalog.to_jsonb(u)->>'email_change_sent_at', '') IS NULL
        AND COALESCE(pg_catalog.to_jsonb(u)->>'email_change_confirm_status', '0') <> '0'
      )
  ) AS users_with_inconsistent_pending_presence
FROM auth.users AS u;

-- 11. Existing project-owned guard names/functions. No function body is emitted
-- here; an unexpected collision must be reviewed before any proposal exists.
SELECT
  n.nspname AS schema_name,
  p.oid::pg_catalog.regprocedure::text AS function_signature,
  owner_role.rolname AS owner,
  p.prosecdef AS security_definer,
  p.proconfig
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = p.proowner
WHERE p.prokind = 'f'
  AND (
    p.proname IN ('guard_auth_user_email_change', 'guard_admin_controlled_email_change')
    OR p.proname ILIKE '%auth%email%guard%'
    OR p.proname ILIKE '%email%change%guard%'
  )
ORDER BY n.nspname, p.oid::pg_catalog.regprocedure::text;

SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_mode,
  t.tgfoid::pg_catalog.regprocedure::text AS function_signature,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
  AND NOT t.tgisinternal
  AND (
    t.tgname IN ('guard_admin_controlled_email_change', 'guard_auth_user_email_change')
    OR t.tgname ILIKE '%email%guard%'
    OR t.tgname ILIKE '%email%change%'
  )
ORDER BY t.tgname;

-- 12. Dependencies involving auth.users, summarized by object identity only.
SELECT
  dep.deptype,
  dep.classid::pg_catalog.regclass::text AS dependent_catalog,
  dep.objid,
  dep.refclassid::pg_catalog.regclass::text AS referenced_catalog,
  dep.refobjid,
  count(*) AS dependency_entries
FROM pg_catalog.pg_depend AS dep
WHERE dep.objid = pg_catalog.to_regclass('auth.users')
   OR dep.refobjid = pg_catalog.to_regclass('auth.users')
GROUP BY dep.deptype, dep.classid, dep.objid, dep.refclassid, dep.refobjid
ORDER BY dependent_catalog, dep.objid, referenced_catalog, dep.refobjid, dep.deptype;

-- 13. Compact prerequisite summary for the manual review. This is diagnostic,
-- not authorization to run a later proposal.
SELECT
  pg_catalog.to_regclass('auth.users') IS NOT NULL AS auth_users_exists,
  pg_catalog.to_regclass('public.admin_email_change_requests') IS NOT NULL
    AS request_table_exists,
  (SELECT count(*) = 6
   FROM pg_catalog.pg_attribute AS a
   WHERE a.attrelid = pg_catalog.to_regclass('auth.users')
     AND a.attname IN (
       'email', 'email_change', 'email_change_token_new',
       'email_change_token_current', 'email_change_sent_at',
       'email_change_confirm_status'
     )
     AND a.attnum > 0 AND NOT a.attisdropped) AS email_columns_present,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_email_change_requests'
      AND column_name = 'compensation_started_at'
      AND data_type = 'timestamp with time zone'
      AND is_nullable = 'YES'
  ) AS compensation_column_present,
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS i
    JOIN pg_catalog.pg_class AS x ON x.oid = i.indexrelid
    WHERE i.indrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND x.relname = 'admin_email_change_requests_one_active_user_idx'
      AND i.indisunique AND i.indisvalid
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%pending%'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%confirming%'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%compensating%'
  ) AS active_request_index_present,
  NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
      AND NOT t.tgisinternal
  ) AS no_existing_noninternal_auth_users_trigger;

COMMIT;
