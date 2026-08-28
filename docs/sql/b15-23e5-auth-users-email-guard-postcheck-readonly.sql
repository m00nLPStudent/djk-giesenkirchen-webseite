-- B15.23E5.3.1: sanitized READ-ONLY postcheck for the auth.users email guard.

BEGIN TRANSACTION READ ONLY;

SELECT
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
WHERE c.oid = pg_catalog.to_regclass('auth.users');

SELECT
  count(*) FILTER (WHERE t.tgisinternal) AS internal_trigger_count,
  count(*) FILTER (WHERE NOT t.tgisinternal) AS noninternal_trigger_count,
  count(*) FILTER (
    WHERE NOT t.tgisinternal
      AND t.tgname = 'guard_admin_controlled_email_change'
  ) AS guard_trigger_count
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = pg_catalog.to_regclass('auth.users');

SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_mode,
  t.tgisinternal AS is_internal,
  (t.tgtype & 2) <> 0 AS is_before,
  (t.tgtype & 4) <> 0 AS fires_on_insert,
  (t.tgtype & 16) <> 0 AS fires_on_update,
  t.tgfoid::pg_catalog.regprocedure::text AS function_signature,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

WITH guard_function AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'guard_admin_controlled_auth_email_change'
    AND p.prokind = 'f'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid) = ''
)
SELECT
  f.oid::pg_catalog.regprocedure::text AS function_signature,
  owner_role.rolname AS owner,
  f.prosecdef AS security_definer,
  f.proconfig,
  NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p,
         LATERAL pg_catalog.aclexplode(
           COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
         ) AS acl
    WHERE p.oid = f.oid
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) AS public_execute_revoked,
  NOT pg_catalog.has_function_privilege('anon', f.oid, 'EXECUTE') AS anon_execute_revoked,
  NOT pg_catalog.has_function_privilege('authenticated', f.oid, 'EXECUTE')
    AS authenticated_execute_revoked,
  NOT pg_catalog.has_function_privilege('service_role', f.oid, 'EXECUTE')
    AS service_role_execute_revoked,
  pg_catalog.pg_get_functiondef(f.oid) AS function_definition
FROM guard_function AS f
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = f.proowner;

SELECT
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  (SELECT count(*) FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'admin_email_change_requests')
    AS policy_count,
  pg_catalog.has_table_privilege(
    'supabase_auth_admin', 'public.admin_email_change_requests', 'SELECT'
  ) AS auth_admin_effective_select,
  pg_catalog.has_table_privilege(
    'postgres', 'public.admin_email_change_requests', 'SELECT'
  ) AS guard_owner_effective_select
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
WHERE c.oid = pg_catalog.to_regclass('public.admin_email_change_requests');

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
  ) AS users_with_nonzero_email_change_confirm_status
FROM auth.users AS u;

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_email_change_requests'
      AND column_name = 'compensation_started_at'
      AND data_type = 'timestamp with time zone'
      AND is_nullable = 'YES'
  ) AS compensation_column_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND c.conname = 'admin_email_change_requests_status_check'
      AND c.convalidated
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%compensating%'
  ) AS compensation_status_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_index AS i
    JOIN pg_catalog.pg_class AS x ON x.oid = i.indexrelid
    WHERE i.indrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND x.relname = 'admin_email_change_requests_one_active_user_idx'
      AND i.indisunique AND i.indisvalid
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%pending%'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%confirming%'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%compensating%'
  ) AS active_index_ok;

SELECT
  (SELECT owner_role.rolname = 'supabase_auth_admin'
   FROM pg_catalog.pg_class AS c
   JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
   WHERE c.oid = pg_catalog.to_regclass('auth.users')) AS auth_owner_ok,
  (SELECT c.relrowsecurity AND NOT c.relforcerowsecurity
   FROM pg_catalog.pg_class AS c
   WHERE c.oid = pg_catalog.to_regclass('auth.users')) AS auth_rls_ok,
  (SELECT count(*) = 26
   FROM pg_catalog.pg_trigger AS t
   WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
     AND t.tgisinternal) AS internal_trigger_count_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
      AND t.tgname = 'guard_admin_controlled_email_change'
      AND NOT t.tgisinternal AND t.tgenabled = 'O'
      AND (t.tgtype & 2) <> 0
      AND (t.tgtype & 16) <> 0
      AND (t.tgtype & 4) = 0
  ) AS guard_trigger_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    JOIN pg_catalog.pg_roles AS r ON r.oid = p.proowner
    WHERE n.nspname = 'public'
      AND p.proname = 'guard_admin_controlled_auth_email_change'
      AND p.prokind = 'f' AND p.prosecdef
      AND p.proconfig = ARRAY['search_path=pg_catalog']
      AND r.rolname = 'postgres'
  ) AS guard_function_ok,
  NOT pg_catalog.has_table_privilege(
    'supabase_auth_admin', 'public.admin_email_change_requests', 'SELECT'
  ) AS request_boundary_ok,
  NOT EXISTS (
    SELECT 1 FROM auth.users AS u
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_new', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_current', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_sent_at', '') IS NOT NULL
       OR COALESCE(pg_catalog.to_jsonb(u)->>'email_change_confirm_status', '0') <> '0'
  ) AS no_native_pending_state;

COMMIT;
