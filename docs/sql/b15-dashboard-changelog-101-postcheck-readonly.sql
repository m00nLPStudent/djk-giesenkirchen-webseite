-- Dashboard-Changelog 1.0.1: read-only live postcheck.
-- Execute manually only after the proposal. No data or schema is changed.

-- DC101C.01_COLUMN
SELECT
  'DC101C.01_COLUMN' AS section,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  c.is_identity,
  c.is_generated
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'admin_profiles'
  AND c.column_name = 'last_acknowledged_dashboard_changelog_version';

-- DC101C.02_CONSTRAINT
SELECT
  'DC101C.02_CONSTRAINT' AS section,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  con.convalidated,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
WHERE con.conrelid = to_regclass('public.admin_profiles')
  AND con.conname = 'admin_profiles_dashboard_changelog_version_check';

-- DC101C.03_AGGREGATED_PROFILE_STATE
-- Aggregate only: no names, email addresses, phone numbers or user IDs.
SELECT
  'DC101C.03_AGGREGATED_PROFILE_STATE' AS section,
  count(*)::bigint AS admin_profile_count,
  count(*) FILTER (
    WHERE last_acknowledged_dashboard_changelog_version IS NULL
  )::bigint AS initial_null_count,
  count(*) FILTER (
    WHERE last_acknowledged_dashboard_changelog_version IS NOT NULL
  )::bigint AS unexpected_non_null_count
FROM public.admin_profiles;

-- DC101C.04_RLS
SELECT
  'DC101C.04_RLS' AS section,
  c.relrowsecurity,
  c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'admin_profiles';

-- DC101C.05_POLICIES
SELECT
  'DC101C.05_POLICIES' AS section,
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

-- DC101C.06_FUNCTION
WITH eligible_proc AS MATERIALIZED (
  SELECT
    p.oid,
    p.prosecdef,
    p.proconfig,
    p.proowner
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND p.oid = to_regprocedure('public.acknowledge_own_dashboard_changelog(text)')
), defined_proc AS MATERIALIZED (
  SELECT p.*, pg_get_functiondef(p.oid) AS definition
  FROM eligible_proc p
)
SELECT
  'DC101C.06_FUNCTION' AS section,
  p.oid::regprocedure::text AS signature,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS security_definer,
  p.proconfig,
  pg_get_userbyid(p.proowner) AS owner,
  p.definition
FROM defined_proc p
ORDER BY p.oid::regprocedure::text;

-- DC101C.07_FUNCTION_ACL
-- PUBLIC is ACL grantee OID 0, not a PostgreSQL role name.
WITH target_proc AS MATERIALIZED (
  SELECT p.oid, p.proowner, p.proacl
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND p.oid = to_regprocedure('public.acknowledge_own_dashboard_changelog(text)')
), exploded_acl AS (
  SELECT
    p.oid,
    acl.grantee,
    acl.grantor,
    acl.privilege_type,
    acl.is_grantable
  FROM target_proc p
  CROSS JOIN LATERAL aclexplode(
    COALESCE(p.proacl, acldefault('f', p.proowner))
  ) acl
)
SELECT
  'DC101C.07_FUNCTION_ACL' AS section,
  p.oid::regprocedure::text AS signature,
  CASE
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(acl.grantee)
  END AS grantee,
  pg_get_userbyid(acl.grantor) AS grantor,
  acl.privilege_type,
  acl.is_grantable
FROM target_proc p
JOIN exploded_acl acl ON acl.oid = p.oid
ORDER BY grantee, acl.privilege_type;

-- DC101C.08_EFFECTIVE_EXECUTE
WITH roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)
), target_proc AS (
  SELECT to_regprocedure(
    'public.acknowledge_own_dashboard_changelog(text)'
  ) AS oid
)
SELECT
  'DC101C.08_EFFECTIVE_EXECUTE' AS section,
  r.role_name,
  has_function_privilege(r.role_name, p.oid, 'EXECUTE') AS effective_execute
FROM roles r
CROSS JOIN target_proc p
ORDER BY r.role_name;

-- DC101C.09_TABLE_GRANTS
SELECT
  'DC101C.09_TABLE_GRANTS' AS section,
  g.grantor,
  g.grantee,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_table_grants g
WHERE g.table_schema = 'public'
  AND g.table_name = 'admin_profiles'
ORDER BY g.grantee, g.privilege_type;

-- DC101C.10_COLUMN_GRANTS
SELECT
  'DC101C.10_COLUMN_GRANTS' AS section,
  g.grantor,
  g.grantee,
  g.column_name,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_column_grants g
WHERE g.table_schema = 'public'
  AND g.table_name = 'admin_profiles'
ORDER BY g.grantee, g.column_name, g.privilege_type;

-- DC101C.11_EFFECTIVE_PRIVILEGES
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
  'DC101C.11_EFFECTIVE_PRIVILEGES' AS section,
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

