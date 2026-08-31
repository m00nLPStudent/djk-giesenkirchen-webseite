-- B15.24H1 - read-only postcheck for the security correction
-- This file contains SELECT statements only and does not modify schema or data.

-- H1C.01_LEGACY_PUBLIC_POLICIES_REMOVED
WITH legacy(table_name, policy_name) AS (
  VALUES
    ('coach_team_seasons',  'Allow read coach team seasons'),
    ('player_team_seasons', 'Allow read player team seasons'),
    ('seasons',              'Allow read seasons'),
    ('team_seasons',         'Allow read team seasons'),
    ('teams',                'Public can read teams')
)
SELECT 'H1C.01_LEGACY_PUBLIC_POLICIES_REMOVED' AS section,
       legacy.table_name,
       legacy.policy_name,
       NOT EXISTS (
         SELECT 1
         FROM pg_catalog.pg_policies policy_row
         WHERE policy_row.schemaname = 'public'
           AND policy_row.tablename = legacy.table_name
           AND policy_row.policyname = legacy.policy_name
       ) AS removed
FROM legacy
ORDER BY legacy.table_name;

-- H1C.02_SAFE_PUBLIC_READ_POLICIES
WITH expected(table_name, policy_name) AS (
  VALUES
    ('coach_team_seasons',  'h1_coach_team_seasons_public_read_active'),
    ('player_team_seasons', 'h1_player_team_seasons_public_read_active'),
    ('seasons',              'h1_seasons_public_read_active'),
    ('team_seasons',         'h1_team_seasons_public_read_active'),
    ('teams',                'h1_teams_public_read_active')
)
SELECT 'H1C.02_SAFE_PUBLIC_READ_POLICIES' AS section,
       expected.table_name,
       expected.policy_name,
       policy_row.cmd,
       policy_row.roles,
       policy_row.qual AS using_expression,
       policy_row.policyname IS NOT NULL
         AND policy_row.cmd = 'SELECT'
         AND 'anon' = ANY(policy_row.roles)
         AND 'authenticated' = ANY(policy_row.roles)
         AND policy_row.qual IS NOT NULL
         AND lower(regexp_replace(policy_row.qual, '[[:space:]()]', '', 'g')) <> 'true'
         AND lower(policy_row.qual) NOT LIKE '%coalesce%'
         AND lower(policy_row.qual) LIKE '%is_active%true%'
         AS safe_public_read_contract
FROM expected
LEFT JOIN pg_catalog.pg_policies policy_row
  ON policy_row.schemaname = 'public'
 AND policy_row.tablename = expected.table_name
 AND policy_row.policyname = expected.policy_name
ORDER BY expected.table_name;

-- H1C.02A_NO_UNRESTRICTED_PUBLIC_READ_POLICIES
SELECT 'H1C.02A_NO_UNRESTRICTED_PUBLIC_READ_POLICIES' AS section,
       count(*) AS unsafe_policy_count,
       count(*) = 0 AS pass
FROM pg_catalog.pg_policies policy_row
WHERE policy_row.schemaname = 'public'
  AND policy_row.tablename IN (
    'coach_team_seasons', 'player_team_seasons', 'seasons',
    'team_seasons', 'teams'
  )
  AND policy_row.cmd = 'SELECT'
  AND ('public' = ANY(policy_row.roles) OR 'anon' = ANY(policy_row.roles))
  AND lower(regexp_replace(COALESCE(policy_row.qual, ''), '[[:space:]()]', '', 'g')) = 'true';

-- Materializing the exact helper set prevents unrelated pg_proc entries from
-- being evaluated and keeps PUBLIC inspection ACL-based (PUBLIC is not a role).
-- H1C.03_NO_PUBLIC_HELPER_EXECUTE
WITH helpers AS MATERIALIZED (
  SELECT p.oid, p.oid::regprocedure::text AS exact_signature,
         p.proacl, p.proowner
  FROM pg_catalog.pg_proc p
  WHERE p.oid IN (
    'public.current_admin_has_permission(text)'::regprocedure,
    'public.current_admin_has_non_table_tennis_permission(text)'::regprocedure,
    'public.current_admin_permission_allows_department(text,uuid)'::regprocedure,
    'public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure,
    'public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure
  )
)
SELECT 'H1C.03_NO_PUBLIC_HELPER_EXECUTE' AS section,
       helper.exact_signature,
       NOT EXISTS (
         SELECT 1
         FROM pg_catalog.aclexplode(
           COALESCE(helper.proacl, pg_catalog.acldefault('f', helper.proowner))
         ) function_acl
         WHERE function_acl.grantee = 0
           AND function_acl.privilege_type = 'EXECUTE'
       ) AS public_execute_denied
FROM helpers helper
ORDER BY helper.exact_signature;

-- H1C.04_NO_ANON_HELPER_EXECUTE
WITH helpers AS MATERIALIZED (
  SELECT p.oid, p.oid::regprocedure::text AS exact_signature
  FROM pg_catalog.pg_proc p
  WHERE p.oid IN (
    'public.current_admin_has_permission(text)'::regprocedure,
    'public.current_admin_has_non_table_tennis_permission(text)'::regprocedure,
    'public.current_admin_permission_allows_department(text,uuid)'::regprocedure,
    'public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure,
    'public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure
  )
)
SELECT 'H1C.04_NO_ANON_HELPER_EXECUTE' AS section,
       helper.exact_signature,
       NOT has_function_privilege('anon', helper.oid, 'EXECUTE') AS anon_execute_denied
FROM helpers helper
ORDER BY helper.exact_signature;

-- H1C.05_AUTHENTICATED_HELPER_EXECUTE
WITH helpers AS MATERIALIZED (
  SELECT p.oid, p.oid::regprocedure::text AS exact_signature
  FROM pg_catalog.pg_proc p
  WHERE p.oid IN (
    'public.current_admin_has_permission(text)'::regprocedure,
    'public.current_admin_has_non_table_tennis_permission(text)'::regprocedure,
    'public.current_admin_permission_allows_department(text,uuid)'::regprocedure,
    'public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure,
    'public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure
  )
)
SELECT 'H1C.05_AUTHENTICATED_HELPER_EXECUTE' AS section,
       helper.exact_signature,
       has_function_privilege('authenticated', helper.oid, 'EXECUTE') AS authenticated_execute
FROM helpers helper
ORDER BY helper.exact_signature;

-- H1C.06_SERVICE_ROLE_HELPER_EXECUTE
WITH helpers AS MATERIALIZED (
  SELECT p.oid, p.oid::regprocedure::text AS exact_signature
  FROM pg_catalog.pg_proc p
  WHERE p.oid IN (
    'public.current_admin_has_permission(text)'::regprocedure,
    'public.current_admin_has_non_table_tennis_permission(text)'::regprocedure,
    'public.current_admin_permission_allows_department(text,uuid)'::regprocedure,
    'public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure,
    'public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure
  )
)
SELECT 'H1C.06_SERVICE_ROLE_HELPER_EXECUTE' AS section,
       helper.exact_signature,
       has_function_privilege('service_role', helper.oid, 'EXECUTE') AS service_role_execute
FROM helpers helper
ORDER BY helper.exact_signature;
