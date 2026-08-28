-- B15.23E final sanitized READ-ONLY postcheck.
-- Manual execution only. Returns only schema metadata, booleans and counts;
-- never UUIDs, email addresses, tokens or request payloads.

BEGIN TRANSACTION READ ONLY;

-- 1. Managed auth relation and complete trigger boundary.
SELECT
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  count(t.oid) FILTER (WHERE t.tgisinternal) AS internal_trigger_count,
  count(t.oid) FILTER (WHERE NOT t.tgisinternal) AS noninternal_trigger_count,
  count(t.oid) FILTER (
    WHERE NOT t.tgisinternal
      AND t.tgname = 'guard_admin_controlled_email_change'
      AND t.tgenabled = 'O'
      AND (t.tgtype & 2) <> 0
      AND (t.tgtype & 16) <> 0
      AND (t.tgtype & 4) = 0
  ) AS active_guard_trigger_count
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
LEFT JOIN pg_catalog.pg_trigger AS t ON t.tgrelid = c.oid
WHERE c.oid = pg_catalog.to_regclass('auth.users')
GROUP BY owner_role.rolname, c.relrowsecurity, c.relforcerowsecurity;

SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_mode,
  t.tgisinternal AS is_internal,
  t.tgfoid::pg_catalog.regprocedure::text AS function_signature,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. Guard function ownership, definer/search_path and direct execution scope.
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
  NOT pg_catalog.has_function_privilege('anon', f.oid, 'EXECUTE')
    AS anon_execute_revoked,
  NOT pg_catalog.has_function_privilege('authenticated', f.oid, 'EXECUTE')
    AS authenticated_execute_revoked,
  NOT pg_catalog.has_function_privilege('service_role', f.oid, 'EXECUTE')
    AS service_role_execute_revoked
FROM guard_function AS f
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = f.proowner;

-- 3. Request table RLS/policies and effective server-only privileges.
SELECT
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  (SELECT count(*) FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'admin_email_change_requests')
    AS policy_count
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = c.relowner
WHERE c.oid = pg_catalog.to_regclass('public.admin_email_change_requests');

SELECT
  role_name,
  privilege_name,
  pg_catalog.has_table_privilege(
    role_name, 'public.admin_email_change_requests', privilege_name
  ) AS effective_privilege
FROM unnest(ARRAY['anon', 'authenticated', 'service_role', 'supabase_auth_admin'])
  AS roles(role_name)
CROSS JOIN unnest(ARRAY[
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
]) AS privileges(privilege_name)
ORDER BY role_name, privilege_name;

SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'admin_email_change_requests'
ORDER BY grantee, privilege_type;

-- 4. Compensation schema/index contract.
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_email_change_requests'
      AND column_name = 'compensation_started_at'
      AND data_type = 'timestamp with time zone'
      AND is_nullable = 'YES'
      AND column_default IS NULL
  ) AS compensation_column_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND c.conname = 'admin_email_change_requests_status_check'
      AND c.convalidated
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%pending%'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%confirming%'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%compensating%'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%completed%'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%cancelled%'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%expired%'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%failed%'
  ) AS status_constraint_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND c.conname = 'admin_email_change_requests_state_check'
      AND c.convalidated
      AND pg_catalog.pg_get_constraintdef(c.oid, true) ILIKE '%compensation_started_at%'
  ) AS state_constraint_ok,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_index AS i
    JOIN pg_catalog.pg_class AS x ON x.oid = i.indexrelid
    WHERE i.indrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND x.relname = 'admin_email_change_requests_one_active_user_idx'
      AND i.indisunique AND i.indisvalid
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%pending%'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%confirming%'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) ILIKE '%compensating%'
  ) AS active_unique_index_ok;