-- DC101C.12_CLOSURE
WITH column_state AS (
  SELECT
    count(*) = 1
      AND bool_and(data_type = 'text')
      AND bool_and(is_nullable = 'YES')
      AND bool_and(column_default IS NULL) AS ok
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'admin_profiles'
    AND column_name = 'last_acknowledged_dashboard_changelog_version'
), constraint_state AS (
  SELECT
    count(*) = 1
      AND bool_and(contype = 'c')
      AND bool_and(convalidated)
      AND bool_and(
        pg_get_constraintdef(oid, true)
          ~ 'last_acknowledged_dashboard_changelog_version IS NULL'
      )
      AND bool_and(
        pg_get_constraintdef(oid, true)
          ~ 'char_length[(]last_acknowledged_dashboard_changelog_version[)]'
      )
      AND bool_and(
        strpos(
          pg_get_constraintdef(oid, true),
          '^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$'
        ) > 0
      ) AS ok
  FROM pg_constraint
  WHERE conrelid = to_regclass('public.admin_profiles')
    AND conname = 'admin_profiles_dashboard_changelog_version_check'
), profile_state AS (
  SELECT
    count(*) = 2
      AND count(*) FILTER (
        WHERE last_acknowledged_dashboard_changelog_version IS NULL
      ) = 2 AS ok
  FROM public.admin_profiles
), rls_state AS (
  SELECT
    count(*) = 1
      AND bool_and(c.relrowsecurity)
      AND bool_and(NOT c.relforcerowsecurity) AS ok
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'admin_profiles'
), policy_state AS (
  SELECT
    count(*) = 4
      AND count(*) FILTER (
        WHERE policyname = 'admin_profiles_select_authenticated' AND cmd = 'SELECT'
      ) = 1
      AND count(*) FILTER (
        WHERE policyname = 'admin_profiles_insert_superadmin' AND cmd = 'INSERT'
      ) = 1
      AND count(*) FILTER (
        WHERE policyname = 'admin_profiles_update_superadmin' AND cmd = 'UPDATE'
      ) = 1
      AND count(*) FILTER (
        WHERE policyname = 'admin_profiles_delete_superadmin' AND cmd = 'DELETE'
      ) = 1 AS ok
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'admin_profiles'
), function_state AS (
  SELECT
    count(*) = 1
      AND bool_and(p.prosecdef)
      AND bool_and(p.proconfig = ARRAY['search_path=public, pg_temp']::text[])
      AND bool_and(pg_get_userbyid(p.proowner) = 'postgres')
      AND bool_and(pg_get_functiondef(p.oid) ~ 'auth[.]uid[(][)]')
      AND bool_and(
        pg_get_functiondef(p.oid)
          ~ 'last_acknowledged_dashboard_changelog_version'
      )
      AND bool_and(pg_get_functiondef(p.oid) ~ 'is_active = true') AS ok
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.oid = to_regprocedure('public.acknowledge_own_dashboard_changelog(text)')
), function_acl_state AS (
  SELECT
    count(*) FILTER (WHERE acl.privilege_type = 'EXECUTE') = 2
      AND count(*) FILTER (
        WHERE acl.privilege_type = 'EXECUTE'
          AND (
            acl.grantee = p.proowner
            OR pg_get_userbyid(acl.grantee) = 'authenticated'
          )
      ) = 2
      AND count(*) FILTER (
      WHERE acl.privilege_type = 'EXECUTE'
        AND acl.grantee = 0
    ) = 0
      AND count(*) FILTER (
        WHERE acl.privilege_type = 'EXECUTE'
          AND pg_get_userbyid(acl.grantee) = 'authenticated'
    ) = 1
      AND count(*) FILTER (
        WHERE acl.privilege_type = 'EXECUTE'
          AND pg_get_userbyid(acl.grantee) IN ('anon', 'service_role')
    ) = 0 AS ok
  FROM pg_proc p
  CROSS JOIN LATERAL aclexplode(
    COALESCE(p.proacl, acldefault('f', p.proowner))
  ) acl
  WHERE p.oid = to_regprocedure('public.acknowledge_own_dashboard_changelog(text)')
), execute_state AS (
  SELECT
    NOT has_function_privilege(
      'anon',
      target.oid,
      'EXECUTE'
    )
    AND has_function_privilege(
      'authenticated',
      target.oid,
      'EXECUTE'
    )
    AND NOT has_function_privilege(
      'service_role',
      target.oid,
      'EXECUTE'
    ) AS ok
  FROM (
    SELECT to_regprocedure(
      'public.acknowledge_own_dashboard_changelog(text)'
    ) AS oid
  ) target
)
SELECT
  'DC101C.12_CLOSURE' AS section,
  column_state.ok AS column_ok,
  constraint_state.ok AS constraint_ok,
  profile_state.ok AS initial_profile_state_ok,
  rls_state.ok AS rls_ok,
  policy_state.ok AS policies_unchanged,
  function_state.ok AS function_ok,
  function_acl_state.ok AS function_acl_ok,
  execute_state.ok AS execute_grants_ok,
  column_state.ok
    AND constraint_state.ok
    AND profile_state.ok
    AND rls_state.ok
    AND policy_state.ok
    AND function_state.ok
    AND function_acl_state.ok
    AND execute_state.ok AS postcheck_pass
FROM column_state
CROSS JOIN constraint_state
CROSS JOIN profile_state
CROSS JOIN rls_state
CROSS JOIN policy_state
CROSS JOIN function_state
CROSS JOIN function_acl_state
CROSS JOIN execute_state;