-- 5. Aggregate auth state and Auth/Profile consistency; no identity is emitted.
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
  count(*) FILTER (WHERE p.id IS NULL) AS auth_users_without_profile,
  count(*) FILTER (
    WHERE p.id IS NOT NULL
      AND pg_catalog.lower(pg_catalog.btrim(u.email))
        IS DISTINCT FROM pg_catalog.lower(pg_catalog.btrim(p.email))
  ) AS auth_profile_email_mismatches,
  (SELECT count(*)
   FROM public.admin_profiles AS profile
   LEFT JOIN auth.users AS auth_user ON auth_user.id = profile.id
   WHERE auth_user.id IS NULL) AS profiles_without_auth_user
FROM auth.users AS u
LEFT JOIN public.admin_profiles AS p ON p.id = u.id;

-- 6. Workflow data integrity and absence of active requests.
SELECT
  count(*) AS total_request_count,
  count(*) FILTER (
    WHERE status IN ('pending', 'confirming', 'compensating')
  ) AS active_request_count,
  count(*) FILTER (
    WHERE status NOT IN (
      'pending', 'confirming', 'compensating', 'completed',
      'cancelled', 'expired', 'failed'
    )
  ) AS unknown_status_count,
  count(*) FILTER (
    WHERE status = 'compensating'
      AND NOT (
        confirmed_at IS NOT NULL
        AND locked_at IS NOT NULL
        AND compensation_started_at IS NOT NULL
        AND cancelled_at IS NULL
        AND expired_at IS NULL
        AND failure_code IS NULL
      )
  ) AS invalid_compensating_count
FROM public.admin_email_change_requests;

-- 7. Compact final PASS matrix.
WITH guard_function AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles AS r ON r.oid = p.proowner
  WHERE n.nspname = 'public'
    AND p.proname = 'guard_admin_controlled_auth_email_change'
    AND p.prokind = 'f'
    AND p.prosecdef
    AND p.proconfig = ARRAY['search_path=pg_catalog']
    AND r.rolname = 'postgres'
)
SELECT
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
      AND t.tgname = 'guard_admin_controlled_email_change'
      AND NOT t.tgisinternal AND t.tgenabled = 'O'
      AND (t.tgtype & 2) <> 0 AND (t.tgtype & 16) <> 0
      AND (t.tgtype & 4) = 0
  ) AS guard_trigger_ok,
  (SELECT count(*) = 1 FROM guard_function) AS guard_function_ok,
  (SELECT c.relrowsecurity AND NOT c.relforcerowsecurity
   FROM pg_catalog.pg_class AS c
   WHERE c.oid = pg_catalog.to_regclass('public.admin_email_change_requests'))
    AS request_rls_ok,
  (SELECT count(*) = 0 FROM pg_catalog.pg_policies
   WHERE schemaname = 'public' AND tablename = 'admin_email_change_requests')
    AS no_request_policies,
  NOT pg_catalog.has_table_privilege(
    'supabase_auth_admin', 'public.admin_email_change_requests', 'SELECT'
  ) AS auth_admin_request_select_denied,
  pg_catalog.has_table_privilege(
    'service_role', 'public.admin_email_change_requests', 'SELECT'
  ) AND pg_catalog.has_table_privilege(
    'service_role', 'public.admin_email_change_requests', 'INSERT'
  ) AND pg_catalog.has_table_privilege(
    'service_role', 'public.admin_email_change_requests', 'UPDATE'
  ) AND pg_catalog.has_table_privilege(
    'service_role', 'public.admin_email_change_requests', 'DELETE'
  ) AS service_role_crud_ok,
  NOT EXISTS (
    SELECT 1 FROM auth.users AS u
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_new', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_current', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_sent_at', '') IS NOT NULL
       OR COALESCE(pg_catalog.to_jsonb(u)->>'email_change_confirm_status', '0') <> '0'
  ) AS no_native_pending_email_state,
  NOT EXISTS (
    SELECT 1 FROM public.admin_email_change_requests
    WHERE status IN ('pending', 'confirming', 'compensating')
  ) AS no_active_requests;

COMMIT;
